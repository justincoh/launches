let el = null;

function ensure() {
  if (!el) {
    el = document.createElement('div');
    el.className = 'd3-tooltip';
    document.body.appendChild(el);
  }
  return el;
}

export const tooltip = {
  show(html, event) {
    const t = ensure();
    t.innerHTML = html;
    t.classList.add('visible');
    this.move(event);
  },

  move(event) {
    const t = ensure();
    const pad = 12;
    let x = event.clientX + pad;
    let y = event.clientY + pad;
    const rect = t.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) x = event.clientX - rect.width - pad;
    if (y + rect.height > window.innerHeight) y = event.clientY - rect.height - pad;
    t.style.left = x + 'px';
    t.style.top = y + 'px';
  },

  hide() {
    if (el) el.classList.remove('visible');
  }
};
