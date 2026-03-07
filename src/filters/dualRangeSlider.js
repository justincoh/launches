export function createDualRangeSlider(absMin, absMax, initMin, initMax, onChange) {
  let curMin = initMin;
  let curMax = initMax;
  let rafId = null;

  const el = document.createElement('div');
  el.className = 'dual-range';

  const minLabel = document.createElement('span');
  minLabel.className = 'range-label';
  minLabel.textContent = curMin;

  const maxLabel = document.createElement('span');
  maxLabel.className = 'range-label';
  maxLabel.textContent = curMax;

  const track = document.createElement('div');
  track.className = 'dual-range-track';

  const fill = document.createElement('div');
  fill.className = 'dual-range-fill';
  track.appendChild(fill);

  const thumbMin = document.createElement('div');
  thumbMin.className = 'dual-range-thumb';
  thumbMin.tabIndex = 0;
  track.appendChild(thumbMin);

  const thumbMax = document.createElement('div');
  thumbMax.className = 'dual-range-thumb';
  thumbMax.tabIndex = 0;
  track.appendChild(thumbMax);

  el.append(minLabel, track, maxLabel);

  function valToFrac(val) {
    return (val - absMin) / (absMax - absMin);
  }

  function fracToVal(frac) {
    return Math.round(absMin + frac * (absMax - absMin));
  }

  function updatePositions() {
    const minFrac = valToFrac(curMin) * 100;
    const maxFrac = valToFrac(curMax) * 100;
    thumbMin.style.left = minFrac + '%';
    thumbMax.style.left = maxFrac + '%';
    fill.style.left = minFrac + '%';
    fill.style.width = (maxFrac - minFrac) + '%';
    minLabel.textContent = curMin;
    maxLabel.textContent = curMax;
  }

  function startDrag(thumb, isMin) {
    const onMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = track.getBoundingClientRect();
      let frac = (clientX - rect.left) / rect.width;
      frac = Math.max(0, Math.min(1, frac));
      let val = fracToVal(frac);

      if (isMin) {
        val = Math.min(val, curMax);
        curMin = val;
      } else {
        val = Math.max(val, curMin);
        curMax = val;
      }
      updatePositions();
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        onChange(curMin, curMax);
        rafId = null;
      });
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onUp);
  }

  thumbMin.addEventListener('mousedown', (e) => { e.preventDefault(); startDrag(thumbMin, true); });
  thumbMin.addEventListener('touchstart', (e) => { startDrag(thumbMin, true); }, { passive: true });
  thumbMax.addEventListener('mousedown', (e) => { e.preventDefault(); startDrag(thumbMax, false); });
  thumbMax.addEventListener('touchstart', (e) => { startDrag(thumbMax, false); }, { passive: true });

  updatePositions();

  return {
    el,
    reset() {
      curMin = initMin;
      curMax = initMax;
      updatePositions();
    }
  };
}
