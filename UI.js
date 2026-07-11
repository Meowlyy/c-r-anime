// Minimal DOM-based UI overlay system.
// Provides the `UI` global expected by Game.js: UI.label(), UI.button(),
// UI.bar(), UI.panel(), UI.showGroup(), UI.hideGroup().
// Elements are absolutely positioned children of #ui-layer.
const UI = (() => {
  const layer = document.getElementById('ui-layer');
  const groups = {}; // groupName -> [elements]

  function registerGroup(el, group) {
    if (!group) return;
    if (!groups[group]) groups[group] = [];
    groups[group].push(el);
  }

  function px(v) {
    return typeof v === 'string' ? v : v + 'px';
  }

  function applyAnchor(el, anchor, x, y) {
    x = x || 0;
    y = y || 0;
    el.style.position = 'absolute';
    switch (anchor) {
      case 'top':
        el.style.top = y + 'px';
        el.style.left = '50%';
        el.style.transform = `translate(calc(-50% + ${x}px), 0)`;
        break;
      case 'bottom':
        el.style.bottom = y + 'px';
        el.style.left = '50%';
        el.style.transform = `translate(calc(-50% + ${x}px), 0)`;
        break;
      case 'top-left':
        el.style.top = y + 'px';
        el.style.left = x + 'px';
        break;
      case 'top-right':
        el.style.top = y + 'px';
        el.style.right = x + 'px';
        break;
      case 'bottom-left':
        el.style.bottom = y + 'px';
        el.style.left = x + 'px';
        break;
      case 'bottom-right':
        el.style.bottom = y + 'px';
        el.style.right = x + 'px';
        break;
      case 'center':
      default:
        el.style.top = '50%';
        el.style.left = '50%';
        el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        break;
    }
  }

  // Applies the shared visual options (background, color, borderRadius,
  // width, height, plus a raw `style` object) both at creation and via
  // .update(). Does not touch position/anchor.
  function applyVisualOpts(el, opts) {
    if (opts.background != null) el.style.background = opts.background;
    if (opts.color != null) el.style.color = opts.color;
    if (opts.borderRadius != null) el.style.borderRadius = px(opts.borderRadius);
    if (opts.width != null) el.style.width = px(opts.width);
    if (opts.height != null) el.style.height = px(opts.height);
    if (opts.fontSize != null) el.style.fontSize = px(opts.fontSize);
    if (opts.fontWeight != null) el.style.fontWeight = opts.fontWeight;
    if (opts.textAlign != null) el.style.textAlign = opts.textAlign;
    if (opts.style) {
      for (const key in opts.style) {
        el.style[key] = opts.style[key];
      }
    }
  }

  function baseElement(opts, extraDisplay) {
    const el = document.createElement('div');
    applyAnchor(el, opts.anchor, opts.x, opts.y);
    applyVisualOpts(el, opts);
    const display = extraDisplay || 'block';
    el._display = display;
    el.style.display = opts.visible === false ? 'none' : display;
    registerGroup(el, opts.group);
    layer.appendChild(el);
    return el;
  }

  function label(opts) {
    opts = opts || {};
    const el = baseElement(opts, 'block');
    el.style.whiteSpace = el.style.whiteSpace || 'pre-line';
    el.textContent = opts.text || '';
    const api = {
      el,
      set(text) { el.textContent = text; return api; },
      setColor(color) { el.style.color = color; return api; },
      show() { el.style.display = el._display; return api; },
      hide() { el.style.display = 'none'; return api; },
      update(o) { applyVisualOpts(el, o || {}); return api; },
    };
    return api;
  }

  function button(opts) {
    opts = opts || {};
    const el = baseElement(opts, 'flex');
    el.style.alignItems = 'center';
    el.style.justifyContent = (opts.style && opts.style.textAlign === 'left') ? 'flex-start' : 'center';
    el.style.whiteSpace = el.style.whiteSpace || 'pre-line';
    el.style.cursor = 'pointer';
    el.style.userSelect = 'none';
    el.style.boxSizing = 'border-box';
    el.textContent = opts.text || '';
    if (typeof opts.onClick === 'function') {
      el.addEventListener('click', (e) => { e.stopPropagation(); opts.onClick(); });
      el.addEventListener('pointerdown', (e) => e.stopPropagation());
    }
    const api = {
      el,
      set(text) { el.textContent = text; return api; },
      setColor(color) { el.style.color = color; return api; },
      show() { el.style.display = el._display; return api; },
      hide() { el.style.display = 'none'; return api; },
      update(o) {
        o = o || {};
        applyVisualOpts(el, o);
        if (o.style && o.style.textAlign) {
          el.style.justifyContent = o.style.textAlign === 'left' ? 'flex-start' : 'center';
        }
        return api;
      },
    };
    return api;
  }

  function bar(opts) {
    opts = opts || {};
    const el = baseElement(opts, 'block');
    el.style.position = el.style.position; // keep absolute
    el.style.overflow = 'hidden';
    el.style.boxSizing = 'border-box';
    const fill = document.createElement('div');
    fill.style.height = '100%';
    fill.style.background = opts.color || '#c026d3';
    fill.style.transition = 'width 0.15s ease-out';
    const initial = opts.value != null ? opts.value : 1;
    fill.style.width = Math.max(0, Math.min(1, initial)) * 100 + '%';
    el.appendChild(fill);
    const api = {
      el,
      setValue(fraction) {
        fill.style.width = Math.max(0, Math.min(1, fraction)) * 100 + '%';
        return api;
      },
      show() { el.style.display = el._display; return api; },
      hide() { el.style.display = 'none'; return api; },
      update(o) { applyVisualOpts(el, o || {}); return api; },
    };
    return api;
  }

  function panel(opts) {
    opts = opts || {};
    const el = baseElement(opts, 'block');
    el.style.boxSizing = 'border-box';
    const api = {
      el,
      show() { el.style.display = el._display; return api; },
      hide() { el.style.display = 'none'; return api; },
      update(o) { applyVisualOpts(el, o || {}); return api; },
    };
    return api;
  }

  function showGroup(group) {
    (groups[group] || []).forEach((el) => { el.style.display = el._display; });
  }

  function hideGroup(group) {
    (groups[group] || []).forEach((el) => { el.style.display = 'none'; });
  }

  return { label, button, bar, panel, showGroup, hideGroup };
})();
