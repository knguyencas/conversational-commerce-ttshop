
import { X, Star, ShoppingCart, PackageCheck } from "lucide-react";

function ProductDetail({ product, onClose, onAddToCart }) {
  if (!product) return null;

  const discount = Math.round(
    (1 - product.price / product.oldPrice) * 100
  );

  const handleAdd = () => {
    onAddToCart(product);
    onClose();
  };

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div
        className="detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="detail-close" onClick={onClose}>
          <X size={22} />
        </button>

        <div className="detail-content">
          <div className="detail-image">
            <img src={product.image} alt={product.name} />
            <span className="discount">-{discount}%</span>
          </div>

          <div className="detail-info">
            <span className="product-category">
              {product.category}
            </span>

            <h2>{product.name}</h2>

            <p className="detail-sku">
              Mã sản phẩm: <strong>{product.sku}</strong>
            </p>

            <div className="detail-rating">
              <Star size={17} fill="#f5a623" color="#f5a623" />
              <strong>{product.rating}</strong>
              <span> | Đã bán {product.sold}</span>
            </div>

            <div className="detail-price">
              <strong>
                {product.price.toLocaleString("vi-VN")}đ
              </strong>
              <del>
                {product.oldPrice.toLocaleString("vi-VN")}đ
              </del>
            </div>

            <div className="detail-description">
              <h3>Thông tin sản phẩm</h3>
              <p>
                {product.description ||
                  `Sản phẩm ${product.name} thuộc danh mục ${product.category}. Đây là sản phẩm được giới thiệu tại HDX Tech.`}
              </p>
            </div>

            <div className="detail-service">
              <div>
                <PackageCheck size={19} />
                <span>Thông tin bảo hành theo sản phẩm</span>
              </div>
              <div>
                <ShoppingCart size={19} />
                <span>Thêm sản phẩm vào giỏ hàng dễ dàng</span>
              </div>
            </div>

            <button className="detail-add-cart" onClick={handleAdd}>
              <ShoppingCart size={19} />
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
