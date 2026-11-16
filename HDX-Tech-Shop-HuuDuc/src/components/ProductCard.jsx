
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

import { getProductImage } from "../lib/anh";

const categoryConfig = [
  {
    keywords: ["laptop", "may tinh xach tay", "may tinh"],
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
    keywords: ["man hinh", "monitor"],
    Icon: Monitor,
    color: "#e5f3ff",
    iconColor: "#2584c7",
    label: "MAN HINH",
  },
  {
    keywords: ["ssd", "o cung"],
    Icon: HardDrive,
    color: "#e5f5ee",
    iconColor: "#26966a",
    label: "LUU TRU",
  },
  {
    keywords: ["hub", "cap", "day", "adapter"],
    Icon: Cable,
    color: "#fff1e4",
    iconColor: "#d47a31",
    label: "PHU KIEN",
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
    keywords: ["chuot", "mouse", "lot chuot"],
    Icon: Mouse,
    color: "#f1edff",
    iconColor: "#7856c7",
    label: "CHUOT",
  },
  {
    keywords: ["balo", "backpack"],
    Icon: Backpack,
    color: "#fff0e5",
    iconColor: "#bc7741",
    label: "BALO",
  },
  {
    keywords: ["tui chong soc", "tui laptop"],
    Icon: BriefcaseBusiness,
    color: "#edf0f4",
    iconColor: "#596777",
    label: "TUI LAPTOP",
  },
  {
    keywords: ["de tan nhiet", "tan nhiet"],
    Icon: Snowflake,
    color: "#e5f7ff",
    iconColor: "#2898c7",
    label: "TAN NHIET",
  },
  {
    keywords: ["sac", "pin"],
    Icon: BatteryCharging,
    color: "#e8f7e9",
    iconColor: "#39964b",
    label: "SAC",
  },
  {
    keywords: ["gia treo"],
    Icon: Monitor,
    color: "#e9efff",
    iconColor: "#476ac4",
    label: "GIA TREO",
  },
  {
    keywords: ["ke tay", "ban phim", "keyboard"],
    Icon: Keyboard,
    color: "#f1edff",
    iconColor: "#7959bd",
    label: "BAN PHIM",
  },
  {
    keywords: ["cpu", "linh kien"],
    Icon: Cpu,
    color: "#e6f4f3",
    iconColor: "#318d85",
    label: "LINH KIEN",
  },
  {
    keywords: ["loa", "speaker"],
    Icon: Speaker,
    color: "#fff0e9",
    iconColor: "#d47b51",
    label: "LOA",
  },
  {
    keywords: ["dien thoai", "smartphone"],
    Icon: Smartphone,
    color: "#e9edff",
    iconColor: "#586bc4",
    label: "DIEN THOAI",
  },
];

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function getCategoryConfig(category = "") {
  const normalized = normalize(category);

  return (
    categoryConfig.find((item) =>
      item.keywords.some((keyword) =>
        normalized.includes(normalize(keyword))
      )
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

  const stock = Number(product.stock || 0);
  const outOfStock = stock <= 0;

  const config = getCategoryConfig(product.category);
  const CategoryIcon = config.Icon;
  const productImage = getProductImage(product);

  return (
    <article className="product-card">
      <div
        className="product-image clickable"
        onClick={() => onViewDetail?.(product)}
        style={{
          background: config.color,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src={productImage}
          alt={product.name || "Sản phẩm HDX Tech"}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = getProductImage({});
          }}
          style={{
            width: "100%",
            height: "100%",
            minHeight: "160px",
            objectFit: "contain",
            padding: "12px",
            display: "block",
          }}
        />

        <span className="product-image-label">HDX TECH</span>

        {outOfStock && (
          <span className="discount">Hết hàng</span>
        )}
      </div>

      <div className="product-info">
        <span className="product-category">
          {product.category || "Phụ kiện công nghệ"}
        </span>

        <h3
          className="clickable"
          onClick={() => onViewDetail?.(product)}
        >
          {product.name}
        </h3>

        <div className="rating">
          <CategoryIcon size={14} color={config.iconColor} />
          <span>
            {outOfStock
              ? "Tạm hết hàng"
              : `Còn ${stock} sản phẩm`}
          </span>
        </div>

        <div className="price-row">
          <strong>{formatPrice(product.price)}</strong>
        </div>

        <div className="product-card-actions">
          <button
            type="button"
            className="add-cart"
            disabled={outOfStock}
            onClick={() => onAddToCart?.(product)}
          >
            <ShoppingCart size={16} />
            {outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
          </button>

          <button
            type="button"
            className="quick-view"
            title="Xem chi tiết"
            aria-label="Xem chi tiết sản phẩm"
            onClick={() => onViewDetail?.(product)}
          >
            <Eye size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
