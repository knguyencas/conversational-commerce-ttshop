
import { useCallback, useEffect, useState } from "react";
import { layDon } from "../api";
import {
  Package,
  RefreshCw,
  Truck,
  CheckCircle2,
  Clock3,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import "./DonCuaToi.css";

const STEPS = [
  { key: "ordered", label: "Đã đặt hàng" },
  { key: "confirmed", label: "Shop xác nhận" },
  { key: "packed", label: "Đã đóng gói" },
  { key: "shipping", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
];

function getOrderStep(order) {
  const history = Array.isArray(order.lich_su)
    ? order.lich_su
    : Array.isArray(order.history)
      ? order.history
      : [];

  const actions = history.map((item) =>
    String(
      item.viec || item.action || item.status || ""
    ).toLowerCase()
  );

  const status = String(order.status || "").toUpperCase();

  if (status === "CANCELLED") return -1;

  if (
    status === "DELIVERED" ||
    status === "COMPLETED"
  ) {
    return 4;
  }

  if (
    status === "IN_TRANSIT" ||
    actions.includes("shipping_arranged") ||
    actions.includes("dang_giao") ||
    actions.includes("da_giao")
  ) {
    return actions.includes("da_giao") ? 4 : 3;
  }

  if (
    actions.includes("dong_goi") ||
    actions.includes("packed")
  ) {
    return 2;
  }

  if (
    actions.includes("odoo_created") ||
    actions.includes("confirmed")
  ) {
    return 1;
  }

  return 0;
}

function getStatusLabel(order) {
  const status = String(order.status || "").toUpperCase();

  if (status === "CANCELLED") return "Đã hủy";
  if (status === "DELIVERED") return "Đã giao";
  if (status === "COMPLETED") return "Hoàn tất";
  if (status === "IN_TRANSIT") return "Đang giao";
  if (status === "AWAITING_COLLECTION") return "Chờ lấy hàng";
  if (status === "AWAITING_SHIPMENT") return "Đang xử lý";

  return "Đã đặt hàng";
}

function formatMoney(value) {
  if (value == null || value === "") {
    return "Đang cập nhật";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Đang cập nhật";
  }

  return amount.toLocaleString("vi-VN") + "đ";
}

function DonCuaToi({ products = [], onAskShop }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setError("");

      const result = await layDon();

      const allOrders = Array.isArray(result.orders)
        ? result.orders
        : Array.isArray(result.don)
          ? result.don
          : [];

      const buyerId =
        localStorage.getItem("buyer_user_id") ||
        "gia-lap-khach";

      setOrders(
        allOrders.filter(
          (order) => order.buyer_user_id === buyerId
        )
      );
    } catch (err) {
      setError(err.message || "Không thể tải đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const timer = setInterval(fetchOrders, 5000);

    return () => clearInterval(timer);
  }, [fetchOrders]);

  const getProductName = (sku) => {
    const product = products.find(
      (item) => item.sku === sku
    );

    return product?.name || sku || "Sản phẩm";
  };

  const pendingOrders = orders.filter((order) =>
    [
      "AWAITING_SHIPMENT",
      "AWAITING_COLLECTION",
      "IN_TRANSIT",
    ].includes(String(order.status || "").toUpperCase())
  ).length;

  const completedOrders = orders.filter((order) =>
    ["DELIVERED", "COMPLETED"].includes(
      String(order.status || "").toUpperCase()
    )
  ).length;

  return (
    <main className="my-orders-page">
      <header className="orders-heading">
        <div>
          <span className="orders-eyebrow">HDX TECH STORE</span>
          <h1>Đơn hàng của tôi</h1>
          <p>Theo dõi tình trạng các đơn hàng của bạn</p>
        </div>

        <button
          className="orders-refresh"
          type="button"
          onClick={fetchOrders}
          title="Tải lại đơn hàng"
          disabled={loading}
        >
          <RefreshCw size={18} />
        </button>
      </header>

      <div className="orders-summary">
        <div>
          <Package size={21} />
          <strong>{orders.length}</strong>
          <span>Tổng đơn hàng</span>
        </div>

        <div>
          <Clock3 size={21} />
          <strong>{pendingOrders}</strong>
          <span>Đang xử lý</span>
        </div>

        <div>
          <CheckCircle2 size={21} />
          <strong>{completedOrders}</strong>
          <span>Đã hoàn tất</span>
        </div>
      </div>

      {loading ? (
        <div className="orders-message">
          <RefreshCw className="orders-spin" size={30} />
          <h3>Đang tải đơn hàng...</h3>
        </div>
      ) : error ? (
        <div className="orders-message">
          <AlertCircle size={36} />
          <h3>Không thể tải đơn hàng</h3>
          <p>{error}</p>
          <button type="button" onClick={fetchOrders}>
            Thử lại
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-message">
          <Package size={48} />
          <h3>Bạn chưa có đơn hàng nào</h3>
          <p>
            Những đơn hàng đã đặt thành công sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <section className="orders-list">
          {orders.map((order, index) => {
            const step = getOrderStep(order);
            const cancelled = step === -1;

            const orderId =
              order.order_id || order.id || `order-${index}`;

            const tracking =
              order.tracking_number ||
              order.ma_van_don ||
              order.tracking_code;

            const items = Array.isArray(order.items)
              ? order.items
              : Array.isArray(order.san_pham)
                ? order.san_pham
                : [];

            return (
              <article className="order-card" key={orderId}>
                <div className="order-card-heading">
                  <div>
                    <span>MÃ ĐƠN HÀNG</span>
                    <strong>{orderId || "Chưa có mã"}</strong>
                  </div>

                  <span
                    className={`order-status ${
                      cancelled ? "cancelled" : ""
                    }`}
                  >
                    {getStatusLabel(order)}
                  </span>
                </div>

                <div className="order-items">
                  {items.map((item, itemIndex) => {
                    const sku =
                      item.seller_sku || item.sku;

                    return (
                      <div
                        className="order-item"
                        key={sku || itemIndex}
                      >
                        <span>{getProductName(sku)}</span>
                        <span>x{item.quantity || 1}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="order-total">
                  <span>Tổng thanh toán</span>
                  <strong>
                    {formatMoney(
                      order.total_amount ?? order.total
                    )}
                  </strong>
                </div>

                {!cancelled && (
                  <div className="order-progress">
                    {STEPS.map((item, index) => (
                      <div
                        className={`progress-step ${
                          index <= step ? "completed" : ""
                        }`}
                        key={item.key}
                      >
                        <span className="progress-dot">
                          {index < step ? (
                            <CheckCircle2 size={15} />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <small>{item.label}</small>
                      </div>
                    ))}
                  </div>
                )}

                <div className="order-tracking">
                  <Truck size={19} />
                  <div>
                    <span>Mã vận đơn</span>
                    <strong>
                      {tracking || "Chưa có mã vận đơn"}
                    </strong>
                  </div>
                </div>

                <button
                  className="order-chat-button"
                  type="button"
                  onClick={() => onAskShop?.(order)}
                >
                  <MessageCircle size={17} />
                  Hỏi shop về đơn này
                </button>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

export default DonCuaToi;
