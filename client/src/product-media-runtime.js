import { productsApi } from './services/api.js';

const renderProductGallery = async () => {
  const match = window.location.pathname.match(/^\/products\/([^/]+)\/?$/);
  if (!match || document.querySelector('[data-primestack-product-gallery]')) return;

  const detailHero = document.querySelector('.detailHero');
  if (!detailHero) return;

  try {
    const response = await productsApi.get(decodeURIComponent(match[1]));
    const product = response.data?.data;
    const images = [product?.logo, ...(product?.screenshots || [])].filter(Boolean);
    if (!images.length) return;

    const gallery = document.createElement('section');
    gallery.className = 'productMediaRuntime';
    gallery.dataset.primestackProductGallery = 'true';
    gallery.setAttribute('aria-label', `${product.name || 'Product'} images`);

    const main = document.createElement('div');
    main.className = 'productMediaRuntimeMain';
    const mainImage = document.createElement('img');
    mainImage.src = images[0];
    mainImage.alt = `${product.name || 'Product'} preview`;
    mainImage.loading = 'eager';
    main.appendChild(mainImage);
    gallery.appendChild(main);

    if (images.length > 1) {
      const grid = document.createElement('div');
      grid.className = 'productMediaRuntimeGrid';
      images.slice(1).forEach((src, index) => {
        const image = document.createElement('img');
        image.src = src;
        image.alt = `${product.name || 'Product'} screenshot ${index + 1}`;
        image.loading = 'lazy';
        grid.appendChild(image);
      });
      gallery.appendChild(grid);
    }

    detailHero.insertAdjacentElement('afterend', gallery);
  } catch {
    // The normal product detail page remains usable if the gallery request fails.
  }
};

const schedule = () => window.requestAnimationFrame(renderProductGallery);
window.addEventListener('popstate', schedule);
window.addEventListener('hashchange', schedule);
new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
schedule();
