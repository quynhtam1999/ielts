// Ôn thẻ từ vựng theo phương pháp lặp lại ngắt quãng (Leitner)
// Mỗi thẻ hỏi một "góc": tổng quát / cụ thể / vai trò / từ loại / collocation
App.views.review = {
  FACETS: [
    { key: 'general', ask: 'Từ TỔNG QUÁT hơn là gì?' },
    { key: 'specific', ask: 'Cho ví dụ CỤ THỂ hơn.' },
    { key: 'role', ask: 'Gọi theo VAI TRÒ / CHỨC NĂNG thế nào?' },
    { key: 'forms', ask: 'Các BIẾN THỂ TỪ LOẠI?' },
    { key: 'collocations', ask: 'Đi với COLLOCATION nào?' },
  ],

  render(el) {
    this.el = el;
    this.queue = App.ui.shuffle(App.store.dueWords()).slice(0, 20);
    this.done = 0;
    this.next();
  },

  next() {
    const esc = App.ui.esc;
    if (!this.queue.length) {
      const total = App.store.state.words.length;
      this.el.innerHTML = `
        <section class="card" style="text-align:center">
          <h1>${this.done ? '🎉 Xong lượt ôn!' : 'Không có thẻ nào đến hạn'}</h1>
          <p class="muted">${this.done ? `Bạn vừa ôn ${this.done} thẻ.` : `Sổ có ${total} từ. Quay lại vào ngày mai, hoặc thêm từ mới.`}</p>
          <div class="row" style="justify-content:center"><a class="btn" href="#bank">Mở Sổ từ vựng</a><a class="btn primary" href="#home">Về trang chủ</a></div>
        </section>`;
      return;
    }
    const w = this.queue[0];
    const facets = this.FACETS.filter((f) => w[f.key] && w[f.key].length);
    const f = facets[Math.floor(Math.random() * facets.length)] || { key: 'general', ask: 'Bạn nhớ gì về từ này?' };

    this.el.innerHTML = `
      <section class="card flash">
        <p class="small muted">Còn ${this.queue.length} thẻ · ${esc(w.topic || '')}</p>
        <div class="word">${esc(w.headword)}</div>
        <div class="ask">${f.ask}</div>
        <p class="small muted">Hãy nói hoặc nghĩ câu trả lời trước khi lật thẻ.</p>
        <button class="primary" id="flip">Lật thẻ</button>
        <div id="back" hidden>
          <div class="answer">
            ${this.FACETS.map((x) => (w[x.key] && w[x.key].length) ? `
              <p style="${x.key === f.key ? '' : 'opacity:.6'}"><b>${x.ask.replace(/\?|\.$/, '')}:</b><br>
              ${w[x.key].map((v) => `<span class="chip">${esc(v)}</span>`).join('')}</p>` : '').join('')}
            ${w.note ? `<p class="note small">${esc(w.note)}</p>` : ''}
          </div>
          <div class="row" style="justify-content:center">
            <button data-g="0">😕 Quên</button>
            <button data-g="1" class="primary">🙂 Nhớ</button>
            <button data-g="2">😎 Dễ</button>
          </div>
        </div>
      </section>`;

    this.el.querySelector('#flip').addEventListener('click', (e) => {
      e.target.hidden = true;
      this.el.querySelector('#back').hidden = false;
    });
    this.el.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => {
      const g = Number(b.dataset.g);
      App.store.gradeWord(w.id, g);
      App.store.logActivity('review');
      this.queue.shift();
      if (g === 0) this.queue.push(w); // quên thì gặp lại cuối lượt
      else this.done++;
      this.next();
    }));
  },
};
