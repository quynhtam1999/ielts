// Trang Writing: chọn đề, viết 3 cách mở bài (mỗi cách 1 kỹ thuật), phân tích & lưu
App.views.writing = {
  render(el, args) {
    this.el = el;
    if (!args[0]) return this.renderList();
    if (args[0] === 'history') return this.renderHistory();
    const prompt = args[0] === 'custom'
      ? { id: 'custom', topic: 'Đề tự nhập', text: '', keep: [], samples: [] }
      : App.data.writingPrompts.find((p) => p.id === args[0]);
    if (!prompt) { location.hash = '#writing'; return; }
    this.renderEditor(prompt);
  },

  renderList() {
    const esc = App.ui.esc;
    const done = new Set(App.store.state.writing.map((w) => w.promptId));
    this.el.innerHTML = `
      <section class="card">
        <h1>Writing: luyện mở bài</h1>
        <p>Mỗi ngày một đề: viết <b>3 cách mở bài khác nhau</b>, mỗi cách dùng một kỹ thuật chính. Chỉ mất 10 phút.</p>
        <div class="row"><a class="btn primary" href="#writing/custom">➕ Tự nhập đề của bạn</a>
          <a class="btn" href="#writing/history">📜 Bài đã lưu (${App.store.state.writing.length})</a></div>
      </section>
      ${App.data.writingPrompts.map((p) => `
        <section class="card">
          <div class="row spread"><span class="tag">${esc(p.topic)}</span>${done.has(p.id) ? '<span class="small muted">✓ đã làm</span>' : ''}</div>
          <p>${esc(p.text)}</p>
          <a class="btn primary" href="#writing/${p.id}">Luyện đề này</a>
        </section>`).join('')}`;
  },

  renderEditor(p) {
    const esc = App.ui.esc;
    const techOpts = (sel) => App.data.techniques.map((t) =>
      `<option value="${t.id}" ${t.id === sel ? 'selected' : ''}>${t.no}. ${t.name}</option>`).join('');
    const defaults = ['level', 'role', 'structure'];

    this.el.innerHTML = `
      <section class="card">
        <a href="#writing" class="small">← Danh sách đề</a>
        <h1>Viết 3 cách mở bài</h1>
        ${p.id === 'custom'
          ? `<label for="customPrompt">Dán đề bài của bạn</label><textarea id="customPrompt" placeholder="Paste an IELTS Writing Task 2 question here…"></textarea>
             <label for="customKeep" style="margin-top:.5rem">Từ khoá được phép giữ nguyên (cách nhau bằng dấu phẩy)</label>
             <input type="text" id="customKeep" placeholder="vd: public transport, traffic">`
          : `<div class="prompt-box">${esc(p.text)}</div>
             ${p.keep.length ? `<p class="small muted">Từ khoá có thể giữ nguyên: ${p.keep.map((k) => `<span class="chip">${esc(k)}</span>`).join('')}</p>` : ''}`}
        <div class="info small" style="margin-top:.75rem">Gợi ý: Câu 1 paraphrase đề, câu 2 nêu quan điểm / hướng bài. Phần <mark class="copy">tô vàng</mark> là cụm chép từ đề; <span class="rep">gạch sóng</span> là từ bị lặp.</div>
      </section>

      <section class="card">
        ${[0, 1, 2].map((i) => `
          <div class="attempt">
            <div class="row spread"><h3>Cách ${i + 1}</h3>
              <select data-tech="${i}" style="width:auto">${techOpts(defaults[i])}</select></div>
            <textarea data-text="${i}" placeholder="Viết mở bài thứ ${i + 1}…"></textarea>
            <div data-result="${i}"></div>
          </div>`).join('')}
        <div class="row" style="margin-top:1rem">
          <button class="primary" id="analyze">🔍 Phân tích</button>
          <button id="save">💾 Lưu bài</button>
          ${p.samples.length ? '<button id="showSamples">👀 Xem mở bài mẫu</button>' : ''}
        </div>
      </section>

      <section class="card" id="samples" hidden>
        <h2>Mở bài mẫu</h2>
        ${p.samples.map((s) => `<div class="attempt"><span class="tag">${App.ui.techName(s.tech)}</span><p>${esc(s.text)}</p></div>`).join('')}
        <p class="small muted">So sánh với bài của bạn: họ đã đổi từ nào, giữ từ nào, đổi cấu trúc ra sao?</p>
      </section>`;

    const $ = (s) => this.el.querySelector(s);
    const getPrompt = () => (p.id === 'custom' ? $('#customPrompt').value : p.text);
    const getKeep = () => (p.id === 'custom' ? App.ui.splitList($('#customKeep').value) : p.keep);

    const analyzeAll = () => {
      const source = getPrompt();
      if (!source.trim()) { App.ui.toast('Hãy dán đề bài trước'); return null; }
      const results = [];
      [0, 1, 2].forEach((i) => {
        const text = this.el.querySelector(`[data-text="${i}"]`).value;
        const box = this.el.querySelector(`[data-result="${i}"]`);
        if (!text.trim()) { box.innerHTML = ''; return; }
        const r = App.analyzer.analyze(source, text, { keep: getKeep() });
        box.innerHTML = App.analyzer.renderResult(r);
        results.push({ tech: this.el.querySelector(`[data-tech="${i}"]`).value, text, reusePct: r.reusePct, copied: r.copiedCount });
      });
      return results;
    };

    $('#analyze').addEventListener('click', analyzeAll);
    $('#save').addEventListener('click', () => {
      const attempts = analyzeAll();
      if (!attempts) return;
      if (!attempts.length) { App.ui.toast('Bạn chưa viết mở bài nào'); return; }
      App.store.state.writing.unshift({
        id: 'wr' + Date.now().toString(36), date: App.ui.today(), promptId: p.id,
        prompt: getPrompt(), attempts,
      });
      App.store.save();
      App.store.logActivity('writing');
      App.ui.toast('Đã lưu bài ✓');
    });
    if ($('#showSamples')) {
      $('#showSamples').addEventListener('click', () => {
        $('#samples').hidden = false;
        $('#samples').scrollIntoView({ behavior: 'smooth' });
      });
    }
  },

  renderHistory() {
    const esc = App.ui.esc;
    const list = App.store.state.writing;
    this.el.innerHTML = `
      <section class="card"><a href="#writing" class="small">← Danh sách đề</a><h1>Bài viết đã lưu</h1>
        ${list.length ? '' : '<p class="muted">Chưa có bài nào.</p>'}</section>
      ${list.map((w) => `
        <section class="card">
          <div class="row spread"><span class="small muted">${w.date}</span><button class="ghost danger small" data-del="${w.id}">Xoá</button></div>
          <div class="prompt-box small">${esc(w.prompt)}</div>
          ${w.attempts.map((a) => `<div class="attempt"><span class="tag">${App.ui.techName(a.tech)}</span>
            <span class="small muted"> · lấy lại ${Math.round(a.reusePct * 100)}% từ đề</span><p>${esc(a.text)}</p></div>`).join('')}
        </section>`).join('')}`;
    this.el.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
      if (!confirm('Xoá bài này?')) return;
      App.store.state.writing = list.filter((w) => w.id !== b.dataset.del);
      App.store.save();
      this.renderHistory();
    }));
  },
};
