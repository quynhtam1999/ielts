// Lưu toàn bộ dữ liệu vào localStorage của trình duyệt.
// Lưu ý: dữ liệu nằm trên MÁY và TRÌNH DUYỆT bạn đang dùng.
// Hãy vào trang "Tiến độ" → "Xuất dữ liệu" định kỳ để sao lưu.
App.store = {
  KEY: 'paraphrase-studio-v1',
  state: null,

  // Khoảng cách ôn lại (ngày) theo từng "hộp" của hệ thống Leitner
  INTERVALS: [0, 1, 2, 4, 7, 15, 30, 60],

  defaultState() {
    const today = App.ui.today();
    return {
      version: 1,
      words: App.data.seedWords.map((w, i) => ({
        id: 'w' + Date.now().toString(36) + i,
        ...w,
        srs: { box: 0, due: today },
      })),
      activity: {},      // { '2026-11-02': { drills: 5, writing: 1, ... } }
      drillStats: {},    // { level: { correct: 3, total: 4 } }
      drillMistakes: {}, // { lv1: 2 } số lần làm sai từng câu
      writing: [],       // các bài viết đã lưu
      speaking: [],      // các câu trả lời đã lưu
      hunts: [],         // các đoạn văn đã săn tham chiếu
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      this.state = raw ? { ...this.defaultState(), ...JSON.parse(raw) } : this.defaultState();
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

  // ----- Sổ từ vựng -----
  dueWords() {
    const today = App.ui.today();
    return this.state.words.filter((w) => (w.srs?.due || today) <= today);
  },
  upsertWord(word) {
    const list = this.state.words;
    const i = list.findIndex((w) => w.id === word.id);
    if (i >= 0) list[i] = word;
    else list.unshift({ ...word, id: 'w' + Date.now().toString(36), srs: { box: 0, due: App.ui.today() } });
    this.save();
  },
  deleteWord(id) {
    this.state.words = this.state.words.filter((w) => w.id !== id);
    this.save();
  },
  // grade: 0 = quên, 1 = nhớ, 2 = dễ
  gradeWord(id, grade) {
    const w = this.state.words.find((x) => x.id === id);
    if (!w) return;
    const box = grade === 0 ? 0 : Math.min((w.srs?.box || 0) + grade, this.INTERVALS.length - 1);
    const days = grade === 0 ? 0 : this.INTERVALS[box];
    w.srs = { box, due: App.ui.addDays(App.ui.today(), days) };
    this.save();
  },

  // ----- Thống kê luyện tập -----
  recordDrill(drill, correct) {
    const s = this.state.drillStats[drill.tech] || (this.state.drillStats[drill.tech] = { correct: 0, total: 0 });
    s.total++;
    if (correct) s.correct++;
    else this.state.drillMistakes[drill.id] = (this.state.drillMistakes[drill.id] || 0) + 1;
    this.save();
  },

  // ----- Sao lưu -----
  exportJSON() {
    return JSON.stringify(this.state, null, 2);
  },
  importJSON(text) {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.words)) throw new Error('File không đúng định dạng');
    this.state = { ...this.defaultState(), ...data };
    this.save();
  },
  reset() {
    this.state = this.defaultState();
    this.save();
  },
};
