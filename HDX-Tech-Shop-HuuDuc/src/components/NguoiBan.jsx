import "./NguoiBan.css";
import { useEffect, useState } from "react";
import {
  layDon,
  dayBuoc,
  traChatVeBot,
  layKpi,
} from "../api";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
  MessageCircle,
  BarChart3,
  ShoppingBag,
} from "lucide-react";

function NguoiBan() {
  const [orders, setOrders] = useState([]);
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState("");
  const [activeTab, setActiveTab] = useState("orders");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [orderResult, kpiResult] = await Promise.all([
        layDon(),
        layKpi(),
      ]);

      setOrders(
        Array.isArray(orderResult.orders)
          ? orderResult.orders
          : []
      );

      setKpi(kpiResult);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (orderId, action) => {
    const confirmMessage =
      action === "huy_don"
        ? "Bạn có chắc muốn hủy đơn hàng này?"
        : "Xác nhận cập nhật trạng thái đơn hàng?";

    if (!window.confirm(confirmMessage)) return;

    setProcessing(orderId);

    try {
      await dayBuoc(orderId, action);
      alert("Cập nhật đơn hàng thành công!");
      await loadData();
    } catch (err) {
      alert(err.message || "Không thể cập nhật đơn hàng.");
    } finally {
      setProcessing("");
    }
  };

  const handleReturnBot = async (conversationId) => {
    if (!conversationId) {
      alert("Đơn hàng chưa có mã hội thoại.");
      return;
    }

    if (!window.confirm("Bạn muốn chuyển cuộc trò chuyện về chatbot?")) {
      return;
    }

    try {
      await traChatVeBot(conversationId);
      alert("Đã chuyển cuộc trò chuyện về chatbot.");
    } catch (err) {
      alert(err.message || "Không thể chuyển cuộc trò chuyện.");
    }
  };

  const getStatus = (order) => {
    if (order.status === "DELIVERED") return "Đã giao";
    if (order.status === "CANCELLED") return "Đã hủy";
    if (order.status === "IN_TRANSIT") return "Đang vận chuyển";

    if (
      order.status === "AWAITING_SHIPMENT" &&
      order.shipping_arranged
    ) {
      return "Chờ bàn giao vận chuyển";
    }

    if (order.status === "AWAITING_SHIPMENT") {
      return "Chờ xử lý";
    }

    return order.status || "Chưa xác định";
  };

  const getActions = (order) => {
    if (order.status === "AWAITING_SHIPMENT") {
      if (order.shipping_arranged) {
        return [
          {
            label: "Giao cho vận chuyển",
            action: "dang_giao",
            icon: Truck,
          },
        ];
      }

      return [
        {
          label: "Đã đóng gói",
          action: "dong_goi",
          icon: Package,
        },
        {
          label: "Hủy đơn",
          action: "huy_don",
          icon: XCircle,
        },
      ];
    }

    if (order.status === "IN_TRANSIT") {
      return [
        {
          label: "Đã giao",
          action: "da_giao",
          icon: CheckCircle,
        },
      ];
    }

    return [];
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (order) =>
      order.status === "AWAITING_SHIPMENT" ||
      order.status === "IN_TRANSIT"
  ).length;
  const completedOrders = orders.filter(
    (order) => order.status === "DELIVERED"
  ).length;

  const formatPrice = (price) =>
    Number(price || 0).toLocaleString("vi-VN") + "đ";

  return (
    <div className="seller-page">
      <header className="seller-header">
        <div>
          <span className="seller-brand">HDX TECH STORE</span>
          <h1>Quản lý cửa hàng</h1>
          <p>Theo dõi và xử lý đơn hàng của khách hàng</p>
        </div>

        <button
          className="seller-refresh"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Làm mới
        </button>
      </header>

      <nav className="seller-tabs">
        <button
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          <ShoppingBag size={17} />
          Đơn hàng
        </button>

        <button
          className={activeTab === "kpi" ? "active" : ""}
          onClick={() => setActiveTab("kpi")}
        >
          <BarChart3 size={17} />
          Thống kê
        </button>
      </nav>

      {activeTab === "orders" && (
        <>
          <section className="seller-stats">
            <div className="seller-stat-card">
              <ShoppingBag />
              <span>Tổng đơn hàng</span>
              <strong>{totalOrders}</strong>
            </div>

            <div className="seller-stat-card">
              <Package />
              <span>Đang xử lý</span>
              <strong>{pendingOrders}</strong>
            </div>

            <div className="seller-stat-card">
              <CheckCircle />
              <span>Đã hoàn tất</span>
              <strong>{completedOrders}</strong>
            </div>
          </section>

          <section className="seller-content">
            <div className="seller-section-title">
              <h2>Danh sách đơn hàng</h2>
              <span>{totalOrders} đơn</span>
            </div>

            {loading ? (
              <p className="seller-message">Đang tải đơn hàng...</p>
            ) : error ? (
              <div className="seller-error">
                <p>{error}</p>
                <button onClick={loadData}>Thử lại</button>
              </div>
            ) : orders.length === 0 ? (
              <div className="seller-empty">
                <ShoppingBag size={42} />
                <h3>Chưa có đơn hàng</h3>
                <p>Đơn hàng của khách sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              <div className="seller-order-list">
                {orders.map((order, index) => {
                  const orderId =
                    order.order_id || order.id || index;

                  const items = Array.isArray(order.items)
                    ? order.items
                    : [];

                  const actions = getActions(order);

                  return (
                    <article
                      className="seller-order-card"
                      key={orderId}
                    >
                      <div className="seller-order-top">
                        <div>
                          <strong>Đơn #{orderId}</strong>
                          <span>
                            {order.buyer_user_id || "Khách hàng"}
                          </span>
                        </div>

                        <span className="seller-status">
                          {getStatus(order)}
                        </span>
                      </div>

                      <div className="seller-order-items">
                        {items.map((item, itemIndex) => (
                          <div
                            className="seller-order-item"
                            key={item.sku || itemIndex}
                          >
                            <div>
                              <strong>
                                {item.name || item.sku}
                              </strong>
                              <span>
                                SKU: {item.sku || "—"} · Số lượng:{" "}
                                {item.quantity || 0}
                              </span>
                            </div>

                            <strong>
                              {formatPrice(
                                item.price * item.quantity
                              )}
                            </strong>
                          </div>
                        ))}
                      </div>

                      <div className="seller-order-total">
                        <span>Tổng tiền</span>
                        <strong>
                          {formatPrice(order.total)}
                        </strong>
                      </div>

                      {order.tracking_number && (
                        <p className="seller-tracking">
                          Mã vận đơn: {order.tracking_number}
                        </p>
                      )}

                      <div className="seller-order-actions">
                        {actions.map((item) => {
                          const Icon = item.icon;

                          return (
                            <button
                              key={item.action}
                              className={
                                item.action === "huy_don"
                                  ? "danger"
                                  : "primary"
                              }
                              disabled={processing === orderId}
                              onClick={() =>
                                handleAction(orderId, item.action)
                              }
                            >
                              <Icon size={16} />
                              {processing === orderId
                                ? "Đang xử lý..."
                                : item.label}
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === "kpi" && (
        <section className="seller-content">
          <div className="seller-section-title">
            <h2>Thống kê cửa hàng</h2>
          </div>

          {loading ? (
            <p className="seller-message">Đang tải thống kê...</p>
          ) : error ? (
            <div className="seller-error">
              <p>{error}</p>
              <button onClick={loadData}>Thử lại</button>
            </div>
          ) : (
            <div className="seller-kpi">
              {kpi ? (
                Object.entries(kpi).map(([key, value]) => {
                  if (
                    value === null ||
                    typeof value === "object"
                  ) {
                    return null;
                  }

                  return (
                    <div className="seller-stat-card" key={key}>
                      <span>{key.replaceAll("_", " ")}</span>
                      <strong>
                        {typeof value === "number"
                          ? value.toLocaleString("vi-VN")
                          : String(value)}
                      </strong>
                    </div>
                  );
                })
              ) : (
                <p>Chưa có dữ liệu thống kê.</p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default NguoiBan;
