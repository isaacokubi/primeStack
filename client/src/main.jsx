import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './AppNew.jsx';
import InquiryConversationWidget from './inquiries/InquiryConversationWidget.jsx';
import './styles.css';
import './homepage.css';
import './portal.css';
import './ui-fixes.css';
import './professional-ui.css';
import './customer/CustomerDashboard.css';
import './admin/admin-sidebar-fix.css';
import './founder-image-fix.css';
import './dark-background-contrast.css';
import './dashboard-light-contrast.css';
import './dashboard-contrast-runtime.css';
import './runtime-brand-sync.js';
import './dashboard-contrast-runtime.js';

const hideDecorativeSvg = (root = document) => {
  root.querySelectorAll('svg').forEach((svg) => {
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.removeAttribute('role');
  });
};

// Run once at startup. A document-wide observer that mutates SVG attributes can
// continuously retrigger itself and make the SPA unresponsive.
hideDecorativeSvg();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <InquiryConversationWidget />
    </BrowserRouter>
  </React.StrictMode>,
);
