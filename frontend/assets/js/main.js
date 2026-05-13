/**
 * ReelGrab – Main JavaScript
 */

// ─── CONFIG ───────────────────────────────────────────────
const API_BASE_URL = 'https://reelgrab-gg8q.onrender.com';

// ─── DOM REFS ─────────────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const urlInput = document.getElementById('urlInput');
const downloadBtn = document.getElementById('downloadBtn');
const pasteBtn = document.getElementById('pasteBtn');
const statusMsg = document.getElementById('statusMsg');
const loaderBar = document.getElementById('loaderBar');
const resultArea = document.getElementById('resultArea');
const historyList = document.getElementById('historyList');
const backToTop = document.getElementById('backToTop');
const yearEl = document.getElementById('year');

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  initTheme();
  initNavbar();
  initFAQ();
  initBackToTop();
  renderHistory();

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  animateCounter('downloadCount', 2400000, 2400, 'M+');

});

// ─── THEME ────────────────────────────────────────────────
function initTheme() {

  const saved =
    localStorage.getItem('rg-theme') || 'dark';

  document.documentElement.setAttribute(
    'data-theme',
    saved
  );

  themeToggle?.addEventListener('click', () => {

    const current =
      document.documentElement.getAttribute(
        'data-theme'
      );

    const next =
      current === 'dark'
        ? 'light'
        : 'dark';

    document.documentElement.setAttribute(
      'data-theme',
      next
    );

    localStorage.setItem(
      'rg-theme',
      next
    );

  });

}

// ─── NAVBAR ───────────────────────────────────────────────
function initNavbar() {

  hamburger?.addEventListener('click', () => {

    navLinks?.classList.toggle('open');

    hamburger.classList.toggle('active');

  });

  document.querySelectorAll('.nav-link')
    .forEach(link => {

      link.addEventListener('click', () => {

        navLinks?.classList.remove('open');

      });

    });

}

// ─── FAQ ──────────────────────────────────────────────────
function initFAQ() {

  document
    .querySelectorAll('.faq-question')
    .forEach(btn => {

      btn.addEventListener('click', () => {

        const item =
          btn.closest('.faq-item');

        const isOpen =
          item.classList.contains('open');

        document
          .querySelectorAll('.faq-item')
          .forEach(i =>
            i.classList.remove('open')
          );

        if (!isOpen) {
          item.classList.add('open');
        }

      });

    });

}

// ─── BACK TO TOP ──────────────────────────────────────────
function initBackToTop() {

  window.addEventListener('scroll', () => {

    if (backToTop) {

      backToTop.classList.toggle(
        'visible',
        window.scrollY > 500
      );

    }

  });

  backToTop?.addEventListener('click', () => {

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  });

}

// ─── PASTE BUTTON ─────────────────────────────────────────
pasteBtn?.addEventListener('click', async () => {

  try {

    const text =
      await navigator.clipboard.readText();

    if (urlInput) {

      urlInput.value = text;

      urlInput.focus();

      showStatus(
        'Link pasted!',
        'success'
      );

      setTimeout(() => {

        showStatus('', '');

      }, 2000);

    }

  } catch {

    showStatus(
      'Clipboard access denied.',
      'error'
    );

  }

});

// ─── DOWNLOAD ─────────────────────────────────────────────
downloadBtn?.addEventListener(
  'click',
  handleDownload
);

urlInput?.addEventListener(
  'keydown',
  e => {

    if (e.key === 'Enter') {
      handleDownload();
    }

  }
);

async function handleDownload() {

  const url =
    urlInput?.value.trim();

  if (!url) {

    showStatus(
      '⚠️ Paste Instagram link first.',
      'error'
    );

    return;

  }

  if (!isValidInstagramURL(url)) {

    showStatus(
      '❌ Invalid Instagram URL.',
      'error'
    );

    return;

  }

  showStatus(
    '🔄 Fetching media...',
    'info'
  );

  showLoader(true);

  clearResult();

  setDownloadBtnLoading(true);

  try {

    const response = await fetch(
      `${API_BASE_URL}/api/download`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          url
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok || data.error) {

      throw new Error(
        data.error ||
        'Download failed'
      );

    }

    showStatus(
      '✅ Ready to download!',
      'success'
    );

    renderResult(data);

    addToHistory(data, url);

  } catch (err) {

    showStatus(
      `❌ ${err.message}`,
      'error'
    );

  } finally {

    showLoader(false);

    setDownloadBtnLoading(false);

  }

}

