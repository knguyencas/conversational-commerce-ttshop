
import { useEffect, useMemo, useState } from "react";
import {
  Zap,
  Truck,
  ShieldCheck,
  Headphones,
  Flame,
  ChevronRight,
  PlayCircle,
  ShoppingBag,
  Sparkles,
  Clock3
} from "lucide-react";

import Header from "./components/Header";
import ProductCard from "./components/ProductCard";
import CartDrawer from "./components/CartDrawer";
import ProductDetail from "./components/ProductDetail";
import Checkout from "./components/Checkout";

import "./App.css";

function App() {
  // =========================
  // STATE
  // =========================

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
const handleSearch = (e) => {
  e.preventDefault();

  const productSection = document.getElementById("shop-products");

  if (!productSection) {
    console.log("Không tìm thấy shop-products");
    return;
  }

  const startPosition = window.scrollY;
  const targetPosition =
    productSection.getBoundingClientRect().top + window.scrollY - 100;

  window.scrollTo({
    top: targetPosition,
    behavior: "smooth",
  });

  console.log("Vị trí bắt đầu:", startPosition);
  console.log("Vị trí đích:", targetPosition);
};
  // Dữ liệu sản phẩm lấy từ Backend
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState("");

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [timeLeft, setTimeLeft] = useState(5 * 60 * 60);

  // =========================
  // LẤY SẢN PHẨM TỪ BACKEND
  // =========================

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        setProductError("");

        const response = await fetch(
          "http://localhost:5000/api/products",
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Không thể kết nối đến Backend");
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.data)) {
          throw new Error("Dữ liệu sản phẩm không hợp lệ");
        }

        setProducts(result.data);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Lỗi tải sản phẩm:", error);
          setProductError(
            error.message || "Không thể tải sản phẩm"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProducts(false);
        }
      }
    };

    fetchProducts();

    return () => controller.abort();
  }, []);

  // =========================
  // DANH MỤC
  // =========================

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(products.map((product) => product.category))
    ];

    return ["Tất cả", ...uniqueCategories];
  }, [products]);

  // =========================
  // ĐẾM NGƯỢC FLASH SALE
  // =========================

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 0) return 0;
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0")
    ].join(":");
  };

  // =========================
  // LỌC SẢN PHẨM
  // =========================

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        activeCategory === "Tất cả" ||
        product.category === activeCategory;

      const keyword = search.trim().toLowerCase();

      const matchSearch =
        !keyword ||
        product.name?.toLowerCase().includes(keyword) ||
        product.sku?.toLowerCase().includes(keyword);

      return matchCategory && matchSearch;
    });
  }, [products, search, activeCategory]);

  // =========================
  // GIỎ HÀNG
  // =========================

  const addToCart = (product) => {
    setCart((previousCart) => {
      const existingItem = previousCart.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        return previousCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...previousCart,
        {
          ...product,
          quantity: 1
        }
      ];
    });

    setSelectedProduct(null);
  };

  const updateQuantity = (productId, amount) => {
    setCart((previousCart) =>
      previousCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity + amount
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((previousCart) =>
      previousCart.filter((item) => item.id !== productId)
    );
  };

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // =========================
  // THANH TOÁN
  // =========================

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Giỏ hàng của bạn đang trống!");
      return;
    }

    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderComplete = (orderData) => {
    console.log("Thông tin đơn hàng:", orderData);

    // Xóa giỏ hàng nhưng giữ màn hình thành công
    // để khách hàng nhìn thấy mã đơn hàng.
    setCart([]);
  };

  // =========================
  // HIỂN THỊ
  // =========================

  return (
    <>
      {/* THANH THÔNG BÁO */}
      <div className="top-strip">
        <div className="top-strip-inner">
          <span>
            <Zap size={14} />
            Ưu đãi công nghệ mỗi ngày tại HDX Tech
          </span>

          <span>
            <Truck size={14} />
            Miễn phí vận chuyển cho đơn hàng đủ điều kiện
          </span>
        </div>
      </div>

      {/* HEADER */}
      <Header
  search={search}
  setSearch={setSearch}
  handleSearch={handleSearch}
  cartCount={cartCount}
  onCartClick={() => setIsCartOpen(true)}
/>
      {/* THANH DANH MỤC */}
      <nav className="main-nav">
        <div className="main-nav-inner">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={`nav-item ${
                activeCategory === category ? "active" : ""
              }`}
              onClick={() => {
                setActiveCategory(category);

                document
                  .getElementById("shop-products")
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                  });
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </nav>

      <div className="shop-container">
        {/* BANNER CHÍNH */}
        <section className="shop-hero">
          <div className="shop-hero-content">
            <span className="hero-kicker">
              <Sparkles size={15} />
              HDX TECH STORE
            </span>

            <h1>
              Nâng cấp trải nghiệm
              <br />
              <span>công nghệ của bạn</span>
            </h1>

            <p>
              Khám phá những sản phẩm công nghệ chất lượng
              với mức giá hấp dẫn tại HDX Tech.
            </p>

            <button
              type="button"
              onClick={() => {
                setActiveCategory("Tất cả");
                document
                  .getElementById("shop-products")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Khám phá ngay
              <ChevronRight size={18} />
            </button>

            <div className="hero-note">
              <strong>HDX TECH</strong>
              <span>Technology for your lifestyle</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-circle"></div>

            <div className="hero-product-card">
              <span>HDX TECH COLLECTION</span>
              <div className="hero-product-symbol">
                <ShoppingBag size={58} />
              </div>
              <strong>TECHNOLOGY</strong>
              <small>Upgrade your experience</small>
            </div>

            <div className="hero-sale-bubble">
              <small>ƯU ĐÃI ĐẾN</small>
              <strong>50%</strong>
              <small>CHO SẢN PHẨM</small>
            </div>
          </div>
        </section>

        {/* CAM KẾT DỊCH VỤ */}
        <section className="quick-benefits">
          <div>
            <Truck size={23} />
            <span>Giao hàng nhanh toàn quốc</span>
          </div>

          <div>
            <ShieldCheck size={23} />
            <span>Sản phẩm chính hãng</span>
          </div>

          <div>
            <Headphones size={23} />
            <span>Hỗ trợ khách hàng tận tình</span>
          </div>

          <div>
            <ShoppingBag size={23} />
            <span>Mua sắm tiện lợi</span>
          </div>
        </section>

        {/* DANH MỤC SẢN PHẨM */}
        <section className="category-section">
          <div className="block-heading">
            <div>
              <span className="eyebrow">DANH MỤC</span>
              <h2>Khám phá theo danh mục</h2>
            </div>
          </div>

          <div className="category-list">
            {categories.map((category, index) => (
              <button
                type="button"
                key={category}
                className={`category-chip ${
                  activeCategory === category ? "selected" : ""
                }`}
                onClick={() => {
                  setActiveCategory(category);
                  document
                    .getElementById("shop-products")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="category-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* FLASH SALE */}
        <section className="flash-section">
          <div className="flash-heading">
            <div>
              <span className="flash-label">
                <Flame size={19} />
                FLASH SALE
              </span>

              <h2>Ưu đãi nổi bật hôm nay</h2>
              <p>Số lượng có hạn - Nhanh tay lựa chọn!</p>
            </div>

            <div className="flash-countdown">
              <span>
                <Clock3 size={15} />
                Kết thúc sau
              </span>
              <strong>{formatTime(timeLeft)}</strong>
            </div>
          </div>

          <div className="flash-banner">
            <div>
              <strong>DEAL CÔNG NGHỆ SIÊU HỜI</strong>
              <span>
                Khám phá các sản phẩm nổi bật tại HDX Tech
              </span>
            </div>

            <span className="flash-tag">
              HOT DEAL
            </span>
          </div>

          <div className="flash-product-grid">
            {products.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                onViewDetail={setSelectedProduct}
              />
            ))}
          </div>

          <button
            type="button"
            className="flash-view-all"
            onClick={() => {
              setActiveCategory("Tất cả");
              document
                .getElementById("shop-products")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Xem tất cả sản phẩm
            <ChevronRight size={16} />
          </button>
        </section>

        {/* TẤT CẢ SẢN PHẨM */}
        <section className="shop-products" id="shop-products">
          <div className="block-heading">
            <div>
              <span className="eyebrow">HDX TECH STORE</span>

              <h2>
                {activeCategory === "Tất cả"
                  ? "Tất cả sản phẩm"
                  : activeCategory}
              </h2>

              <span className="product-count">
                Tìm thấy {filteredProducts.length} sản phẩm
              </span>
            </div>
          </div>

          {loadingProducts ? (
            <div className="empty-products">
              <ShoppingBag size={40} />
              <h3>Đang tải sản phẩm...</h3>
              <p>Vui lòng chờ trong giây lát.</p>
            </div>
          ) : productError ? (
            <div className="empty-products">
              <ShoppingBag size={40} />
              <h3>Không thể tải sản phẩm</h3>
              <p>{productError}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Thử lại
              </button>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  onViewDetail={setSelectedProduct}
                />
              ))}
            </div>
          ) : (
            <div className="empty-products">
              <ShoppingBag size={40} />
              <h3>Không tìm thấy sản phẩm</h3>
              <p>
                Hãy thử tìm kiếm bằng tên hoặc mã SKU khác.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("Tất cả");
                }}
              >
                Xem tất cả sản phẩm
              </button>
            </div>
          )}
        </section>

        {/* VIDEO VÀ LIVESTREAM */}
        <section className="video-section">
          <div className="block-heading">
            <div>
              <span className="eyebrow">VIDEO COMMERCE</span>
              <h2>Khám phá công nghệ</h2>
            </div>

            <div className="live-status">
              <span></span>
              HDX TECH LIVE
            </div>
          </div>

          <div className="video-grid">
            <div className="video-card video-dark">
              <PlayCircle className="video-play" size={35} />
              <span className="video-tag">REVIEW</span>
              <strong>Khám phá sản phẩm công nghệ</strong>
              <small>Video giới thiệu và đánh giá sản phẩm</small>
            </div>

            <div className="video-card video-red">
              <PlayCircle className="video-play" size={35} />
              <span className="video-tag">FLASH DEAL</span>
              <strong>Săn deal công nghệ mỗi ngày</strong>
              <small>Cập nhật những ưu đãi hấp dẫn</small>
            </div>

            <div className="video-card video-blue">
              <PlayCircle className="video-play" size={35} />
              <span className="video-tag">LIVESTREAM</span>
              <strong>HDX Tech Live</strong>
              <small>Trải nghiệm mua sắm trực tuyến</small>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="shop-footer">
          <div className="footer-brand">
            <span className="footer-logo">HDX</span>

            <div>
              <strong>HDX Tech</strong>
              <p>Nền tảng mua sắm công nghệ trực tuyến.</p>
            </div>
          </div>

          <span>
            © 2026 HDX Tech. All rights reserved.
          </span>
        </footer>
      </div>

      {/* GIỎ HÀNG */}
      {isCartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onCheckout={handleCheckout}
        />
      )}

      {/* CHI TIẾT SẢN PHẨM */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* THANH TOÁN */}
      {isCheckoutOpen && (
        <Checkout
          cart={cart}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderComplete={handleOrderComplete}
        />
      )}
    </>
  );
}

export default App;
