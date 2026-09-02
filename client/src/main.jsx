import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './AppNew.jsx';
import InquiryConversationWidget from './inquiries/InquiryConversationWidget.jsx';
import './styles.css';
import './responsive.css';
import './homepage.css';
import './portal.css';
import './ui-fixes.css';
import './professional-ui.css';
import './customer/CustomerDashboard.css';
import './admin/admin-sidebar-fix.css';
import './admin/admin-green-blue-theme.css';
import './admin/admin-sidebar-visibility-fix.css';
import './founder-image-fix.css';
import './dark-background-contrast.css';
import './dashboard-light-contrast.css';
import './dashboard-contrast-runtime.js';
import './runtime-brand-sync.js';
import './admin/admin-complete-runtime.js';

const hideDecorativeSvg = (root = document) => {
  root.querySelectorAll('svg').forEach((svg) => {
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.removeAttribute('role');
  });
};

hideDecorativeSvg();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <InquiryConversationWidget />
    </BrowserRouter>
  </React.StrictMode>,
);
