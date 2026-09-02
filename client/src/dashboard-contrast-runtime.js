const DASHBOARD_ROOTS = ['.adminPro', '.adminShell', '.adminMain', '.customerShell'];
const TEXT_TAGS = new Set(['P','SPAN','STRONG','B','SMALL','LABEL','A','BUTTON','H1','H2','H3','H4','H5','H6','LI','TD','TH','OPTION','INPUT','TEXTAREA','SELECT']);

const parseRgb = value => {
  const match = String(value || '').match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (!match) return null;
  const alpha = match[4] === undefined ? 1 : Number(match[4]);
  return alpha > 0.02 ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
};
const luminance = ([r,g,b]) => {
  const channel = value => { const v = value / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
const nearestBackground = element => {
  let node = element;
  while (node && node !== document.documentElement) {
    const rgb = parseRgb(window.getComputedStyle(node).backgroundColor);
    if (rgb) return { rgb, node };
    node = node.parentElement;
  }
  const root = element.closest('.adminPro, .adminShell, .adminMain, .customerShell');
  if (root) {
    if (String(root.className || '').includes('adminPro')) return { rgb:[7,17,30], node:root };
    const rgb = parseRgb(window.getComputedStyle(root).backgroundColor);
    if (rgb) return { rgb, node:root };
  }
  return null;
};
const applyContrast = element => {
  if (!element?.matches?.([...TEXT_TAGS].join(','))) return;
  const background = nearestBackground(element);
  if (!background) return;
  if (luminance(background.rgb) < 0.38) element.setAttribute('data-dashboard-dark-text','true');
  else element.removeAttribute('data-dashboard-dark-text');
};
const auditDashboards = () => document.querySelectorAll(DASHBOARD_ROOTS.map(root => `${root} *`).join(',')).forEach(applyContrast);
const start = () => {
  window.requestAnimationFrame(auditDashboards);
  window.addEventListener('resize', auditDashboards, { passive:true });
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
else start();
