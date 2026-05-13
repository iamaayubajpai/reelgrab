/**
 * ReelGrab – Main JavaScript
 * Handles: theme toggle, download logic, FAQ, history, navbar
 *
 * API endpoint: POST /api/download  { url: "instagram_url" }
 * Replace API_BASE_URL with your backend URL when deploying.
 */

// ─── CONFIG ───────────────────────────────────────────────
const API_BASE_URL = 'https://reelgrab-gg8q.onrender.com/'; // Change to your deployed backend URL

// ─── DOM REFS ─────────────────────────────────────────────
const themeToggle  = document.getElementById('themeToggle');
const hamburger    = document.getElementById('hamburger');
const navLinks     = document.getElementById('navLinks');
const urlInput     = document.getElementById('urlInput');
const downloadBtn  = document.getElementById('downloadBtn');
const pasteBtn     = document.getElementById('pasteBtn');
const statusMsg    = document.getElementById('statusMsg');
const loaderBar    = document.getElementById('loaderBar');
const resultArea   = document.getElementById('resultArea');
const historyList  = document.getElementById('historyList');
const backToTop    = document.getElementById('backToTop');
const yearEl       = document.getElementById('year');

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbar();
  initFAQ();
  initBackToTop();
  renderHistory();
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Animate download count
  animateCounter('downloadCount', 2400000, 2400, 'M+');
});

// ─── THEME ────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('rg-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  themeToggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('rg-theme', next);
  });
}

// ─── NAVBAR ───────────────────────────────────────────────
function initNavbar() {
  hamburger?.addEventListener('click', () => {
    navLinks?.classList.toggle('open');
    hamburger.classList.toggle('active');
  });

  // Close mobile menu when link clicked
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => navLinks?.classList.remove('open'));
  });

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (navbar) {
      navbar.style.boxShadow = window.scrollY > 20
        ? '0 4px 30px rgba(0,0,0,0.15)'
        : 'none';
    }
  }, { passive: true });
}

// ─── FAQ ──────────────────────────────────────────────────
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));

      // Toggle current
      if (!isOpen) item.classList.add('open');
    });
  });
}

// ─── BACK TO TOP ──────────────────────────────────────────
function initBackToTop() {
  window.addEventListener('scroll', () => {
    if (backToTop) {
      backToTop.classList.toggle('visible', window.scrollY > 500);
    }
  }, { passive: true });

  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ─── PASTE BUTTON ─────────────────────────────────────────
pasteBtn?.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (urlInput) {
      urlInput.value = text;
      urlInput.focus();
      showStatus('Link pasted!', 'success');
      setTimeout(() => showStatus('', ''), 2000);
    }
  } catch {
    showStatus('Clipboard access denied. Please paste manually.', 'error');
  }
});

// ─── DOWNLOAD ─────────────────────────────────────────────
downloadBtn?.addEventListener('click', handleDownload);
urlInput?.addEventListener('keydown', e => { if (e.key === 'Enter') handleDownload(); });

async function handleDownload() {
  const url = urlInput?.value.trim();

  // Validate
  if (!url) {
    showStatus('⚠️ Please paste an Instagram link first.', 'error');
    urlInput?.focus();
    return;
  }

  if (!isValidInstagramURL(url)) {
    showStatus('❌ Invalid Instagram URL. Make sure it starts with https://www.instagram.com/', 'error');
    return;
  }

  // Reset UI
  showStatus('🔄 Fetching your media…', 'info');
  showLoader(true);
  clearResult();
  setDownloadBtnLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || 'Download failed. Please try again.');
    }

    // Success
    showStatus('✅ Ready to download!', 'success');
    showLoader(false);
    renderResult(data);
    addToHistory(data, url);

  } catch (err) {
    showLoader(false);
    showStatus(`❌ ${err.message}`, 'error');
  } finally {
    setDownloadBtnLoading(false);
  }
}

// ─── VALIDATION ───────────────────────────────────────────
function isValidInstagramURL(url) {
  try {
    const u = new URL(url);
    return (
      (u.hostname === 'www.instagram.com' || u.hostname === 'instagram.com') &&
      (
        u.pathname.includes('/reel/') ||
        u.pathname.includes('/p/') ||
        u.pathname.includes('/tv/') ||
        u.pathname.includes('/stories/') ||
        u.pathname.match(/^\/[a-zA-Z0-9_.]+\/?$/) // profile page fallback
      )
    );
  } catch { return false; }
}

