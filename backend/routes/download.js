/**
 * routes/download.js
 * POST /api/download
 *
 * Body: { url: "https://www.instagram.com/reel/..." }
 * Returns: { type, title, author, thumbnail, medias: [{ url, quality, ext }] }
 *
 * Uses yt-dlp under the hood — must be installed on the server.
 * Install: pip install yt-dlp   (updates frequently; keep current)
 *
 * Alternative: swap out the yt-dlp logic and use a third-party API
 * like RapidAPI Instagram Downloader (see comments below).
 */

const express  = require('express');
const router   = express.Router();
const { exec } = require('child_process');
const util     = require('util');
const fetch = require('node-fetch');

const execAsync = util.promisify(exec);

// ─── Analytics counter (in-memory; replace with DB in production) ──
const stats = require('../utils/stats');

// ─── Validate Instagram URL ────────────────────────────────
function isValidInstagramURL(url) {
  try {
    const u = new URL(url);
    const validHostnames = ['www.instagram.com', 'instagram.com'];
    const validPaths = ['/reel/', '/p/', '/tv/', '/stories/'];

    if (!validHostnames.includes(u.hostname)) return false;
    if (!validPaths.some(p => u.pathname.includes(p))) return false;
    return true;
  } catch {
    return false;
  }
}

// ─── Extract media info via yt-dlp ────────────────────────
async function extractWithYtDlp(url) {
  /**
   * yt-dlp flags used:
   *  --dump-json       → output JSON metadata without downloading
   *  --no-playlist     → don't expand playlists
   *  --no-warnings     → suppress non-critical warnings
   *
   * For authenticated private content (not supported by default), you can
   * pass cookies: --cookies /path/to/cookies.txt
   */
  const cmd = `yt-dlp --dump-json --no-playlist --no-warnings "${url}"`;

  const { stdout } = await execAsync(cmd, {
    timeout: 30000, // 30 second timeout
    maxBuffer: 1024 * 1024 * 10, // 10MB buffer
  });

  const info = JSON.parse(stdout.trim());

  // Build medias array from formats
  const medias = [];

  if (info.formats) {
    // Find best video+audio format
    const bestVideo = info.formats
      .filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.url)
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    if (bestVideo.length > 0) {
      const f = bestVideo[0];
      medias.push({
        url: f.url,
        quality: f.height ? `${f.height}p` : 'HD',
        ext: f.ext || 'mp4',
      });
    }

    // Add fallback lower quality if available
    if (bestVideo.length > 1) {
      const f = bestVideo[Math.min(2, bestVideo.length - 1)];
      medias.push({
        url: f.url,
        quality: f.height ? `${f.height}p` : 'SD',
        ext: f.ext || 'mp4',
      });
    }
  } else if (info.url) {
    // Direct URL (photos)
    medias.push({
      url: info.url,
      quality: 'Original',
      ext: info.ext || 'jpg',
    });
  }

  return {
    type: info.ext === 'jpg' || info.ext === 'jpeg' ? 'photo' : 'video',
    title: info.title || info.description || 'Instagram Media',
    author: info.uploader || info.uploader_id || '',
    thumbnail: info.thumbnail || '',
    medias,
  };
}

// ─── Alternative: RapidAPI Instagram Downloader ──────────
// Uncomment and configure this to use a third-party API instead of yt-dlp.
// Sign up at https://rapidapi.com/search/instagram%20downloader
//
// async function extractWithRapidAPI(url) {
//   const fetch = require('node-fetch');
//   const response = await fetch(`https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/?url=${encodeURIComponent(url)}`, {
//     method: 'GET',
//     headers: {
//       'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
//       'X-RapidAPI-Host': 'instagram-downloader-download-instagram-videos-stories.p.rapidapi.com'
//     }
//   });
//   const data = await response.json();
//   // Map response to our format...
//   return { type: 'video', title: data.title, author: data.username, thumbnail: data.thumbnail, medias: [{ url: data.url, quality: 'HD', ext: 'mp4' }] };
// }

// ─── POST /api/download ────────────────────────────────────
router.post('/', async (req, res) => {
  const { url } = req.body;

  // 1. Validate input
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required.' });
  }

  const sanitizedUrl = url.trim().slice(0, 500); // Limit URL length

  if (!isValidInstagramURL(sanitizedUrl)) {
    return res.status(400).json({
      error: 'Invalid Instagram URL. Please use a valid public Instagram link (Reel, Photo, Video, or IGTV).'
    });
  }

  // 2. Extract media info
  try {
    console.log(`[Download] Processing: ${sanitizedUrl}`);

    const result = await extractWithYtDlp(sanitizedUrl);

    if (!result.medias || result.medias.length === 0) {
      return res.status(422).json({
        error: 'No downloadable media found. The content may be private or unavailable.'
      });
    }

    // 3. Track analytics
    stats.increment('downloads');

    // 4. Return result
    return res.json(result);

  } catch (err) {
    console.error('[Download Error]', err.message);

    // Handle specific yt-dlp errors
    if (err.message?.includes('Private video')) {
      return res.status(403).json({ error: 'This content is private and cannot be downloaded.' });
    }
    if (err.message?.includes('not available')) {
      return res.status(404).json({ error: 'Content not found or no longer available.' });
    }
    if (err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
      return res.status(500).json({ error: 'Media is too large to process. Try a different link.' });
    }
    if (err.killed) {
      return res.status(504).json({ error: 'Request timed out. Please try again.' });
    }

    return res.status(500).json({
      error: 'Download failed. Please make sure the link is public and try again.'
    });
  }
});
router.get('/file', async (req, res) => {

  try {

    const fileUrl = req.query.url;

    if (!fileUrl) {

      return res.status(400).json({
        error: 'Missing URL'
      });

    }

    const response = await fetch(fileUrl);

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="reelgrab.mp4"'
    );

    res.setHeader(
      'Content-Type',
      'video/mp4'
    );

    response.body.pipe(res);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: 'Download failed'
    });

  }

});
module.exports = router;
