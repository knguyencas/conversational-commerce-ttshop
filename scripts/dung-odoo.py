"""Dựng Odoo cho shop HDX Tech: mật khẩu admin, user n8n, tiền VND, sản phẩm và tồn kho từ san-pham.csv, Automation Rule báo đóng gói."""
import csv
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
URL = "http://127.0.0.1:8069/jsonrpc"
SRC = ROOT / "cua-hang" / "san-pham.csv"


def read_env() -> dict:
    """Đọc .env thành dict."""
    env = {}
    for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def rpc(service: str, method: str, *args):
    """Gọi JSON-RPC của Odoo, ném lỗi kèm thông báo của Odoo."""
    body = json.dumps({"jsonrpc": "2.0", "method": "call", "params": {"service": service, "method": method, "args": list(args)}})
    req = urllib.request.Request(URL, body.encode(), {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        res = json.loads(r.read())
    if res.get("error"):
        err = res["error"].get("data", {}).get("message") or res["error"].get("message")
        raise RuntimeError(err)
    return res.get("result")


class Odoo:
    """Phiên làm việc với một database Odoo."""

    def __init__(self, db: str, login: str, password: str):
        self.db, self.password = db, password
        self.uid = rpc("common", "login", db, login, password)
        if not self.uid:
            raise PermissionError(f"Sai mật khẩu cho {login}")

    def call(self, model: str, method: str, args=None, **kw):
        """Gọi một method của model."""
        return rpc("object", "execute_kw", self.db, self.uid, self.password, model, method, args or [], kw)

    def ref(self, xmlid: str) -> int:
        """Lấy id theo xml id dạng module.name."""
        mod, name = xmlid.split(".")
        rows = self.call("ir.model.data", "search_read", [[["module", "=", mod], ["name", "=", name]]], fields=["res_id"])
        return rows[0]["res_id"] if rows else 0


def admin_session(env: dict) -> Odoo:
    """Đăng nhập admin; lần đầu thì đổi mật khẩu mặc định sang ODOO_ADMIN_PASSWORD."""
    db, new = env["ODOO_DB"], env["ODOO_ADMIN_PASSWORD"]
    try:
        return Odoo(db, "admin", new)
    except PermissionError:
        o = Odoo(db, "admin", "admin")
        o.call("res.users", "write", [[o.uid], {"password": new}])
        print("Đã đổi mật khẩu admin")
        return Odoo(db, "admin", new)


def setup_company(o: Odoo) -> None:
    """Tên công ty, tiền VND, múi giờ và ngôn ngữ của admin."""
    vnd = o.call("res.currency", "search", [[["name", "=", "VND"], ["active", "in", [True, False]]]])[0]
    o.call("res.currency", "write", [[vnd], {"active": True}])
    company = o.call("res.users", "read", [[o.uid]], fields=["company_id"])[0]["company_id"][0]
    o.call("res.company", "write", [[company], {"name": "HDX Tech", "currency_id": vnd}])
    pls = o.call("product.pricelist", "search", [[]])
    if pls:
        o.call("product.pricelist", "write", [pls, {"currency_id": vnd}])
    o.call("res.users", "write", [[o.uid], {"tz": "Asia/Ho_Chi_Minh", "lang": "vi_VN"}])
    print("Công ty HDX Tech, tiền VND")


def setup_n8n_user(o: Odoo, env: dict) -> None:
    """User tích hợp cho n8n: quyền quản lý bán hàng và kho."""
    login, pw = env["ODOO_N8N_LOGIN"], env["ODOO_N8N_PASSWORD"]
    field = "group_ids" if "group_ids" in o.call("res.users", "fields_get", [], attributes=["type"]) else "groups_id"
    groups = [g for g in (o.ref("sales_team.group_sale_manager"), o.ref("stock.group_stock_manager"), o.ref("base.group_user")) if g]
    found = o.call("res.users", "search", [[["login", "=", login]]])
    vals = {"name": "n8n (tích hợp)", "login": login, "password": pw, "tz": "Asia/Ho_Chi_Minh", field: [(4, g) for g in groups]}
    if found:
        o.call("res.users", "write", [found, vals])
    else:
        o.call("res.users", "create", [vals])
    Odoo(env["ODOO_DB"], login, pw)
    print(f"User {login} đăng nhập được")


def category_id(o: Odoo, name: str, cache: dict) -> int:
    """Tìm hoặc tạo nhóm sản phẩm theo loại hàng."""
    if name not in cache:
        found = o.call("product.category", "search", [[["name", "=", name]]])
        cache[name] = found[0] if found else o.call("product.category", "create", [{"name": name}])
    return cache[name]


def setup_products(o: Odoo) -> None:
    """Tạo hoặc cập nhật sản phẩm theo SKU; nhập tồn đầu kỳ cho sản phẩm chưa có tồn."""
    with open(SRC, encoding="utf-8-sig", newline="") as f:
        rows = [r for r in csv.DictReader(f) if (r.get("sku") or "").strip()]
    tmpl_fields = o.call("product.template", "fields_get", [], attributes=["type"])
    stock_loc = o.ref("stock.stock_location_stock")
    cats, made, updated, stocked = {}, 0, 0, 0
    for r in rows:
        sku = r["sku"].strip()
        desc = r["mo_ta"].strip() + (". " + r["thong_so"].strip() if r["thong_so"].strip() else "")
        vals = {"name": r["name"].strip(), "default_code": sku, "list_price": int(r["price"]), "sale_ok": True,
                "categ_id": category_id(o, r["category"].strip(), cats), "description_sale": desc, "taxes_id": [(6, 0, [])]}
        if "is_storable" in tmpl_fields:
            vals.update({"type": "consu", "is_storable": True})
        else:
            vals["type"] = "product"
        found = o.call("product.product", "search_read", [[["default_code", "=", sku]]], fields=["id", "product_tmpl_id", "qty_available"])
        if found:
            o.call("product.template", "write", [[found[0]["product_tmpl_id"][0]], vals])
            pid, qty, updated = found[0]["id"], found[0]["qty_available"], updated + 1
        else:
            tmpl = o.call("product.template", "create", [vals])
            pid = o.call("product.product", "search", [[["product_tmpl_id", "=", tmpl]]])[0]
            qty, made = 0, made + 1
        start = int(r.get("ton_dau_ky") or 0)
        if qty == 0 and start > 0:
            quant = o.call("stock.quant", "create", [{"product_id": pid, "location_id": stock_loc, "inventory_quantity": start}],
                           context={"inventory_mode": True})
            o.call("stock.quant", "action_apply_inventory", [[quant]])
            stocked += 1
    print(f"Sản phẩm: tạo {made}, cập nhật {updated}, nhập tồn đầu kỳ {stocked}")


def setup_picking_webhook(o: Odoo, env: dict) -> None:
    """Automation Rule: phiếu xuất kho chuyển sang Done thì gửi webhook cho n8n."""
    mod = o.call("ir.module.module", "search_read", [[["name", "=", "base_automation"]]], fields=["state"])
    if mod and mod[0]["state"] != "installed":
        o.call("ir.module.module", "button_immediate_install", [[mod[0]["id"]]])
        print("Đã cài base_automation")
    url = f"http://n8n:5678/webhook/odoo-picking-done?secret={env['ODOO_WEBHOOK_SECRET']}"
    model = o.call("ir.model", "search", [[["model", "=", "stock.picking"]]])[0]
    fields = o.call("ir.model.fields", "search", [[["model", "=", "stock.picking"], ["name", "in", ["name", "origin", "state", "picking_type_code"]]]])
    state_field = o.call("ir.model.fields", "search", [[["model", "=", "stock.picking"], ["name", "=", "state"]]])[0]
    done = o.call("ir.model.fields.selection", "search", [[["field_id", "=", state_field], ["value", "=", "done"]]])[0]
    name = "Báo n8n: phiếu xuất kho đã xong"
    action_vals = {"name": name, "model_id": model, "state": "webhook", "webhook_url": url, "webhook_field_ids": [(6, 0, fields)]}
    old = o.call("base.automation", "search", [[["name", "=", name]]])
    if old:
        acts = o.call("base.automation", "read", [old], fields=["action_server_ids"])[0]["action_server_ids"]
        o.call("ir.actions.server", "write", [acts, action_vals])
        print("Automation Rule đã có, cập nhật địa chỉ webhook")
        return
    rule = o.call("base.automation", "create", [{"name": name, "model_id": model, "trigger": "on_state_set",
                                                 "trg_selection_field_id": done, "trigger_field_ids": [(6, 0, [state_field])]}])
    o.call("ir.actions.server", "create", [{**action_vals, "base_automation_id": rule, "usage": "base_automation"}])
    print("Đã tạo Automation Rule báo đóng gói")


def cancel_test_order(o: Odoo, order_id: str) -> None:
    """Hủy Sales Order của đơn diễn tập, đổi Customer Reference để lần sau tạo mới; in SQL cập nhật ton_kho_odoo."""
    sos = o.call("sale.order", "search_read", [[["client_order_ref", "=", order_id]]], fields=["name", "state", "order_line"])
    skus = set()
    for so in sos:
        if so["state"] != "cancel":
            o.call("sale.order", "action_cancel", [[so["id"]]], context={"disable_cancel_warning": True})
        o.call("sale.order", "write", [[so["id"]], {"client_order_ref": f"{order_id}-dien-tap-{so['id']}"}])
        lines = o.call("sale.order.line", "read", [so["order_line"]], fields=["product_id"])
        prods = o.call("product.product", "read", [[l["product_id"][0] for l in lines]], fields=["default_code"])
        skus |= {p["default_code"] for p in prods if p["default_code"]}
    for p in o.call("product.product", "search_read", [[["default_code", "in", sorted(skus)]]], fields=["default_code", "free_qty", "qty_available"]):
        print(f"UPDATE ton_kho_odoo SET free_qty = {max(0, int(p['free_qty']))}, qty_available = {p['qty_available']}, "
              f"cap_nhat_luc = now() WHERE seller_sku = '{p['default_code']}';")


def main() -> None:
    """Chạy lần lượt các bước; chạy lại nhiều lần không tạo trùng. `huy-don-thu <mã đơn>` chỉ hủy đơn diễn tập."""
    sys.stdout.reconfigure(encoding="utf-8")
    env = read_env()
    if len(sys.argv) == 3 and sys.argv[1] == "huy-don-thu":
        cancel_test_order(Odoo(env["ODOO_DB"], "admin", env["ODOO_ADMIN_PASSWORD"]), sys.argv[2])
        return
    for k in ("ODOO_DB", "ODOO_ADMIN_PASSWORD", "ODOO_N8N_LOGIN", "ODOO_N8N_PASSWORD", "ODOO_WEBHOOK_SECRET"):
        if not env.get(k):
            sys.exit(f"Thiếu {k} trong .env")
    o = admin_session(env)
    setup_company(o)
    setup_n8n_user(o, env)
    setup_products(o)
    setup_picking_webhook(o, env)


if __name__ == "__main__":
    main()
