import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './AppNew.jsx';
import './styles.css';
import './homepage.css';
import './portal.css';
import './ui-fixes.css';
import './professional-ui.css';

// Lucide icons are decorative UI elements. Mark every SVG as hidden from
// accessibility/name extraction so labels such as "Explore products svg"
// never appear in navigation, buttons, cards, or footer links.
const hideDecorativeSvg = (root = document) => {
  root.querySelectorAll('svg').forEach((svg) => {
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.removeAttribute('role');
  });
};

hideDecorativeSvg();
const svgObserver = new MutationObserver(() => hideDecorativeSvg());
svgObserver.observe(document.documentElement, { childList: true, subtree: true });

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