// ─── VALIDATION ───────────────────────────────────────────
function isValidInstagramURL(url) {

  try {

    const u = new URL(url);

    return (
      (
        u.hostname === 'www.instagram.com' ||
        u.hostname === 'instagram.com'
      ) &&
      (
        u.pathname.includes('/reel/') ||
        u.pathname.includes('/p/') ||
        u.pathname.includes('/tv/')
      )
    );

  } catch {

    return false;

  }

}

// ─── RENDER RESULT ────────────────────────────────────────
function renderResult(data) {

  if (!resultArea) return;

  const quality =
    data.medias?.[0]?.quality || 'HD';

  let downloadLinks =
    (data.medias || []).map(m => `

      <a
        href="${API_BASE_URL}/api/download/file?url=${encodeURIComponent(m.url)}"
        class="result-dl-btn"
      >
        ⬇ Download ${m.quality || ''}
      </a>

    `).join('');

  if (!downloadLinks) {

    downloadLinks =
      `<span>No download links</span>`;

  }

  resultArea.innerHTML = `

    <div class="result-card">

      <div class="result-info">

        <h4>
          ${data.title || 'Instagram Media'}
        </h4>

        <p>
          By @${data.author || 'unknown'}
          · ${data.type || 'Media'}
          · ${quality}
        </p>

      </div>

      <div
        style="
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          justify-content:flex-end;
        "
      >
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

    downloadUrl:
      data.medias?.[0]?.url || '',

    type:
      data.type || 'media',

    title:
      data.title || 'Instagram Media',

    author:
      data.author || '',

    timestamp:
      new Date().toLocaleTimeString()

  };

  history.unshift(entry);

  if (history.length > 20) {

    history = history.slice(0, 20);

  }

  sessionStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(history)
  );

  renderHistory();

}

function getHistory() {

  try {

    return JSON.parse(
      sessionStorage.getItem(HISTORY_KEY)
      || '[]'
    );

  } catch {

    return [];

  }

}

function renderHistory() {

  if (!historyList) return;

  const history = getHistory();

  if (!history.length) {

    historyList.innerHTML = `

      <div class="history-empty">

        <span>📭</span>

        <p>
          No downloads yet.
        </p>

      </div>

    `;

    return;

  }

  const icon = t =>
    t === 'video'
      ? '🎬'
      : '🖼️';

  historyList.innerHTML =
    history.map(h => `

      <div class="history-item">

        <div class="history-icon">
          ${icon(h.type)}
        </div>

        <div class="history-info">

          <h4>
            ${h.title}
          </h4>

          <p>
            @${h.author || 'unknown'}
            · ${h.timestamp}
          </p>

        </div>

      </div>

    `).join('');

}

// ─── UI HELPERS ───────────────────────────────────────────
function showStatus(msg, type) {

  if (!statusMsg) return;

  statusMsg.textContent = msg;

  statusMsg.className =
    `status-msg ${type}`;

}

function showLoader(show) {

  if (!loaderBar) return;

  loaderBar.classList.toggle(
    'active',
    show
  );

}

function clearResult() {

  if (resultArea) {

    resultArea.innerHTML = '';

  }

}

function setDownloadBtnLoading(loading) {

  if (!downloadBtn) return;

  downloadBtn.disabled = loading;

  downloadBtn.innerHTML = loading
    ? 'Processing...'
    : 'Download';

}

// ─── COUNTER ──────────────────────────────────────────────
function animateCounter(
  id,
  target,
  duration,
  suffix
) {

  const el =
    document.getElementById(id);

  if (!el) return;

  const start =
    performance.now();

  function update(now) {

    const progress =
      Math.min(
        (now - start) / duration,
        1
      );

    const val =
      Math.floor(progress * target);

    if (val >= 1000000) {

      el.textContent =
        (val / 1000000).toFixed(1)
        + suffix;

    } else {

      el.textContent =
        val + '+';

    }

    if (progress < 1) {

      requestAnimationFrame(update);

    }

  }

  requestAnimationFrame(update);

}
