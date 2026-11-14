
const BASE = import.meta.env.VITE_API_BASE;

export const layMaNhom = () =>
  localStorage.getItem("ma_nhom") || "";

export const luuMaNhom = (ma) =>
  localStorage.setItem("ma_nhom", ma.trim());

async function goi(path, body) {
  if (!BASE) {
    throw new Error("Chưa cấu hình địa chỉ máy chủ trong .env.local");
  }

  let res;

  try {
    res = await fetch(BASE + path, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "x-ma-nhom": layMaNhom(),
        "ngrok-skip-browser-warning": "1",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "Không kết nối được máy chủ. Vui lòng kiểm tra middleware."
    );
  }

  if (res.status === 404) {
    throw new Error("Máy chủ chưa bật chế độ giả lập.");
  }

  const text = await res.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Máy chủ trả về dữ liệu không hợp lệ.");
  }

  if (res.status === 401) {
    throw new Error("Sai mã nhóm.");
  }

  if (!res.ok || !data.ok) {
    throw new Error(data.loi || "Có lỗi xảy ra.");
  }

  return data;
}

// SẢN PHẨM
export const laySanPham = () => goi("/san-pham");

// CHAT
export const chat = (conversation_id, buyer_user_id, text) =>
  goi("/chat", {
    conversation_id,
    buyer_user_id,
    text,
  });

export const traChatVeBot = (conversation_id) =>
  goi("/chat", {
    conversation_id,
    text: "/reset",
  });

// ĐẶT ĐƠN
export const datDon = (buyer_user_id, items) =>
  goi("/don", {
    buyer_user_id,
    items,
  });

// CẬP NHẬT TRẠNG THÁI ĐƠN
export const dayBuoc = (order_id, viec) =>
  goi("/don/viec", {
    order_id,
    viec,
  });

// DANH SÁCH ĐƠN
export const layDon = () => goi("/don");

// TIN NHẮN
export const layTinNhan = () => goi("/tin-nhan");

// KPI
export const layKpi = () => goi("/kpi");
