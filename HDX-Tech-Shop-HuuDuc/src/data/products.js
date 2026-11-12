
const images = {
  laptop:
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700",
  keyboard:
    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700",
  mouse:
    "https://images.unsplash.com/photo-1527814050087-3793815479db?w=700",
  headphone:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700",
  monitor:
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=700",
  accessory:
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=700"
};

const products = [
  {
    id: 1,
    sku: "HD-LAP-001",
    name: "Laptop ASUS Vivobook 15 X1504",
    category: "Laptop",
    price: 16990000,
    oldPrice: 18990000,
    rating: 4.9,
    sold: 120,
    image: images.laptop,
    description: "Laptop ASUS Vivobook 15, phù hợp cho học tập, làm việc văn phòng và giải trí."
  },
  {
    id: 2,
    sku: "HD-LAP-002",
    name: "Laptop Acer Aspire 5 A515",
    category: "Laptop",
    price: 15490000,
    oldPrice: 17490000,
    rating: 4.8,
    sold: 85,
    image: images.laptop,
    description: "Laptop Acer Aspire 5 dành cho học tập và công việc hằng ngày."
  },
  {
    id: 3,
    sku: "HD-LAP-003",
    name: "Lenovo IdeaPad Slim 3 15",
    category: "Laptop",
    price: 14990000,
    oldPrice: 16490000,
    rating: 4.8,
    sold: 96,
    image: images.laptop,
    description: "Laptop Lenovo IdeaPad Slim 3 với thiết kế gọn nhẹ, phù hợp cho học tập và văn phòng."
  },
  {
    id: 4,
    sku: "HD-LAP-004",
    name: "Laptop HP 15s",
    category: "Laptop",
    price: 16490000,
    oldPrice: 17990000,
    rating: 4.8,
    sold: 68,
    image: images.laptop,
    description: "Laptop HP 15s phục vụ nhu cầu làm việc, học tập và giải trí."
  },
  {
    id: 5,
    sku: "HD-LAP-005",
    name: "Apple MacBook Air 13 M2",
    category: "Laptop",
    price: 22990000,
    oldPrice: 24990000,
    rating: 5.0,
    sold: 95,
    image: images.laptop,
    description: "MacBook Air 13 inch sử dụng chip Apple M2, thiết kế mỏng nhẹ."
  },
  {
    id: 6,
    sku: "HD-KEY-001",
    name: "Logitech Pebble Keys 2 K380s",
    category: "Bàn phím",
    price: 699000,
    oldPrice: 799000,
    rating: 4.8,
    sold: 145,
    image: images.keyboard,
    description: "Bàn phím không dây nhỏ gọn, phù hợp với góc làm việc tối giản."
  },
  {
    id: 7,
    sku: "HD-KEY-002",
    name: "Keychron K2 Pro",
    category: "Bàn phím",
    price: 2190000,
    oldPrice: 2490000,
    rating: 4.9,
    sold: 210,
    image: images.keyboard,
    description: "Bàn phím cơ Keychron K2 Pro dành cho người dùng yêu thích trải nghiệm gõ phím."
  },
  {
    id: 8,
    sku: "HD-KEY-003",
    name: "Akko 3068B Plus",
    category: "Bàn phím",
    price: 1590000,
    oldPrice: 1790000,
    rating: 4.8,
    sold: 112,
    image: images.keyboard,
    description: "Bàn phím cơ nhỏ gọn, phù hợp với góc máy tính cá nhân."
  },
  {
    id: 9,
    sku: "HD-KEY-004",
    name: "Rapoo E9050L",
    category: "Bàn phím",
    price: 499000,
    oldPrice: 599000,
    rating: 4.7,
    sold: 90,
    image: images.keyboard,
    description: "Bàn phím không dây thiết kế mỏng, tiện lợi cho bàn làm việc."
  },
  {
    id: 10,
    sku: "HD-MOU-001",
    name: "Logitech G102 LIGHTSYNC",
    category: "Chuột",
    price: 399000,
    oldPrice: 499000,
    rating: 4.8,
    sold: 350,
    image: images.mouse,
    description: "Chuột gaming Logitech G102 với thiết kế quen thuộc cho người chơi game."
  },
  {
    id: 11,
    sku: "HD-MOU-002",
    name: "Logitech Signature M650",
    category: "Chuột",
    price: 799000,
    oldPrice: 899000,
    rating: 4.9,
    sold: 130,
    image: images.mouse,
    description: "Chuột Logitech Signature M650 dành cho công việc và sử dụng hằng ngày."
  },
  {
    id: 12,
    sku: "HD-MOU-003",
    name: "Razer DeathAdder Essential",
    category: "Chuột",
    price: 599000,
    oldPrice: 699000,
    rating: 4.8,
    sold: 175,
    image: images.mouse,
    description: "Chuột gaming Razer DeathAdder Essential với thiết kế công thái học."
  },
  {
    id: 13,
    sku: "HD-HDP-001",
    name: "Sony WH-CH520",
    category: "Tai nghe",
    price: 1190000,
    oldPrice: 1390000,
    rating: 4.9,
    sold: 160,
    image: images.headphone,
    description: "Tai nghe không dây Sony WH-CH520 dành cho nghe nhạc và giải trí."
  },
  {
    id: 14,
    sku: "HD-HDP-002",
    name: "Soundcore Life Q20i",
    category: "Tai nghe",
    price: 1290000,
    oldPrice: 1590000,
    rating: 4.9,
    sold: 180,
    image: images.headphone,
    description: "Tai nghe Soundcore Life Q20i với thiết kế chụp tai."
  },
  {
    id: 15,
    sku: "HD-HDP-003",
    name: "JBL Tune 510BT",
    category: "Tai nghe",
    price: 990000,
    oldPrice: 1190000,
    rating: 4.8,
    sold: 145,
    image: images.headphone,
    description: "Tai nghe JBL Tune 510BT phục vụ nhu cầu nghe nhạc hằng ngày."
  },
  {
    id: 16,
    sku: "HD-HDP-004",
    name: "HyperX Cloud Stinger 2",
    category: "Tai nghe",
    price: 1390000,
    oldPrice: 1590000,
    rating: 4.9,
    sold: 105,
    image: images.headphone,
    description: "Tai nghe gaming HyperX Cloud Stinger 2 dành cho giải trí và chơi game."
  },
  {
    id: 17,
    sku: "HD-MON-001",
    name: "LG 24MP400 23.8 inch",
    category: "Màn hình",
    price: 2490000,
    oldPrice: 2790000,
    rating: 4.8,
    sold: 72,
    image: images.monitor,
    description: "Màn hình LG 23.8 inch phục vụ học tập, văn phòng và giải trí."
  },
  {
    id: 18,
    sku: "HD-MON-002",
    name: "AOC 24G2SP",
    category: "Màn hình",
    price: 3690000,
    oldPrice: 3990000,
    rating: 4.9,
    sold: 88,
    image: images.monitor,
    description: "Màn hình AOC 24G2SP dành cho nhu cầu chơi game và làm việc."
  },
  {
    id: 19,
    sku: "HD-SSD-001",
    name: "Samsung 870 EVO 500GB",
    category: "Phụ kiện",
    price: 1290000,
    oldPrice: 1490000,
    rating: 4.9,
    sold: 115,
    image: images.accessory,
    description: "Ổ cứng SSD Samsung 870 EVO dung lượng 500GB."
  },
  {
    id: 20,
    sku: "HD-SSD-002",
    name: "Kingston NV2 1TB",
    category: "Phụ kiện",
    price: 1490000,
    oldPrice: 1690000,
    rating: 4.8,
    sold: 125,
    image: images.accessory,
    description: "Ổ cứng SSD Kingston NV2 dung lượng 1TB."
  },
  {
    id: 21,
    sku: "HD-HUB-001",
    name: "UGREEN Revodok 5-in-1",
    category: "Phụ kiện",
    price: 690000,
    oldPrice: 790000,
    rating: 4.8,
    sold: 98,
    image: images.accessory,
    description: "Hub chuyển đổi UGREEN Revodok 5-in-1."
  },
  {
    id: 22,
    sku: "HD-HUB-002",
    name: "Baseus Metal Gleam 6-in-1",
    category: "Phụ kiện",
    price: 890000,
    oldPrice: 990000,
    rating: 4.9,
    sold: 86,
    image: images.accessory,
    description: "Hub chuyển đổi Baseus Metal Gleam 6-in-1."
  },
  {
    id: 23,
    sku: "HD-MIC-001",
    name: "Fifine K669B",
    category: "Phụ kiện",
    price: 699000,
    oldPrice: 799000,
    rating: 4.8,
    sold: 105,
    image: images.accessory,
    description: "Micro Fifine K669B dành cho học tập, thu âm và giao tiếp trực tuyến."
  },
  {
    id: 24,
    sku: "HD-WEB-001",
    name: "Logitech C920s Full HD",
    category: "Phụ kiện",
    price: 1590000,
    oldPrice: 1790000,
    rating: 4.9,
    sold: 110,
    image: images.accessory,
    description: "Webcam Logitech C920s phục vụ họp trực tuyến và học tập."
  },
  {
    id: 25,
    sku: "HD-PAD-001",
    name: "SteelSeries QcK Medium",
    category: "Phụ kiện",
    price: 299000,
    oldPrice: 349000,
    rating: 4.8,
    sold: 140,
    image: images.accessory,
    description: "Bàn di chuột SteelSeries QcK Medium dành cho góc máy tính cá nhân."
  }
];

export default products;
