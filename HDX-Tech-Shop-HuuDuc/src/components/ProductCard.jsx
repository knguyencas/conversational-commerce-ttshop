
import {
  ShoppingCart,
  Eye,
  Package,
  Laptop,
  Headphones,
  Monitor,
  HardDrive,
  Cable,
  Mic,
  Camera,
  Mouse,
  Backpack,
  BriefcaseBusiness,
  Snowflake,
  BatteryCharging,
  Keyboard,
  Cpu,
  Speaker,
  Smartphone,
} from "lucide-react";

const categoryConfig = [
  {
    keywords: ["laptop", "máy tính xách tay", "máy tính"],
    Icon: Laptop,
    color: "#e8efff",
    iconColor: "#3563c9",
    label: "LAPTOP",
  },
  {
    keywords: ["tai nghe", "headphone", "earphone"],
    Icon: Headphones,
    color: "#f3eaff",
    iconColor: "#8954c8",
    label: "TAI NGHE",
  },
  {
    keywords: ["màn hình", "monitor"],
    Icon: Monitor,
    color: "#e5f3ff",
    iconColor: "#2584c7",
    label: "MÀN HÌNH",
  },
  {
    keywords: ["ssd", "ổ cứng"],
    Icon: HardDrive,
    color: "#e5f5ee",
    iconColor: "#26966a",
    label: "LƯU TRỮ",
  },
  {
    keywords: ["hub", "cáp", "dây", "adapter"],
    Icon: Cable,
    color: "#fff1e4",
    iconColor: "#d47a31",
    label: "PHỤ KIỆN",
  },
  {
    keywords: ["micro", "mic"],
    Icon: Mic,
    color: "#ffe9ec",
    iconColor: "#d94c67",
    label: "MICRO",
  },
  {
    keywords: ["webcam", "camera"],
    Icon: Camera,
    color: "#e8edff",
    iconColor: "#536bc8",
    label: "WEBCAM",
  },
  {
    keywords: ["chuột", "mouse", "lót chuột"],
    Icon: Mouse,
    color: "#f1edff",
    iconColor: "#7856c7",
    label: "CHUỘT",
  },
  {
    keywords: ["balo"],
    Icon: Backpack,
    color: "#fff0e5",
    iconColor: "#bc7741",
    label: "BALO",
  },
  {
    keywords: ["túi chống sốc", "túi laptop"],
    Icon: BriefcaseBusiness,
    color: "#edf0f4",
    iconColor: "#596777",
    label: "TÚI LAPTOP",
  },
  {
    keywords: ["đế tản nhiệt", "tản nhiệt"],
    Icon: Snowflake,
    color: "#e5f7ff",
    iconColor: "#2898c7",
    label: "TẢN NHIỆT",
  },
  {
    keywords: ["sạc", "pin"],
    Icon: BatteryCharging,
    color: "#e8f7e9",
    iconColor: "#39964b",
    label: "SẠC",
  },
  {
    keywords: ["giá treo"],
    Icon: Monitor,
    color: "#e9efff",
    iconColor: "#476ac4",
    label: "GIÁ TREO",
  },
  {
    keywords: ["kê tay", "bàn phím", "keyboard"],
    Icon: Keyboard,
    color: "#f1edff",
    iconColor: "#7959bd",
    label: "BÀN PHÍM",
  },
  {
    keywords: ["cpu", "linh kiện"],
    Icon: Cpu,
    color: "#e6f4f3",
    iconColor: "#318d85",
    label: "LINH KIỆN",
  },
  {
    keywords: ["loa", "speaker"],
    Icon: Speaker,
    color: "#fff0e9",
    iconColor: "#d47b51",
    label: "LOA",
  },
  {
    keywords: ["điện thoại", "smartphone"],
    Icon: Smartphone,
    color: "#e9edff",
    iconColor: "#586bc4",
    label: "ĐIỆN THOẠI",
  },
];

function getCategoryConfig(category = "") {
  const normalized = category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

  return (
    categoryConfig.find((item) =>
      item.keywords.some((keyword) => {
        const normalizedKeyword = keyword
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d");

        return normalized.includes(normalizedKeyword);
      })
    ) || {
      Icon: Package,
      color: "#f0f1f4",
      iconColor: "#687386",
      label: "HDX TECH",
    }
  );
}

function ProductCard({ product, onAddToCart, onViewDetail }) {
  const formatPrice = (price) =>
    Number(price || 0).toLocaleString("vi-VN") + "₫";

  const outOfStock = Number(product.stock) <= 0;
  const config = getCategoryConfig(product.category);
  const CategoryIcon = config.Icon;

  return (
    <article className="product-card">
      <div
        className="product-image clickable"
        onClick={() => onViewDetail(product)}
        style={{
          background: config.color,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="product-placeholder"
          style={{
            width: "100%",
            height: "100%",
            minHeight: "160px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            background: config.color,
          }}
        >
          <div
            style={{
              width: "76px",
              height: "76px",
              borderRadius: "22px",
              background: "rgba(255,255,255,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            }}
          >
            <CategoryIcon
              size={42}
              strokeWidth={1.6}
              color={config.iconColor}
            />
          </div>

          <span
            style={{
              color: config.iconColor,
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "1.5px",
            }}
          >
            {config.label}
          </span>
        </div>

        <span className="product-image-label">HDX TECH</span>

        {outOfStock && (
          <span className="discount">Hết hàng</span>
        )}
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
          <Package size={14} />
          <span>
            {outOfStock
              ? "Tạm hết hàng"
              : `Còn ${product.stock} sản phẩm`}
          </span>
        </div>

        <div className="price-row">
          <strong>{formatPrice(product.price)}</strong>
        </div>

        <div className="product-card-actions">
          <button
            className="add-cart"
            disabled={outOfStock}
            onClick={() => onAddToCart(product)}
          >
            <ShoppingCart size={16} />
            {outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
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
