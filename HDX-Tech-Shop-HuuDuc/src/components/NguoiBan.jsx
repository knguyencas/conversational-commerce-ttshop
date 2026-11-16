
import "./NguoiBan.css";
import { useCallback, useEffect, useState } from "react";
import { layDon, dayBuoc, layKpi } from "../api";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  ShoppingBag,
  Wallet,
} from "lucide-react";

function NguoiBan() {
  const [orders, setOrders] = useState([]);
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState("");
  const [activeTab, setActiveTab] = useState("orders");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [orderResult, kpiResult] = await Promise.all([
        layDon(),
        layKpi(),
      ]);

      const orderData =
        orderResult?.data ??
        orderResult;

      const allOrders = Array.isArray(orderData?.orders)
        ? orderData.orders
        : Array.isArray(orderData?.don)
          ? orderData.don
          : Array.isArray(orderData)
            ? orderData
            : [];

      setOrders(allOrders);

      // Lưu dữ liệu KPI nếu middleware có trả về.
      // Nếu chỉ có { ok: true }, không dùng nó làm số liệu.
      const kpiData =
        kpiResult?.kpi ??
        kpiResult?.data?.kpi ??
        kpiResult?.data ??
        kpiResult;

      if (
        kpiData &&
        typeof kpiData === "object" &&
        Object.keys(kpiData).some((key) => key !== "ok")
      ) {
        setKpi(kpiData);
      } else {
        setKpi(null);
      }
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const getStatus = (order) => {
    const status = String(order.status || "").toUpperCase();

    if (status === "DELIVERED") return "Đã giao";
    if (status === "COMPLETED") return "Hoàn tất";
    if (status === "CANCELLED") return "Đã hủy";
    if (status === "IN_TRANSIT") return "Đang vận chuyển";

    if (status === "AWAITING_SHIPMENT" && order.shipping_arranged) {
      return "Chờ bàn giao vận chuyển";
    }

    if (status === "AWAITING_COLLECTION") return "Chờ lấy hàng";
    if (status === "AWAITING_SHIPMENT") return "Chờ xử lý";

    return order.status || "Chưa xác định";
  };

  const getActions = (order) => {
    const status = String(order.status || "").toUpperCase();

    if (status === "AWAITING_SHIPMENT") {
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

    if (status === "IN_TRANSIT") {
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

  const getOrderItems = (order) => {
    if (Array.isArray(order.items)) return order.items;
    if (Array.isArray(order.san_pham)) return order.san_pham;
    return [];
  };

  const getOrderTotal = (order) => {
    const total = Number(order.total_amount ?? order.total);

    if (Number.isFinite(total) && total > 0) {
      return total;
    }

    return getOrderItems(order).reduce((sum, item) => {
      const price = Number(item.price ?? item.unit_price ?? 0);
      const quantity = Number(item.quantity ?? 0);

      return sum + price * quantity;
    }, 0);
  };

  const getStatusCode = (order) =>
    String(order.status || "").toUpperCase();

  const totalOrders = orders.length;

  const pendingOrders = orders.filter((order) =>
    [
      "AWAITING_SHIPMENT",
      "AWAITING_COLLECTION",
      "IN_TRANSIT",
    ].includes(getStatusCode(order))
  ).length;

  const completedOrders = orders.filter((order) =>
    ["DELIVERED", "COMPLETED"].includes(getStatusCode(order))
  ).length;

  const cancelledOrders = orders.filter(
    (order) => getStatusCode(order) === "CANCELLED"
  ).length;

  const totalRevenue = orders.reduce((sum, order) => {
    if (getStatusCode(order) === "CANCELLED") return sum;
    return sum + getOrderTotal(order);
  }, 0);

  const formatPrice = (price) => {
    if (price == null || price === "") return "Đang cập nhật";

    const amount = Number(price);

    if (!Number.isFinite(amount)) return "Đang cập nhật";

    return amount.toLocaleString("vi-VN") + "đ";
  };

  const renderStat = (label, value, Icon) => (
    <div className="seller-stat-card" key={label}>
      <Icon />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );

  const renderKpi = () => {
    const cards = [
      {
        label: "Tổng đơn hàng",
        value: totalOrders.toLocaleString("vi-VN"),
        icon: ShoppingBag,
      },
      {
        label: "Đang xử lý",
        value: pendingOrders.toLocaleString("vi-VN"),
        icon: Package,
      },
      {
        label: "Đã hoàn tất",
        value: completedOrders.toLocaleString("vi-VN"),
        icon: CheckCircle,
      },
      {
        label: "Đã hủy",
        value: cancelledOrders.toLocaleString("vi-VN"),
        icon: XCircle,
      },
      {
        label: "Doanh thu từ đơn hàng",
        value: formatPrice(totalRevenue),
        icon: Wallet,
      },
    ];

    return (
      <>
        <div className="seller-kpi">
          {cards.map((card) =>
            renderStat(card.label, card.value, card.icon)
          )}
        </div>

        <p className="seller-kpi-note">
          Số liệu được tổng hợp từ danh sách đơn hàng tải từ middleware.
          {kpi
            ? " Middleware cũng đã cung cấp dữ liệu thống kê."
            : " API thống kê chưa cung cấp dữ liệu chi tiết nên hệ thống sử dụng dữ liệu đơn hàng để tính toán."}
        </p>
      </>
    );
  };

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
          type="button"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Làm mới
        </button>
      </header>

      <nav className="seller-tabs">
        <button
          type="button"
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          <ShoppingBag size={17} />
          Đơn hàng
        </button>

        <button
          type="button"
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
            {renderStat("Tổng đơn hàng", totalOrders, ShoppingBag)}
            {renderStat("Đang xử lý", pendingOrders, Package)}
            {renderStat("Đã hoàn tất", completedOrders, CheckCircle)}
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
                <button type="button" onClick={loadData}>
                  Thử lại
                </button>
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
                  const orderId = order.order_id || order.id || index;
                  const items = getOrderItems(order);
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
                        {items.map((item, itemIndex) => {
                          const sku = item.seller_sku || item.sku;
                          const quantity = Number(item.quantity || 0);
                          const price = Number(
                            item.price ?? item.unit_price ?? 0
                          );

                          return (
                            <div
                              className="seller-order-item"
                              key={sku || itemIndex}
                            >
                              <div>
                                <strong>
                                  {item.name || sku || "Sản phẩm"}
                                </strong>
                                <span>
                                  SKU: {sku || "—"} · Số lượng: {quantity}
                                </span>
                              </div>

                              <strong>
                                {formatPrice(price * quantity)}
                              </strong>
                            </div>
                          );
                        })}
                      </div>

                      <div className="seller-order-total">
                        <span>Tổng tiền</span>
                        <strong>
                          {formatPrice(getOrderTotal(order))}
                        </strong>
                      </div>

                      {(order.tracking_number ||
                        order.ma_van_don ||
                        order.tracking_code) && (
                        <p className="seller-tracking">
                          Mã vận đơn:{" "}
                          {order.tracking_number ||
                            order.ma_van_don ||
                            order.tracking_code}
                        </p>
                      )}

                      <div className="seller-order-actions">
                        {actions.map((item) => {
                          const Icon = item.icon;

                          return (
                            <button
                              key={item.action}
                              type="button"
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
              <button type="button" onClick={loadData}>
                Thử lại
              </button>
            </div>
          ) : (
            renderKpi()
          )}
        </section>
      )}
    </div>
  );
}

export default NguoiBan;
