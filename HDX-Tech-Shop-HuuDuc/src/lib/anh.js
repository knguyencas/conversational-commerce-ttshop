
const PRODUCT_IMAGES = {
  laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800",
  keyboard: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
  mouse: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800",
  headphone: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
  monitor: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
  ssd: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800",
  hub: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800",
  microphone: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800",
  webcam: "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800",
  mousepad: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800",
  backpack: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
  sleeve: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800",
  cooling: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800",
  charger: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800",
  cable: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
  stand: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800",
  wristrest: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800",
  speaker: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800",
  smartphone: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
  accessory: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
};

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

const imageRules = [
  { keywords: ["laptop", "macbook", "vivobook", "aspire", "ideapad"], image: "laptop" },
  { keywords: ["ban phim", "keyboard", "keychron", "akko", "rapoo"], image: "keyboard" },
  { keywords: ["lot chuot", "mousepad", "qck"], image: "mousepad" },
  { keywords: ["chuot", "mouse", "razer", "g102", "m650"], image: "mouse" },
  { keywords: ["tai nghe", "headphone", "earphone", "sony wh", "jbl tune", "hyperx cloud", "soundcore"], image: "headphone" },
  { keywords: ["man hinh", "monitor", "lg 24", "aoc"], image: "monitor" },
  { keywords: ["ssd", "o cung", "870 evo", "kingston nv"], image: "ssd" },
  { keywords: ["hub", "revodok", "metal gleam"], image: "hub" },
  { keywords: ["microphone", "micro", "fifine"], image: "microphone" },
  { keywords: ["webcam", "camera", "logitech c920"], image: "webcam" },
  { keywords: ["balo", "backpack"], image: "backpack" },
  { keywords: ["tui chong soc", "tui laptop", "sleeve"], image: "sleeve" },
  { keywords: ["de tan nhiet", "tan nhiet", "cooling"], image: "cooling" },
  { keywords: ["sac laptop", "adapter", "charger", "bo sac"], image: "charger" },
  { keywords: ["cap", "day ket noi", "cable"], image: "cable" },
  { keywords: ["gia treo", "stand"], image: "stand" },
  { keywords: ["ke tay", "wrist rest", "wristrest"], image: "wristrest" },
  { keywords: ["loa", "speaker"], image: "speaker" },
  { keywords: ["dien thoai", "smartphone", "iphone"], image: "smartphone" },
];

export function getProductImage(product = {}) {
  if (product.image) return product.image;

  const searchText = normalize(
    `${product.name || ""} ${product.category || ""}`
  );

  const matchedRule = imageRules.find((rule) =>
    rule.keywords.some((keyword) =>
      searchText.includes(normalize(keyword))
    )
  );

  return PRODUCT_IMAGES[matchedRule?.image || "accessory"];
}

export default getProductImage;
