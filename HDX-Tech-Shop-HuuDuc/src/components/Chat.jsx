
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle,
  X,
  Send,
  RotateCcw,
  ShoppingCart,
  Bot,
  User,
  Package
} from "lucide-react";

import { chat, traChatVeBot } from "../api";
import "./Chat.css";

const BUYER_ID =
  localStorage.getItem("buyer_user_id") || "gia-lap-khach";

function getConversationId() {
  let id = localStorage.getItem("conversation_id");

  if (!id) {
    id = `hdx-${Date.now()}`;
    localStorage.setItem("conversation_id", id);
  }

  return id;
}

function Chat({ products = [], onAddToCart, chatRequest }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [conversationId, setConversationId] = useState(getConversationId);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Dạ HDX Tech xin chào! Bạn cần tư vấn sản phẩm công nghệ nào ạ?"
    }
  ]);

  const bottomRef = useRef(null);
  const lastRequestId = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, loading, isOpen]);

  const productMap = useMemo(() => {
    return new Map(
      products.map((product) => [product.sku, product])
    );
  }, [products]);

  const addMessage = (newMessage) => {
    setMessages((previous) => [
      ...previous,
      {
        ...newMessage,
        id: Date.now() + Math.random()
      }
    ]);
  };

  // GỬI TIN NHẮN ĐẾN MIDDLEWARE
  const sendText = async (text) => {
    if (!text.trim() || loading) return;

    addMessage({
      sender: "user",
      text
    });

    setMessage("");
    setLoading(true);

    try {
      const result = await chat(
        conversationId,
        BUYER_ID,
        text
      );

      if (result.handed_off) {
        setHandoff(true);
      }

      if (result.reply && !result.silent) {
        addMessage({
          sender: "bot",
          text: result.reply,
          skus: result.skus || [],
          upsell: result.upsell || []
        });
      } else if (result.handed_off) {
        addMessage({
          sender: "system",
          text: "Shop đã tiếp nhận yêu cầu. Nhân viên sẽ trả lời bạn sớm nhất có thể."
        });
      }
    } catch (error) {
      addMessage({
        sender: "system",
        text: error.message || "Không thể gửi tin nhắn. Bạn thử lại nhé!"
      });
    } finally {
      setLoading(false);
    }
  };

  // GỬI TIN NHẮN THÔNG THƯỜNG
  const sendMessage = (event) => {
    event.preventDefault();
    sendText(message.trim());
  };

  // TỰ ĐỘNG MỞ CHAT KHI CHỌN SẢN PHẨM
  useEffect(() => {
    if (!chatRequest?.product) return;

    if (lastRequestId.current === chatRequest.id) return;

    lastRequestId.current = chatRequest.id;

    const product = chatRequest.product;

    setIsOpen(true);

    const text = `Shop ơi tư vấn giúp mình ${product.name}`;

    const productMessage = {
      id: Date.now(),
      sender: "user",
      text,
      product
    };

    setMessages((previous) => [
      ...previous,
      productMessage
    ]);

    sendTextFromProduct(text);
  }, [chatRequest]);

  // HÀM GỬI RIÊNG CHO YÊU CẦU SẢN PHẨM
  const sendTextFromProduct = async (text) => {
    if (loading) return;

    setLoading(true);

    try {
      const result = await chat(
        conversationId,
        BUYER_ID,
        text
      );

      if (result.handed_off) {
        setHandoff(true);
      }

      if (result.reply && !result.silent) {
        addMessage({
          sender: "bot",
          text: result.reply,
          skus: result.skus || [],
          upsell: result.upsell || []
        });
      } else if (result.handed_off) {
        addMessage({
          sender: "system",
          text: "Shop đã tiếp nhận yêu cầu. Nhân viên sẽ trả lời bạn sớm nhất có thể."
        });
      }
    } catch (error) {
      addMessage({
        sender: "system",
        text: error.message || "Không thể gửi tin nhắn. Bạn thử lại nhé!"
      });
    } finally {
      setLoading(false);
    }
  };

  // BẮT ĐẦU CUỘC TRÒ CHUYỆN MỚI
  const handleReset = async () => {
    if (loading) return;

    setLoading(true);

    try {
      await traChatVeBot(conversationId);

      const newId = `hdx-${Date.now()}`;

      localStorage.setItem("conversation_id", newId);
      setConversationId(newId);

      setHandoff(false);

      setMessages([
        {
          id: Date.now(),
          sender: "bot",
          text: "Dạ, mình đã bắt đầu cuộc trò chuyện mới. HDX Tech có thể giúp gì cho bạn ạ?"
        }
      ]);
    } catch (error) {
      addMessage({
        sender: "system",
        text: error.message || "Không thể bắt đầu lại cuộc trò chuyện."
      });
    } finally {
      setLoading(false);
    }
  };

  // HIỂN THỊ SẢN PHẨM TRONG CHAT
  const renderProduct = (sku) => {
    const product = productMap.get(sku);

    if (!product) return null;

    return (
      <div className="chat-product" key={sku}>
        <div className="chat-product-icon">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
            />
          ) : (
            <Package size={22} />
          )}
        </div>

        <div className="chat-product-info">
          <strong>{product.name}</strong>

          <span>
            {Number(product.price).toLocaleString("vi-VN")}đ
          </span>

          <small>
            {product.stock > 0
              ? `Còn ${product.stock} sản phẩm`
              : "Tạm hết hàng"}
          </small>
        </div>

        <button
          type="button"
          disabled={product.stock <= 0}
          onClick={() => onAddToCart?.(product)}
          title="Thêm vào giỏ hàng"
        >
          <ShoppingCart size={17} />
        </button>
      </div>
    );
  };

  // HIỂN THỊ SẢN PHẨM ĐƯỢC AI GỢI Ý
  const renderRecommendations = (item) => {
    const recommendedSkus = [
      ...(item.skus || []),
      ...(item.upsell || []).map((product) => product.sku)
    ];

    const uniqueSkus = [...new Set(recommendedSkus)];

    if (uniqueSkus.length === 0) return null;

    return (
      <div className="chat-recommendations">
        <small>Sản phẩm được gợi ý</small>

        {uniqueSkus.map(renderProduct)}
      </div>
    );
  };

  return (
    <>
      {/* NÚT MỞ CHAT */}

      <button
        type="button"
        className={`chat-floating-button ${isOpen ? "hidden" : ""}`}
        onClick={() => setIsOpen(true)}
        aria-label="Mở chat với HDX Tech"
      >
        <MessageCircle size={25} />
        <span>Chat với Shop</span>
      </button>

      {/* KHUNG CHAT */}

      {isOpen && (
        <section className="chat-widget">
          <header className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <Bot size={22} />
              </div>

              <div>
                <strong>HDX Tech</strong>

                <small>
                  {handoff
                    ? "Đang chờ nhân viên hỗ trợ"
                    : "Tư vấn sản phẩm trực tuyến"}
                </small>
              </div>
            </div>

            <div className="chat-header-actions">
              <button
                type="button"
                onClick={handleReset}
                title="Bắt đầu cuộc trò chuyện mới"
                disabled={loading}
              >
                <RotateCcw size={17} />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Đóng chat"
              >
                <X size={20} />
              </button>
            </div>
          </header>

          {/* DANH SÁCH TIN NHẮN */}

          <div className="chat-messages">
            {messages.map((item) => (
              <div
                key={item.id}
                className={`chat-message-row ${item.sender}`}
              >
                {item.sender === "bot" && (
                  <div className="chat-message-avatar">
                    <Bot size={16} />
                  </div>
                )}

                <div className="chat-message-content">
                  <div className="chat-bubble">
                    {item.sender === "user" && (
                      <User
                        size={14}
                        className="chat-inline-icon"
                      />
                    )}

                    {item.text}
                  </div>

                  {/* SẢN PHẨM KHÁCH ĐANG HỎI */}

                  {item.product && (
                    <div className="chat-product">
                      <div className="chat-product-icon">
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                          />
                        ) : (
                          <Package size={22} />
                        )}
                      </div>

                      <div className="chat-product-info">
                        <strong>{item.product.name}</strong>

                        <span>
                          {Number(item.product.price).toLocaleString("vi-VN")}đ
                        </span>

                        <small>
                          Mã: {item.product.sku}
                        </small>
                      </div>
                    </div>
                  )}

                  {item.sender === "bot" &&
                    renderRecommendations(item)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-message-row bot">
                <div className="chat-message-avatar">
                  <Bot size={16} />
                </div>

                <div className="chat-bubble chat-typing">
                  Shop đang trả lời...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Ô NHẬP TIN NHẮN */}

          <form
            className="chat-input-area"
            onSubmit={sendMessage}
          >
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={loading}
            />

            <button
              type="submit"
              disabled={!message.trim() || loading}
              aria-label="Gửi tin nhắn"
            >
              <Send size={19} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}

export default Chat;
