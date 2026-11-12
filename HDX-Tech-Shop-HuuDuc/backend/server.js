
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Kiểm tra Backend
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "HDX Tech Backend is running!"
  });
});

// Đọc dữ liệu sản phẩm từ frontend
let productsPromise;

const getProducts = async () => {
  if (!productsPromise) {
    productsPromise = import("../src/data/products.js")
      .then((module) => module.default);
  }

  return productsPromise;
};

// API lấy tất cả sản phẩm
app.get("/api/products", async (req, res) => {
  try {
    const products = await getProducts();

    res.json({
      success: true,
      total: products.length,
      data: products
    });
  } catch (error) {
    console.error("Lỗi lấy sản phẩm:", error);

    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách sản phẩm"
    });
  }
});

// API lấy chi tiết một sản phẩm
app.get("/api/products/:id", async (req, res) => {
  try {
    const products = await getProducts();

    const product = products.find(
      (item) => item.id === Number(req.params.id)
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm"
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết sản phẩm:", error);

    res.status(500).json({
      success: false,
      message: "Không thể lấy chi tiết sản phẩm"
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
