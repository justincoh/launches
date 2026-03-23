const THEME_KEY = 'launch-stats-theme';
const ATOMPUNK = 'atompunk';

let fontsLoaded = false;

function loadAtompunkFonts() {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Jost:wght@300;400;600;700&family=Russo+One&family=VT323&display=swap';
  document.head.appendChild(link);
}

function applyTheme(theme) {
  if (theme === ATOMPUNK) {
    loadAtompunkFonts();
    document.documentElement.setAttribute('data-theme', ATOMPUNK);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

function updateLabel(btn, theme) {
  btn.textContent = theme === ATOMPUNK ? '\u25c6 Default' : '\u2622 Go Retro';
  btn.title = theme === ATOMPUNK
    ? 'Switch to default theme'
    : 'Switch to retro theme';
}

export function initThemeToggle() {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved);

  const btn = document.createElement('button');
  btn.className = 'theme-toggle-btn';
  btn.setAttribute('aria-label', 'Toggle theme');
  updateLabel(btn, saved);

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === ATOMPUNK ? null : ATOMPUNK;
    applyTheme(next);

    if (next) {
      localStorage.setItem(THEME_KEY, next);
    } else {
      localStorage.removeItem(THEME_KEY);
    }

    updateLabel(btn, next);
    window.dispatchEvent(new CustomEvent('theme-change'));
  });

  const header = document.querySelector('.app-header');
  if (header) header.appendChild(btn);
}
