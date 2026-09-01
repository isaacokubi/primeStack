/* Runtime contrast guard for every dashboard surface.
   It inspects the nearest painted background so dynamically rendered dashboard
   content cannot leave dark-surface text in an unreadable colour. */

const DASHBOARD_ROOTS = [
  '.adminPro',
  '.adminShell',
  '.adminMain',
  '.customerShell',
  '[class*="Dashboard"]',
  '[class*="dashboard"]',
];

const TEXT_TAGS = new Set([
  'A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION',
  'LABEL', 'P', 'SPAN', 'SMALL', 'STRONG', 'B', 'EM', 'I',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH',
]);

const TRANSPARENT = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)/i;

const parseRgb = value => {
  const match = String(value || '').match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/i);
  if (!match) return null;
  const alpha = match[4] === undefined ? 1 : Number(match[4]);
  return alpha > 0.02 ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
};

const luminance = ([r, g, b]) => {
  const channel = value => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const isDashboardElement = element => element?.closest?.(DASHBOARD_ROOTS.join(','));

const nearestBackground = element => {
  let node = element;
  while (node && node !== document.documentElement) {
    const styles = window.getComputedStyle(node);
    const rgb = parseRgb(styles.backgroundColor);
    if (rgb) return { rgb, node };
    node = node.parentElement;
  }

  const root = element.closest('.adminPro, .adminShell, .adminMain, .customerShell');
  if (root) {
    const className = String(root.className || '');
    /* adminPro is a dark dashboard with a gradient, so backgroundColor is transparent. */
    if (className.includes('adminPro')) return { rgb: [7, 17, 30], node: root };
    const rootRgb = parseRgb(window.getComputedStyle(root).backgroundColor);
    if (rootRgb) return { rgb: rootRgb, node: root };
  }

  return null;
};

const hasVisibleText = element => {
  if (!TEXT_TAGS.has(element.tagName)) return false;
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') return true;
  return Boolean((element.textContent || '').trim());
};

const applyContrast = element => {
  if (!isDashboardElement(element) || !hasVisibleText(element)) return;

  const background = nearestBackground(element);
  if (!background) return;

  const dark = luminance(background.rgb) < 0.38;
  if (dark) {
    element.setAttribute('data-dashboard-dark-text', 'true');
  } else {
    element.removeAttribute('data-dashboard-dark-text');
  }
};

const auditDashboards = () => {
  const elements = document.querySelectorAll([
    ...DASHBOARD_ROOTS,
    ...DASHBOARD_ROOTS.map(root => `${root} *`),
  ].join(','));

  elements.forEach(applyContrast);
};

const start = () => {
  auditDashboards();

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      auditDashboards();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('focus', schedule);
  window.setInterval(auditDashboards, 3000);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
