// Lưu dữ liệu học vào localStorage của trình duyệt.
// Lưu ý: dữ liệu nằm trên MÁY và TRÌNH DUYỆT bạn đang dùng (website và file trên máy là hai nơi riêng).
App.store = {
  KEY: 'paraphrase-studio-v1',
  state: null,

  defaultState() {
    return {
      version: 2,
      activity: {},     // { '2026-11-02': { topics: 5, review: 2 } } số từ làm mới / ôn lại mỗi ngày
      topics: {},       // kết quả từ khoá: { urban: { 'public transport': { pct: 70, date: '2026-11-02' } } }
      hunts: [],        // các đoạn văn đã săn tham chiếu
      lastTopic: null,  // chủ đề học gần nhất (cho nút "Học tiếp")
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      const old = raw ? JSON.parse(raw) : {};
      // Chỉ giữ các phần còn dùng (bỏ dữ liệu của những trang đã xoá)
      const def = this.defaultState();
      this.state = def;
      Object.keys(def).forEach((k) => { if (k !== 'version' && old[k]) this.state[k] = old[k]; });
    } catch (e) {
      console.warn('Không đọc được dữ liệu, dùng dữ liệu mặc định', e);
      this.state = this.defaultState();
    }
    this.save();
  },

  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.state));
    } catch (e) {
      App.ui.toast('⚠️ Không lưu được dữ liệu (trình duyệt chặn bộ nhớ?)');
    }
  },

  // Ghi nhận hoạt động trong ngày (dùng cho chuỗi ngày và nhiệm vụ hằng ngày)
  logActivity(type, n = 1) {
    const d = App.ui.today();
    const day = this.state.activity[d] || (this.state.activity[d] = {});
    day[type] = (day[type] || 0) + n;
    this.save();
  },

  todayActivity() {
    return this.state.activity[App.ui.today()] || {};
  },

  // Số ngày học liên tiếp (tính đến hôm nay, hoặc hôm qua nếu hôm nay chưa học)
  streak() {
    const act = this.state.activity;
    let d = App.ui.today();
    if (!act[d]) d = App.ui.addDays(d, -1);
    let count = 0;
    while (act[d]) {
      count++;
      d = App.ui.addDays(d, -1);
    }
    return count;
  },
};