// ─── RENDER RESULT ────────────────────────────────────────
function renderResult(data) {
  if (!resultArea) return;

  /*
   * Expected API response shape:
   * {
   *   type: 'video' | 'photo' | 'carousel',
   *   title: string,
   *   thumbnail: string (URL),
   *   medias: [{ url, quality, ext }],
   *   author: string
   * }
   */

  const icon = data.type === 'video' ? '🎬' : data.type === 'photo' ? '🖼️' : '🎞️';
  const quality = data.medias?.[0]?.quality || 'HD';

  let downloadLinks = (data.medias || []).map((m, i) => `
    <a href="${m.url}" download class="result-dl-btn" target="_blank" rel="noopener">
      ⬇ ${m.quality || 'Download'} ${m.ext ? '.' + m.ext : ''}
    </a>
  `).join('');

  if (!downloadLinks) {
    downloadLinks = `<a href="${data.url || '#'}" download class="result-dl-btn" target="_blank" rel="noopener">⬇ Download</a>`;
  }

  resultArea.innerHTML = `
    <div class="result-card">
      <div class="result-thumb">
        ${data.thumbnail
          ? `<img src="${data.thumbnail}" alt="Media thumbnail" loading="lazy" />`
          : `<span>${icon}</span>`
        }
      </div>
      <div class="result-info">
        <h4>${data.title || 'Instagram ' + (data.type || 'Media')}</h4>
        <p>By @${data.author || 'unknown'} · ${data.type || 'Media'} · ${quality}</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
        ${downloadLinks}
      </div>
    </div>
  `;
}

// ─── DOWNLOAD HISTORY ─────────────────────────────────────
const HISTORY_KEY = 'rg-history';

function addToHistory(data, originalUrl) {
  if (!historyList) return;

  let history = getHistory();
  const entry = {
    id: Date.now(),
    url: originalUrl,
    downloadUrl: data.medias?.[0]?.url || data.url,
    type: data.type || 'media',
    title: data.title || 'Instagram Media',
    author: data.author || '',
    timestamp: new Date().toLocaleTimeString()
  };

  history.unshift(entry);
  if (history.length > 20) history = history.slice(0, 20); // Keep last 20
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function getHistory() {
  try {
    return JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

function renderHistory() {
  if (!historyList) return;

  const history = getHistory();
  if (!history.length) {
    historyList.innerHTML = `
      <div class="history-empty">
        <span>📭</span>
        <p>No downloads yet. Paste a link above to get started!</p>
      </div>
    `;
    return;
  }

  const icon = t => t === 'video' ? '🎬' : t === 'photo' ? '🖼️' : '🎞️';

  historyList.innerHTML = history.map(h => `
    <div class="history-item">
      <div class="history-icon">${icon(h.type)}</div>
      <div class="history-info">
        <h4>${h.title}</h4>
        <p>@${h.author || 'unknown'} · ${h.timestamp}</p>
      </div>
      ${h.downloadUrl
        ? `<a href="${h.downloadUrl}" class="history-link" target="_blank" rel="noopener">Download ↗</a>`
        : ''
      }
    </div>
  `).join('');
}

// ─── UI HELPERS ───────────────────────────────────────────
function showStatus(msg, type) {
  if (!statusMsg) return;
  statusMsg.textContent = msg;
  statusMsg.className = `status-msg ${type}`;
}

function showLoader(show) {
  if (!loaderBar) return;
  loaderBar.classList.toggle('active', show);
}

function clearResult() {
  if (resultArea) resultArea.innerHTML = '';
}

function setDownloadBtnLoading(loading) {
  if (!downloadBtn) return;
  downloadBtn.disabled = loading;
  downloadBtn.innerHTML = loading
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 1s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Processing…`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download`;
}

// Spinner animation for loading button
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);

// ─── COUNTER ANIMATION ────────────────────────────────────
function animateCounter(id, target, duration, suffix) {
  const el = document.getElementById(id);
  if (!el) return;

  const start = performance.now();
  const startVal = 0;

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const val = Math.floor(eased * target);

    if (val >= 1000000) {
      el.textContent = (val / 1000000).toFixed(1) + suffix;
    } else if (val >= 1000) {
      el.textContent = (val / 1000).toFixed(0) + 'K+';
    } else {
      el.textContent = val + '+';
    }

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}
