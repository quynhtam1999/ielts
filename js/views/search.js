// Trang Tìm kiếm (#search hoặc #search/<từ cần tìm>)
// Tìm trong mọi chủ đề: từ khoá, nghĩa tiếng Việt, cách gọi khác, collocation, ghi chú.
// Gõ tiếng Việt có dấu hay không dấu đều được ("o nhiem" vẫn ra "ô nhiễm").
App.views.search = {
  MAX: 60, // số kết quả hiện tối đa

  // Bỏ dấu + chữ thường. Giữ nguyên độ dài (mỗi ký tự → 1 ký tự) để tô sáng đúng chỗ
  foldChar(c) {
    const f = c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace('đ', 'd');
    return f.length === 1 ? f : c.length === 1 ? c : '\u0000';
  },
  fold(s) {
    return [...String(s)].map((c) => this.foldChar(c)).join('');
  },

  // Vị trí một cụm xuất hiện ở ĐẦU một từ ("nhiem" khớp "nhiễm" nhưng "o" không khớp chữ o giữa từ)
  starts(f, w) {
    const out = [];
    for (let i = f.indexOf(w); i >= 0; i = f.indexOf(w, i + 1)) if (i === 0 || !/[a-z0-9]/.test(f[i - 1])) out.push(i);
    return out;
  },
  has(f, w) {
    return this.starts(f, w).length > 0;
  },

  // Tô sáng: ưu tiên cả cụm, nếu không có thì từng từ
  hl(text, q) {
    const esc = App.ui.esc;
    const chars = [...String(text)];
    const f = chars.map((c) => this.foldChar(c)).join('');
    const on = new Array(chars.length).fill(false);
    const list = this.has(f, q.phrase) ? [q.phrase] : q.keys;
    list.forEach((w) => this.starts(f, w).forEach((i) => { for (let k = i; k < i + w.length; k++) on[k] = true; }));
    let out = '';
    let open = false;
    chars.forEach((c, i) => {
      if (on[i] !== open) { out += on[i] ? '<mark>' : '</mark>'; open = on[i]; }
      out += esc(c);
    });
    return out + (open ? '</mark>' : '');
  },

  // Gom mọi từ khoá thành danh sách để tìm (làm 1 lần)
  index() {
    if (this._idx) return this._idx;
    const T = App.views.topics;
    this._idx = [];
    App.data.topics.forEach((t) => t.items.forEach((item, j) => {
      const it = T.parse(item);
      const colls = it.colls.map((c) => T.fillColl(c, it.term));
      this._idx.push({
        t, j, it, colls,
        f: {
          term: this.fold(it.term), vi: this.fold(it.vi), note: this.fold(it.note || ''),
          paras: it.paras.map((x) => this.fold(x)), colls: colls.map((x) => this.fold(x)),
        },
      });
    }));
    return this._idx;
  },

  render(el, args) {
    let q = '';
    try { q = decodeURIComponent(args.join('/')); } catch (e) { q = args.join('/'); }
    const total = this.index().length;
    el.innerHTML = `
      <section class="hero">
        <span class="eyebrow">${total} từ khoá · ${App.data.topics.length} chủ đề</span>
        <h1>Tìm <span class="gradient-text">kiếm</span></h1>
        <p class="muted">Gõ tiếng Anh hoặc tiếng Việt (có dấu hay không dấu đều được). Máy tìm trong từ khoá, nghĩa,
          cách gọi khác và collocation. Bấm vào kết quả để luyện từ đó.</p>
        <div class="search-box"><input type="search" id="q" placeholder="vd: traffic, ô nhiễm, tackle, a heavy…" aria-label="Tìm kiếm" autocomplete="off"></div>
      </section>
      <div id="hits"></div>`;
    const input = el.querySelector('#q');
    input.value = q;
    input.addEventListener('input', () => {
      const v = input.value.trim();
      try { history.replaceState(null, '', '#search' + (v ? '/' + encodeURIComponent(v) : '')); } catch (e) { /* file:// cũ */ }
      this.show(el.querySelector('#hits'), v);
    });
    this.show(el.querySelector('#hits'), q);
    input.focus();
  },

  SKIP: new Set('the a an of to in on at for and or is are be'.split(' ')),

  show(box, raw) {
    const esc = App.ui.esc;
    const words = this.fold(raw).split(/\s+/).filter(Boolean);
    const phrase = words.join(' ');
    if (!phrase) { box.innerHTML = this.suggest(); return; }
    if (phrase.replace(/ /g, '').length < 2) { box.innerHTML = '<p class="muted small">Gõ ít nhất 2 chữ cái.</p>'; return; }
    // Từ dùng để lọc: bỏ chữ quá ngắn và từ chức năng (nếu còn từ khác)
    let keys = words.filter((w) => w.length >= 2 && !this.SKIP.has(w));
    if (!keys.length) keys = words;
    const q = { phrase, keys };

    // Gõ có dấu (vd "gia đình") thì kết quả đúng dấu được xếp trước "giả định"
    const rawL = String(raw).trim().toLowerCase().replace(/\s+/g, ' ');
    const accented = rawL !== phrase;
    const all = (f) => keys.every((w) => this.has(f, w));
    const ph = (f) => this.has(f, phrase);

    // Chủ đề có tên khớp
    const topics = App.data.topics.filter((t) => all(this.fold(t.name + ' ' + t.vi)));

    // Từ khoá: mọi từ cần tìm phải có mặt ở đâu đó trong mục; khớp nguyên cụm được xếp trước
    const res = [];
    this.index().forEach((x) => {
      const f = x.f;
      const hay = [f.term, f.vi, f.note, ...f.paras, ...f.colls].join(' | ');
      if (!all(hay)) return;
      const rank = f.term === phrase ? 0 : f.term.startsWith(phrase) ? 1 : ph(f.term) ? 2
        : accented && x.it.vi.toLowerCase().includes(rawL) ? 3 : ph(f.vi) ? 3.5
        : f.paras.some(ph) ? 4 : f.colls.some(ph) ? 5 : all(f.term) ? 6 : all(f.vi) ? 7
        : f.paras.some(all) ? 8 : f.colls.some(all) ? 9 : 10;
      res.push({ x, rank, whole: ph(hay) });
    });
    res.sort((a, b) => a.rank - b.rank || a.x.it.term.length - b.x.it.term.length);

    if (!topics.length && !res.length) {
      box.innerHTML = `<p class="muted">Không tìm thấy “${esc(raw)}”. Thử gõ ngắn hơn hoặc dùng từ khác.</p>`;
      return;
    }

    const item = ({ x, whole }) => {
      const { t, j, it, colls, f } = x;
      // Hiện các cách gọi khác / collocation có chứa từ cần tìm (nếu mục có nguyên cụm thì chỉ hiện chỗ có cụm)
      const match = whole ? ph : (s) => keys.some((w) => this.has(s, w));
      const chips = [];
      f.paras.forEach((p, k) => { if (match(p)) chips.push(`<span class="chip"><span class="k">≈</span>${this.hl(it.paras[k], q)}</span>`); });
      f.colls.forEach((c, k) => { if (match(c)) chips.push(`<span class="chip"><span class="k">+</span>${this.hl(colls[k], q)}</span>`); });
      return `<a class="hit-item" href="#topics/${t.id}/terms/${j}">
        <div class="row spread" style="align-items:baseline">
          <span><span class="hit-term">${this.hl(it.term, q)}</span> <span class="hit-vi">· ${this.hl(it.vi, q)}</span></span>
          <span class="hit-topic">${t.icon} ${esc(t.name)}</span>
        </div>
        ${chips.length ? `<div style="margin:.4rem -.18rem 0">${chips.slice(0, 8).join('')}${chips.length > 8 ? `<span class="small muted"> +${chips.length - 8}</span>` : ''}</div>` : ''}
      </a>`;
    };

    box.innerHTML = `
      ${topics.length ? `<div class="row" style="margin-bottom:.6rem">${topics.map((t) =>
        `<a class="chip" href="#topics/${t.id}">${t.icon} ${this.hl(t.name, q)}</a>`).join('')}</div>` : ''}
      <p class="small muted" style="margin:.4rem 0 0">${res.length} từ khoá${res.length > this.MAX ? `, hiện ${this.MAX} kết quả đầu: gõ thêm để thu hẹp` : ''}.
        <span class="k">≈</span> cách gọi khác · + collocation</p>
      <div class="hits">${res.slice(0, this.MAX).map(item).join('')}</div>`;
  },

  // Khi ô tìm kiếm còn trống: gợi ý vài từ để bấm thử
  suggest() {
    const ex = ['traffic', 'ô nhiễm', 'tackle', 'unemployment', 'giáo dục', 'a sharp rise', 'opinion', 'gia đình'];
    return `<p class="small muted">Thử tìm: ${ex.map((w) => `<a class="chip" href="#search/${encodeURIComponent(w)}">${App.ui.esc(w)}</a>`).join('')}</p>`;
  },
};
