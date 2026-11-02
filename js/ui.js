// Các hàm tiện ích dùng chung cho toàn bộ ứng dụng.
// Mọi thứ được gắn vào biến toàn cục "App" để các file khác dùng được.
window.App = { data: {}, views: {} };

App.ui = {
  // Chống chèn mã HTML khi hiển thị chữ do người dùng nhập
  esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  },

  // Thông báo nhỏ hiện ở cuối màn hình
  toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._t);
    this._t = setTimeout(() => el.classList.remove('show'), 2200);
  },

  // Xáo trộn mảng (thuật toán Fisher–Yates), trả về mảng mới
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // Ngày hôm nay dạng "2026-11-02" theo giờ máy
  today() {
    const d = new Date();
    return App.ui.dateStr(d);
  },
  dateStr(d) {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  },
  addDays(dateStr, n) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return App.ui.dateStr(new Date(y, m - 1, d + n));
  },

  // Tên ngắn của kỹ thuật theo mã
  techName(id) {
    const t = App.data.techniques.find((x) => x.id === id);
    return t ? `${t.no}. ${t.name}` : id;
  },

  // Tách chuỗi "a, b; c" thành mảng ["a","b","c"]
  splitList(str) {
    return String(str || '').split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  },

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  },
};
