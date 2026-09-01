import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './AppNew.jsx';
import './styles.css';
import './homepage.css';
import './portal.css';
import './ui-fixes.css';
import './professional-ui.css';

const FOUNDER_IMAGE_KEY = 'primeStack.founderImage';

const setFounderImage = () => {
  const image = localStorage.getItem(FOUNDER_IMAGE_KEY);
  if (image) {
    document.documentElement.style.setProperty(
      '--founder-image',
      `url("${image.replace(/"/g, '\\"')}")`,
    );
  } else {
    document.documentElement.style.removeProperty('--founder-image');
  }
};

// Resize/compress the selected photo before putting it in localStorage.
// This prevents the browser's ~5MB storage limit from silently rejecting
// larger camera photos and makes the same image reliably available to Home.
const prepareFounderImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Unable to read the selected image.'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('The selected file is not a valid image.'));
    image.onload = () => {
      const maxDimension = 1400;
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) return reject(new Error('Image processing is unavailable.'));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let quality = 0.82;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      while (dataUrl.length > 1500000 && quality > 0.45) {
        quality -= 0.07;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(dataUrl);
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});

const styleAdminUploader = () => {
  if (!location.pathname.startsWith('/admin') || document.getElementById('primeStackFounderUpload')) return;

  const box = document.createElement('section');
  box.id = 'primeStackFounderUpload';
  box.innerHTML = '<div><strong>Homepage Founder Photo</strong><p>Upload the photo shown on the right side of the homepage.</p><label>Select photo <input id="primeStackFounderInput" type="file" accept="image/jpeg,image/png,image/webp"></label><button id="primeStackFounderRemove" type="button">Remove photo</button></div>';

  Object.assign(box.style, {
    position: 'fixed', right: '20px', bottom: '20px', zIndex: '99999', maxWidth: '340px',
    padding: '18px', border: '1px solid rgba(199,243,107,.3)', borderRadius: '16px',
    background: '#091522', color: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,.4)',
    fontFamily: 'system-ui,sans-serif',
  });
  box.querySelector('p').style.cssText = 'margin:6px 0 12px;color:#9aa9ba;font-size:13px;line-height:1.5';
  box.querySelector('label').style.cssText = 'display:block;font-size:13px;font-weight:700;margin-bottom:10px';
  box.querySelector('input').style.cssText = 'display:block;margin-top:8px;width:100%';
  box.querySelector('button').style.cssText = 'border:1px solid #34495f;background:transparent;color:#c7f36b;border-radius:8px;padding:8px 11px;cursor:pointer';

  box.querySelector('input').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please choose a JPG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert('Please choose an image smaller than 15MB.');
      event.target.value = '';
      return;
    }
    try {
      const compressed = await prepareFounderImage(file);
      localStorage.setItem(FOUNDER_IMAGE_KEY, compressed);
      setFounderImage();
      alert('Homepage founder photo updated. Open the homepage to view it.');
    } catch (error) {
      alert(error.message || 'Unable to save the image.');
    } finally {
      event.target.value = '';
    }
  });

  box.querySelector('button').addEventListener('click', () => {
    localStorage.removeItem(FOUNDER_IMAGE_KEY);
    setFounderImage();
    alert('Homepage founder photo removed.');
  });

  document.body.appendChild(box);
};

const hideDecorativeSvg = (root = document) => {
  root.querySelectorAll('svg').forEach((svg) => {
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.removeAttribute('role');
  });
};

setFounderImage();
hideDecorativeSvg();
styleAdminUploader();

const observer = new MutationObserver(() => {
  hideDecorativeSvg();
  styleAdminUploader();
});
observer.observe(document.documentElement, { childList: true, subtree: true });

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
