
import { useEffect, useMemo, useState } from "react";
import { laySanPham } from "./api";

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
  Store,
} from "lucide-react";

import Header from "./components/Header";
import ProductCard from "./components/ProductCard";
import CartDrawer from "./components/CartDrawer";
import ProductDetail from "./components/ProductDetail";
import Checkout from "./components/Checkout";
import Chat from "./components/Chat";
import DonCuaToi from "./components/DonCuaToi";
import NguoiBan from "./components/NguoiBan";

import "./App.css";

function App() {
  // =========================
  // STATE
  // =========================

  const [currentPage, setCurrentPage] = useState("home");

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState("");

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [chatRequest, setChatRequest] = useState(null);

  // =========================
  // TÌM KIẾM
  // =========================

  const handleSearch = (e) => {
    e.preventDefault();

    setCurrentPage("home");

    setTimeout(() => {
      document.getElementById("shop-products")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // =========================
  // LẤY SẢN PHẨM TỪ MIDDLEWARE
  // =========================

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        setProductError("");

        const result = await laySanPham();

        if (!Array.isArray(result.products)) {
          throw new Error("Dữ liệu sản phẩm không hợp lệ.");
        }

        if (!cancelled) {
          setProducts(result.products);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Lỗi tải sản phẩm:", error);
          setProductError(
            error.message || "Không thể tải sản phẩm."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================
  // DANH MỤC
  // =========================

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(products.map((product) => product.category)),
    ];

    return ["Tất cả", ...uniqueCategories];
  }, [products]);

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
    const selectedStock =
      product.selectedColorStock != null
        ? Number(product.selectedColorStock)
        : Number(product.stock || 0);

    if (selectedStock <= 0) {
      alert("Sản phẩm hoặc màu sắc này hiện đã hết hàng.");
      return;
    }

    const color = product.selectedColor || null;
    const cartId = `${product.sku}-${color || "default"}`;

    setCart((previousCart) => {
      const existingItem = previousCart.find(
        (item) => item.id === cartId
      );

      if (existingItem) {
        if (existingItem.quantity >= selectedStock) {
          alert("Số lượng đã đạt mức tồn kho của màu này.");
          return previousCart;
        }

        return previousCart.map((item) =>
          item.id === cartId
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...previousCart,
        {
          ...product,
          id: cartId,
          selectedColor: color,
          selectedColorStock: selectedStock,
          quantity: 1,
        },
      ];
    });

    setSelectedProduct(null);
  };

  const updateQuantity = (productId, amount) => {
    setCart((previousCart) =>
      previousCart
        .map((item) => {
          if (item.id !== productId && item.sku !== productId) {
            return item;
          }

          const newQuantity = item.quantity + amount;
          const maxStock =
            item.selectedColorStock ?? item.stock;

          if (newQuantity > maxStock) {
            alert("Số lượng vượt quá tồn kho.");
            return item;
          }

          return {
            ...item,
            quantity: newQuantity,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((previousCart) =>
      previousCart.filter(
        (item) => item.id !== productId && item.sku !== productId
      )
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
    console.log("Đơn hàng đã được API xác nhận:", orderData);
    setCart([]);
  };

  // =========================
  // MUA NGAY
  // =========================

  const handleBuyNow = (product) => {
    const selectedStock =
      product.selectedColorStock != null
        ? Number(product.selectedColorStock)
        : Number(product.stock || 0);

    if (selectedStock <= 0) {
      alert("Sản phẩm hiện đã hết hàng.");
      return;
    }

    const color = product.selectedColor || null;

    setCart([
      {
        ...product,
        id: `${product.sku}-${color || "default"}`,
        selectedColor: color,
        selectedColorStock: selectedStock,
        quantity: 1,
      },
    ]);

    setSelectedProduct(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // =========================
  // CHAT VỚI SẢN PHẨM ĐANG XEM
  // =========================

  const handleChatProduct = (product) => {
    setChatRequest({
      id: Date.now(),
      product,
    });

    setSelectedProduct(null);
  };

  // =========================
  // HỎI SHOP VỀ ĐƠN HÀNG
  // =========================

  const handleAskShop = () => {
    alert(
      "Bạn hãy bấm nút Chat với Shop ở góc dưới bên phải để liên hệ HDX Tech."
    );
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

      {/* ĐIỀU HƯỚNG */}

      <nav className="customer-navigation">
        <button
          type="button"
          className={currentPage === "home" ? "active" : ""}
          onClick={() => setCurrentPage("home")}
        >
          <ShoppingBag size={16} />
          Trang chủ
        </button>

        <button
          type="button"
          className={currentPage === "orders" ? "active" : ""}
          onClick={() => setCurrentPage("orders")}
        >
          <Truck size={16} />
          Đơn hàng của tôi
        </button>

        <button
          type="button"
          className={currentPage === "seller" ? "active" : ""}
          onClick={() => setCurrentPage("seller")}
        >
          <Store size={16} />
          Người bán
        </button>
      </nav>

      {/* =========================
          TRANG CHỦ
      ========================= */}

      {currentPage === "home" && (
        <>
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
                        block: "start",
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
                  tại HDX Tech.
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

            {/* SẢN PHẨM NỔI BẬT */}

            <section className="flash-section">
              <div className="flash-heading">
                <div>
                  <span className="flash-label">
                    <Flame size={19} />
                    HDX TECH
                  </span>

                  <h2>Sản phẩm nổi bật</h2>
                  <p>Khám phá các sản phẩm tại HDX Tech.</p>
                </div>
              </div>

              <div className="flash-banner">
                <div>
                  <strong>KHÁM PHÁ CÔNG NGHỆ</strong>
                  <span>
                    Tìm sản phẩm phù hợp với nhu cầu của bạn
                  </span>
                </div>

                <span className="flash-tag">HDX TECH</span>
              </div>

              <div className="flash-product-grid">
                {products.slice(0, 4).map((product) => (
                  <ProductCard
                    key={product.sku}
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
                      key={product.sku}
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
                  HDX TECH
                </div>
              </div>

              <div className="video-grid">
                <div className="video-card video-dark">
                  <PlayCircle className="video-play" size={35} />
                  <span className="video-tag">REVIEW</span>
                  <strong>Khám phá sản phẩm công nghệ</strong>
                  <small>
                    Video giới thiệu và đánh giá sản phẩm
                  </small>
                </div>

                <div className="video-card video-red">
                  <PlayCircle className="video-play" size={35} />
                  <span className="video-tag">SẢN PHẨM</span>
                  <strong>Khám phá công nghệ mới</strong>
                  <small>
                    Tìm hiểu thêm về các sản phẩm
                  </small>
                </div>

                <div className="video-card video-blue">
                  <PlayCircle className="video-play" size={35} />
                  <span className="video-tag">HDX TECH</span>
                  <strong>HDX Tech Store</strong>
                  <small>
                    Trải nghiệm mua sắm trực tuyến
                  </small>
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
        </>
      )}

      {/* TRANG ĐƠN HÀNG CỦA TÔI */}

      {currentPage === "orders" && (
        <DonCuaToi onAskShop={handleAskShop} />
      )}

      {/* TRANG NGƯỜI BÁN */}

      {currentPage === "seller" && (
        <NguoiBan />
      )}

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
          onBuyNow={handleBuyNow}
          onChat={handleChatProduct}
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

      {/* CHAT VỚI SHOP */}

      <Chat
        products={products}
        onAddToCart={addToCart}
        chatRequest={chatRequest}
      />
    </>
  );
}

export default App;
