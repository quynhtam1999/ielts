// Săn chuỗi tham chiếu: dán một đoạn văn (bài mẫu, The Guardian…),
// bấm vào các từ để tô màu những cách tác giả gọi cùng một sự vật.
App.views.hunt = {
  // Tách đoạn văn thành từng từ, nhớ vị trí để tô màu
  tokenize(text) {
    const out = [];
    const re = /[A-Za-z][A-Za-z'’-]*/g;
    let m;
    while ((m = re.exec(text))) out.push({ raw: m[0], start: m.index, end: m.index + m[0].length });
    return out;
  },

  chain: 1,
  marks: {},   // { vị trí từ: số chuỗi }
  text: '',
  names: { 1: '', 2: '', 3: '', 4: '' },

  render(el) {
    this.el = el;
    this.renderInput();
  },

  renderInput() {
    const esc = App.ui.esc;
    const saved = App.store.state.hunts;
    this.el.innerHTML = `
      <section class="card">
        <span class="eyebrow">Đọc chủ động</span>
        <h1>Săn chuỗi <span class="gradient-text">tham chiếu</span></h1>
        <p>Dán một đoạn văn tiếng Anh (bài mẫu IELTS, mục <a href="https://www.theguardian.com/cities" target="_blank" rel="noopener">Cities của The Guardian</a>…). Sau đó bấm vào các từ để tô màu mọi cách tác giả gọi <b>cùng một sự vật</b>.</p>
        <textarea id="src" placeholder="Paste a paragraph here…" style="min-height:160px">${esc(this.text)}</textarea>
        <p><button class="primary" id="go">Bắt đầu đánh dấu →</button></p>
      </section>
      ${saved.length ? `<section class="card"><h2>Đã lưu</h2>
        ${saved.map((h) => `<div class="attempt"><div class="row spread"><span class="small muted">${h.date}</span>
          <button class="ghost danger small" data-del="${h.id}">Xoá</button></div>
          ${h.chains.map((c) => `<p class="small"><b>${esc(c.name || 'Chuỗi')}:</b> ${c.items.map((i) => `<span class="chip">${esc(i)}</span>`).join(' → ')}</p>`).join('')}
        </div>`).join('')}</section>` : ''}`;

    this.el.querySelector('#go').addEventListener('click', () => {
      const t = this.el.querySelector('#src').value.trim();
      if (!t) { App.ui.toast('Hãy dán một đoạn văn'); return; }
      if (t !== this.text) { this.marks = {}; this.names = { 1: '', 2: '', 3: '', 4: '' }; }
      this.text = t;
      this.renderMark();
    });
    this.el.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
      App.store.state.hunts = saved.filter((h) => h.id !== b.dataset.del);
      App.store.save();
      this.renderInput();
    }));
  },

  renderMark() {
    const esc = App.ui.esc;
    const tokens = this.tokenize(this.text);
    let html = '';
    let pos = 0;
    tokens.forEach((t, i) => {
      html += esc(this.text.slice(pos, t.start));
      html += `<span class="tok ${this.marks[i] ? 'k' + this.marks[i] : ''}" data-i="${i}">${esc(t.raw)}</span>`;
      pos = t.end;
    });
    html += esc(this.text.slice(pos));

    this.el.innerHTML = `
      <section class="card">
        <a href="#hunt" class="small" id="back">← Sửa đoạn văn</a>
        <p class="small muted">Chọn màu chuỗi, đặt tên (vd: “zoning”), rồi bấm vào từng từ. Bấm lại để bỏ.</p>
        <div class="row">
          ${[1, 2, 3, 4].map((k) => `<button class="chain-btn ${k === this.chain ? 'active' : ''}" data-k="${k}">
            <span class="swatch" style="background:var(--c${k})"></span> Chuỗi ${k}</button>`).join('')}
        </div>
        <input type="text" id="cname" placeholder="Tên chuỗi ${this.chain} (sự vật được nhắc tới)" value="${esc(this.names[this.chain])}" style="margin-top:.5rem">
        <div class="passage" style="margin-top:1rem;white-space:pre-wrap">${html}</div>
      </section>
      <section class="card"><h2>Các chuỗi đã tìm</h2><div id="chains"></div>
        <button class="primary" id="saveHunt">💾 Lưu lại</button></section>`;

    this.el.querySelector('#back').addEventListener('click', (e) => { e.preventDefault(); this.renderInput(); });
    this.el.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { this.chain = Number(b.dataset.k); this.renderMark(); }));
    this.el.querySelector('#cname').addEventListener('input', (e) => { this.names[this.chain] = e.target.value; this.renderChains(); });
    this.el.querySelectorAll('.tok').forEach((s) => s.addEventListener('click', () => {
      const i = Number(s.dataset.i);
      if (this.marks[i] === this.chain) delete this.marks[i];
      else this.marks[i] = this.chain;
      s.className = 'tok ' + (this.marks[i] ? 'k' + this.marks[i] : '');
      this.renderChains();
    }));
    this.el.querySelector('#saveHunt').addEventListener('click', () => {
      const chains = this.collect().filter((c) => c.items.length);
      if (!chains.length) { App.ui.toast('Chưa đánh dấu từ nào'); return; }
      App.store.state.hunts.unshift({ id: 'h' + Date.now().toString(36), date: App.ui.today(), text: this.text, chains });
      App.store.save();
      App.store.logActivity('hunt');
      App.ui.toast('Đã lưu ✓');
    });
    this.renderChains();
  },

  // Gom các từ liền nhau cùng màu thành một cụm
  collect() {
    const tokens = this.tokenize(this.text);
    return [1, 2, 3, 4].map((k) => {
      const items = [];
      let cur = null;
      tokens.forEach((t, i) => {
        if (this.marks[i] === k) {
          if (cur && cur.last === i - 1) { cur.words.push(t.raw); cur.last = i; }
          else { cur = { words: [t.raw], last: i }; items.push(cur); }
        }
      });
      return { name: this.names[k], items: items.map((c) => c.words.join(' ')) };
    });
  },

  renderChains() {
    const esc = App.ui.esc;
    const box = this.el.querySelector('#chains');
    const chains = this.collect();
    box.innerHTML = chains.map((c, idx) => c.items.length ? `<p><span class="swatch" style="background:var(--c${idx + 1})"></span>
      <b>${esc(c.name || 'Chuỗi ' + (idx + 1))}</b> (${c.items.length} lần): ${c.items.map((i) => `<span class="chip">${esc(i)}</span>`).join(' → ')}</p>` : '').join('')
      || '<p class="muted small">Chưa đánh dấu gì.</p>';
  },
};
