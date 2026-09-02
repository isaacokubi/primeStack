import { normalizeImageUrl } from '../services/api.js';
import './product-media.css';

export default function ProductMedia({ product }) {
  const images = [product?.logo, ...(product?.screenshots || [])]
    .map(normalizeImageUrl)
    .filter(Boolean);
  if (!images.length) return null;

  const handleError = event => {
    event.currentTarget.style.display = 'none';
  };

  return (
    <section className="productMedia" aria-label="Project images">
      <div className="productMediaHero">
        <img src={images[0]} alt={`${product?.name || 'Project'} preview`} loading="eager" onError={handleError} />
      </div>
      {images.length > 1 && (
        <div className="productMediaGrid">
          {images.slice(1).map((image, index) => (
            <img key={`${image}-${index}`} src={image} alt={`${product?.name || 'Project'} screenshot ${index + 1}`} loading="lazy" onError={handleError} />
          ))}
        </div>
      )}
    </section>
  );
}
