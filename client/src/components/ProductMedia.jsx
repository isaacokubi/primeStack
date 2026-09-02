export default function ProductMedia({ product }) {
  const images = [product?.logo, ...(product?.screenshots || [])].filter(Boolean);
  if (!images.length) return null;

  return (
    <section className="productMedia" aria-label="Product screenshots">
      <div className="productMediaHero">
        <img src={images[0]} alt={`${product?.name || 'Product'} preview`} loading="eager" />
      </div>
      {images.length > 1 && (
        <div className="productMediaGrid">
          {images.slice(1).map((image, index) => (
            <img key={`${image}-${index}`} src={image} alt={`${product?.name || 'Product'} screenshot ${index + 1}`} loading="lazy" />
          ))}
        </div>
      )}
    </section>
  );
}
