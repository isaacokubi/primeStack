import { siteSettingsApi } from './services/api.js';

const BRAND_EVENT = 'primeStackSiteSettingsChanged';
let currentName = '';
let refreshTimer = null;

const replaceText = root => {
  if (!currentName || !root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|SELECT|OPTION)$/.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return /primestack/i.test(node.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  nodes.forEach(textNode => {
    const next = textNode.nodeValue.replace(/primestack/gi, currentName);
    if (next !== textNode.nodeValue) textNode.nodeValue = next;
  });
};

const setBrand = name => {
  const normalized = String(name || '').trim();
  if (!normalized || normalized === currentName) return;
  currentName = normalized;
  document.documentElement.dataset.companyName = normalized;
  document.documentElement.style.setProperty('--site-company-name', JSON.stringify(normalized));
  document.querySelectorAll('.adminProLogo').forEach(el => { el.textContent = normalized.charAt(0).toUpperCase(); });
  replaceText(document.body);
};

const refresh = async () => {
  try {
    const response = await siteSettingsApi.get();
    const settings = response.data?.data;
    if (settings?.name) setBrand(settings.name);
  } catch {
    // Keep local UI fallbacks when the CMS API is unavailable.
  }
};

const scheduleRefresh = () => {
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(refresh, 250);
};

const start = () => {
  refresh();
  window.addEventListener(BRAND_EVENT, scheduleRefresh);
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
