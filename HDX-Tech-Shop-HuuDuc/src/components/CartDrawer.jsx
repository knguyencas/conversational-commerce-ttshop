
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight
} from "lucide-react";

import { getProductImage } from "../lib/anh";

function CartDrawer({
  cart,
  onClose,
  onUpdateQuantity,
  onRemove,
  onCheckout
}) {
  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const cartCount = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div
        className="cart-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cart-header">
          <div>
            <h2>Giỏ hàng của bạn</h2>
            <span>{cartCount} sản phẩm</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng giỏ hàng"
          >
            <X />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag size={55} />
            <h3>Giỏ hàng đang trống</h3>
            <p>Hãy khám phá các sản phẩm tại HDX Tech nhé!</p>
            <button type="button" onClick={onClose}>
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-image">
                    <img
                      src={getProductImage(item)}
                      alt={item.name}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = getProductImage({});
                      }}
                    />
                  </div>

                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <p className="cart-sku">{item.sku}</p>

                    {item.selectedColor && (
                      <p className="cart-sku">
                        Màu: {item.selectedColor}
                      </p>
                    )}

                    <strong>
                      {Number(item.price || 0).toLocaleString("vi-VN")}đ
                    </strong>

                    <div className="quantity-control">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        aria-label="Giảm số lượng"
                      >
                        <Minus size={14} />
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        aria-label="Tăng số lượng"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="remove-item"
                    onClick={() => onRemove(item.id)}
                    title="Xóa sản phẩm"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <span>Tạm tính</span>
                <strong>{total.toLocaleString("vi-VN")}đ</strong>
              </div>

              <button
                type="button"
                className="checkout-button"
                onClick={onCheckout}
              >
                Tiến hành đặt hàng
                <ArrowRight size={18} />
              </button>

              <p className="cart-note">
                Phí vận chuyển sẽ được xác nhận khi đặt hàng.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CartDrawer;
