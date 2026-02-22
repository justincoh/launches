export function observeResize(element, callback) {
  let lastW = 0;
  let timer = null;
  const ro = new ResizeObserver(entries => {
    for (const entry of entries) {
      const w = Math.floor(entry.contentRect.width);
      if (w === lastW || w === 0) return;
      lastW = w;
      clearTimeout(timer);
      timer = setTimeout(() => callback({ width: w }), 150);
    }
  });
  ro.observe(element);
  return () => ro.disconnect();
}

export function isMobile() {
  return window.innerWidth < 768;
}
