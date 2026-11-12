
import { Search, ShoppingCart, User } from "lucide-react";

function Header({
  search,
  setSearch,
  handleSearch,
  cartCount,
  onCartClick
}) {
  return (
    <header className="header">
      <div className="header-inner">
        <a href="/" className="logo">
          <span className="logo-icon">HDX</span>
          <span>HDX Tech</span>
        </a>

        <form className="search-box" onSubmit={handleSearch}>
          <Search size={20} />

          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm công nghệ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button type="submit" title="Tìm kiếm">
            Tìm
          </button>
        </form>

        <div className="header-actions">
          <button
            type="button"
            className="icon-button"
            title="Tài khoản"
          >
            <User size={21} />
          </button>

          <button
            type="button"
            className="cart-button"
            onClick={onCartClick}
          >
            <ShoppingCart size={21} />
            <span>Giỏ hàng</span>
            <b>{cartCount}</b>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
