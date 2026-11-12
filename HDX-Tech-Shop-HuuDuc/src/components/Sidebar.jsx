import {
  Laptop,
  Keyboard,
  Mouse,
  Headphones,
  Monitor,
  Cable,
  Menu
} from "lucide-react";
const categories = [
  { name: "Tất cả sản phẩm", icon: Laptop },
  { name: "Laptop", icon: Laptop },
  { name: "Bàn phím", icon: Keyboard },
  { name: "Chuột", icon: Mouse },
  { name: "Tai nghe", icon: Headphones },
  { name: "Màn hình", icon: Monitor },
  { name: "Phụ kiện", icon: Cable }
];

function Sidebar({ activeCategory, setActiveCategory }) {
  return (
    <aside className="sidebar">
      <h3><Menu size={18} /> DANH MỤC</h3>

      {categories.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.name}
            className={activeCategory === item.name ? "category active" : "category"}
            onClick={() => setActiveCategory(item.name)}
          >
            <Icon size={19} />
            {item.name}
          </button>
        );
      })}
    </aside>
  );
}

export default Sidebar;
