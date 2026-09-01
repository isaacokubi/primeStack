import { siteSettingsApi } from './services/api.js';

const BRAND_EVENT = 'primeStackSiteSettingsChanged';
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION']);

let currentName = '';
let observer = null;
let refreshTimer = null;

const escapeRegExp = value => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const replaceText = root => {
  if (!currentName || !root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return /primestack/i.test(node.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);

  const pattern = /primestack/gi;
  nodes.forEach(textNode => {
    textNode.nodeValue = textNode.nodeValue.replace(pattern, currentName);
  });
};

const setBrand = name => {
  const normalized = String(name || '').trim();
  if (!normalized) return;
  currentName = normalized;
  document.documentElement.dataset.companyName = normalized;
  document.documentElement.style.setProperty('--site-company-name', JSON.stringify(normalized));
  replaceText(document.body);
};

const refresh = async () => {
  try {
    const response = await siteSettingsApi.get();
    const settings = response.data?.data;
    if (settings?.name) setBrand(settings.name);
  } catch {
    // Public pages and the CMS already have their own fallbacks.
  }
};

const start = () => {
  refresh();

  window.addEventListener(BRAND_EVENT, refresh);
  window.addEventListener('focus', refresh);

  observer = new MutationObserver(mutations => {
    if (!currentName) return;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) replaceText(node.parentElement);
        else if (node.nodeType === Node.ELEMENT_NODE) replaceText(node);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  refreshTimer = window.setInterval(refresh, 30000);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
