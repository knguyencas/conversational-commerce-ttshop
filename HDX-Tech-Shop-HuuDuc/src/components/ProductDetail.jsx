
import { useEffect, useState } from "react";
import {
  X,
  ShoppingCart,
  PackageCheck,
  MessageCircle,
  Zap,
  ShieldCheck,
  Check
} from "lucide-react";
import "./ProductDetail.css";

function ProductDetail({
  product,
  onClose,
  onAddToCart,
  onChat,
  onBuyNow
}) {
  const [selectedColor, setSelectedColor] = useState("");

  useEffect(() => {
    setSelectedColor(product?.colors?.[0]?.color || "");
  }, [product]);

  if (!product) return null;

  const colors = Array.isArray(product.colors)
    ? product.colors
    : [];

  const selectedColorData = colors.find(
    (item) => item.color === selectedColor
  );

  const availableStock = colors.length > 0
    ? Number(selectedColorData?.stock || 0)
    : Number(product.stock || 0);

  const formatPrice = (price) =>
    Number(price || 0).toLocaleString("vi-VN") + "đ";

  const handleAdd = () => {
    if (availableStock <= 0) {
      alert("Màu sắc này hiện đã hết hàng.");
      return;
    }

    onAddToCart?.({
      ...product,
      selectedColor: selectedColor || null,
      selectedColorStock: availableStock
    });

    onClose();
  };

  const handleBuyNow = () => {
    if (availableStock <= 0) {
      alert("Màu sắc này hiện đã hết hàng.");
      return;
    }

    onBuyNow?.({
      ...product,
      selectedColor: selectedColor || null,
      selectedColorStock: availableStock
    });
  };

  const handleChat = () => {
    onChat?.(product);
  };

  const renderSpecs = () => {
    if (!product.specs) return null;

    if (Array.isArray(product.specs)) {
      return product.specs.map((item, index) => (
        <div className="detail-spec-row" key={index}>
          <span>Thông số {index + 1}</span>
          <strong>
            {typeof item === "object"
              ? Object.values(item).join(" - ")
              : String(item)}
          </strong>
        </div>
      ));
    }

    if (typeof product.specs === "object") {
      return Object.entries(product.specs).map(([key, value]) => (
        <div className="detail-spec-row" key={key}>
          <span>{key}</span>
          <strong>
            {typeof value === "object"
              ? JSON.stringify(value)
              : String(value)}
          </strong>
        </div>
      ));
    }

    return (
      <div className="detail-spec-row">
        <span>Thông số</span>
        <strong>{String(product.specs)}</strong>
      </div>
    );
  };

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div
        className="detail-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="detail-close"
          onClick={onClose}
          aria-label="Đóng chi tiết sản phẩm"
        >
          <X size={22} />
        </button>

        <div className="detail-content">
          {/* ẢNH SẢN PHẨM */}
          <div className="detail-image">
            {product.image ? (
              <img src={product.image} alt={product.name} />
            ) : (
              <div className="detail-no-image">
                Không có hình ảnh
              </div>
            )}
          </div>

          {/* THÔNG TIN SẢN PHẨM */}
          <div className="detail-info">
            <span className="product-category">
              {product.category || "Sản phẩm công nghệ"}
            </span>

            <h2>{product.name}</h2>

            <p className="detail-sku">
              Mã sản phẩm: <strong>{product.sku}</strong>
            </p>

            <p className="detail-brand">
              Thương hiệu: <strong>{product.brand || "Chưa cập nhật"}</strong>
            </p>

            <div className="detail-price">
              <strong>{formatPrice(product.price)}</strong>
            </div>

            {/* TỒN KHO */}
            <div className={`detail-stock ${availableStock > 0 ? "in-stock" : "out-stock"}`}>
              <PackageCheck size={18} />
              {availableStock > 0
                ? `Còn ${availableStock} sản phẩm`
                : "Tạm hết hàng"}
            </div>

            {/* CHỌN MÀU */}
            {colors.length > 0 && (
              <div className="detail-colors">
                <h3>
                  Màu sắc
                  {selectedColor && (
                    <span> · {selectedColor}</span>
                  )}
                </h3>

                <div className="detail-color-list">
                  {colors.map((item) => (
                    <button
                      type="button"
                      key={item.color}
                      disabled={Number(item.stock) <= 0}
                      className={`detail-color-option ${
                        selectedColor === item.color ? "selected" : ""
                      }`}
                      onClick={() => setSelectedColor(item.color)}
                    >
                      {selectedColor === item.color && (
                        <Check size={14} />
                      )}
                      {item.color}
                      <small>{item.stock > 0 ? `Còn ${item.stock}` : "Hết hàng"}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* THÔNG SỐ */}
            {product.specs && (
              <div className="detail-section">
                <h3>Thông số kỹ thuật</h3>
                <div className="detail-spec-list">
                  {renderSpecs()}
                </div>
              </div>
            )}

            {/* BẢO HÀNH */}
            <div className="detail-service">
              <div>
                <ShieldCheck size={19} />
                <span>
                  Bảo hành:{" "}
                  <strong>
                    {product.warranty_months != null
                      ? `${product.warranty_months} tháng`
                      : "Chưa cập nhật"}
                  </strong>
                </span>
              </div>
            </div>

            {/* TƯƠNG THÍCH */}
            {Array.isArray(product.compatible) && (
              <div className="detail-section">
                <h3>Thiết bị tương thích</h3>

                {product.compatible.length > 0 ? (
                  <div className="detail-compatible">
                    {product.compatible.map((item, index) => (
                      <span key={index}>
                        {typeof item === "object"
                          ? Object.values(item).join(" - ")
                          : item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="detail-muted">
                    Chưa có thông tin tương thích.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* THANH NÚT HÀNH ĐỘNG */}
        <div className="detail-action-bar">
          <button
            type="button"
            className="detail-chat-button"
            onClick={handleChat}
          >
            <MessageCircle size={18} />
            Chat
          </button>

          <button
            type="button"
            className="detail-add-cart"
            onClick={handleAdd}
            disabled={availableStock <= 0}
          >
            <ShoppingCart size={18} />
            Thêm vào giỏ
          </button>

          <button
            type="button"
            className="detail-buy-now"
            onClick={handleBuyNow}
            disabled={availableStock <= 0}
          >
            <Zap size={18} />
            Mua ngay
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
