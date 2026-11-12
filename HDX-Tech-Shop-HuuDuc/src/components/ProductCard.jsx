
import { ShoppingCart, Star, Eye } from "lucide-react";

function ProductCard({ product, onAddToCart, onViewDetail }) {
  const discount = product.oldPrice > product.price
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <article className="product-card">
      <div
        className="product-image clickable"
        onClick={() => onViewDetail(product)}
      >
        <img src={product.image} alt={product.name} loading="lazy" />

        {discount > 0 && (
          <span className="discount">-{discount}%</span>
        )}

        <span className="product-image-label">HDX TECH</span>
      </div>

      <div className="product-info">
        <span className="product-category">
          {product.category}
        </span>

        <h3
          className="clickable"
          onClick={() => onViewDetail(product)}
        >
          {product.name}
        </h3>

        <div className="rating">
          <Star size={14} fill="#f5a623" color="#f5a623" />
          <strong>{product.rating}</strong>
          <span>Đã bán {product.sold}</span>
        </div>

        <div className="price-row">
          <strong>{product.price.toLocaleString("vi-VN")}đ</strong>
          {discount > 0 && (
            <del>{product.oldPrice.toLocaleString("vi-VN")}đ</del>
          )}
        </div>

        <div className="product-card-actions">
          <button
            className="add-cart"
            onClick={() => onAddToCart(product)}
          >
            <ShoppingCart size={16} />
            Thêm vào giỏ
          </button>

          <button
            className="quick-view"
            title="Xem chi tiết"
            onClick={() => onViewDetail(product)}
          >
            <Eye size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
