
import { useState } from "react";
import {
  X,
  MapPin,
  User,
  Phone,
  CreditCard,
  Banknote,
  CheckCircle,
  Package
} from "lucide-react";

function Checkout({ cart, onClose, onOrderComplete }) {
  const [customer, setCustomer] = useState({
    fullName: "",
    phone: "",
    address: "",
    note: "",
    payment: "COD"
  });

  const [errors, setErrors] = useState({});
  const [orderCode, setOrderCode] = useState("");

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const updateField = (event) => {
    const { name, value } = event.target;

    setCustomer((current) => ({
      ...current,
      [name]: value
    }));

    setErrors((current) => ({
      ...current,
      [name]: ""
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const newErrors = {};

    if (!customer.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ và tên.";
    }

    if (!/^(0|\+84)[0-9]{9,10}$/.test(customer.phone.trim())) {
      newErrors.phone = "Số điện thoại chưa hợp lệ.";
    }

    if (!customer.address.trim()) {
      newErrors.address = "Vui lòng nhập địa chỉ nhận hàng.";
    }

    if (cart.length === 0) {
      newErrors.cart = "Giỏ hàng đang trống.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const code =
      "HDX" + Date.now().toString().slice(-8);

    setOrderCode(code);

    // Hoàn tất đơn hàng mô phỏng trên Frontend
    onOrderComplete({
      orderCode: code,
      customer,
      items: cart,
      total,
      createdAt: new Date().toISOString()
    });
  };

  if (orderCode) {
    return (
      <div className="checkout-overlay">
        <div className="checkout-modal order-success">
          <div className="checkout-success-icon">
            <CheckCircle size={54} />
          </div>

          <h2>Đặt hàng thành công!</h2>

          <p>
            Cảm ơn bạn đã mua sắm tại HDX Tech.
          </p>

          <div className="order-code">
            <span>MÃ ĐƠN HÀNG</span>
            <strong>{orderCode}</strong>
          </div>

          <div className="success-info">
            <Package size={20} />
            <span>
              Đơn hàng đã được ghi nhận trong phiên mô phỏng.
            </span>
          </div>

          <button
            className="checkout-submit"
            onClick={onClose}
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div
        className="checkout-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="checkout-header">
          <div>
            <span className="checkout-eyebrow">
              HDX TECH STORE
            </span>
            <h2>Thông tin đặt hàng</h2>
          </div>

          <button onClick={onClose} aria-label="Đóng">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="checkout-content">
            <section className="checkout-form-section">
              <h3>
                <MapPin size={19} />
                Thông tin nhận hàng
              </h3>

              <label>Họ và tên *</label>
              <div className="checkout-input">
                <User size={18} />
                <input
                  name="fullName"
                  value={customer.fullName}
                  onChange={updateField}
                  placeholder="Nhập họ và tên người nhận"
                />
              </div>
              {errors.fullName && (
                <p className="field-error">{errors.fullName}</p>
              )}

              <label>Số điện thoại *</label>
              <div className="checkout-input">
                <Phone size={18} />
                <input
                  name="phone"
                  value={customer.phone}
                  onChange={updateField}
                  placeholder="Nhập số điện thoại"
                  inputMode="tel"
                />
              </div>
              {errors.phone && (
                <p className="field-error">{errors.phone}</p>
              )}

              <label>Địa chỉ nhận hàng *</label>
              <textarea
                name="address"
                value={customer.address}
                onChange={updateField}
                placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
                rows={3}
              />
              {errors.address && (
                <p className="field-error">{errors.address}</p>
              )}

              <label>Ghi chú đơn hàng</label>
              <textarea
                name="note"
                value={customer.note}
                onChange={updateField}
                placeholder="Ghi chú thêm cho người bán (nếu có)"
                rows={2}
              />

              <h3 className="payment-title">
                <CreditCard size={19} />
                Phương thức thanh toán
              </h3>

              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={customer.payment === "COD"}
                  onChange={updateField}
                />
                <Banknote size={20} />
                <span>
                  <strong>Thanh toán khi nhận hàng (COD)</strong>
                  <small>Thanh toán trực tiếp khi nhận hàng</small>
                </span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="BANK"
                  checked={customer.payment === "BANK"}
                  onChange={updateField}
                />
                <CreditCard size={20} />
                <span>
                  <strong>Chuyển khoản ngân hàng</strong>
                  <small>Phương thức mô phỏng, chưa thực hiện giao dịch</small>
                </span>
              </label>
            </section>

            <aside className="checkout-summary">
              <h3>Đơn hàng của bạn</h3>

              <div className="checkout-products">
                {cart.map((item) => (
                  <div className="checkout-product" key={item.id}>
                    <img src={item.image} alt={item.name} />

                    <div>
                      <strong>{item.name}</strong>
                      <span>Số lượng: {item.quantity}</span>
                      <b>
                        {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                      </b>
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-line">
                <span>Tạm tính</span>
                <strong>{total.toLocaleString("vi-VN")}đ</strong>
              </div>

              <div className="summary-line">
                <span>Phí vận chuyển</span>
                <strong>Chưa xác định</strong>
              </div>

              <div className="summary-total">
                <span>Tổng tiền sản phẩm</span>
                <strong>{total.toLocaleString("vi-VN")}đ</strong>
              </div>

              <p className="checkout-disclaimer">
                Đây là quy trình đặt hàng mô phỏng. Chưa phát sinh
                thanh toán hoặc vận chuyển thực tế.
              </p>
            </aside>
          </div>

          <div className="checkout-footer">
            <button
              type="button"
              className="checkout-back"
              onClick={onClose}
            >
              Quay lại giỏ hàng
            </button>

            <button type="submit" className="checkout-submit">
              Xác nhận đặt hàng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Checkout;
