// Trang Tiến độ: thống kê theo kỹ thuật, lịch học, sao lưu/khôi phục dữ liệu
App.views.data = {
  render(el) {
    const S = App.store.state;
    const esc = App.ui.esc;
    const groups = App.data.drillGroups.filter((g) => g.id !== 'all');

    // 28 ngày gần nhất
    const days = [];
    for (let i = 27; i >= 0; i--) {
      const d = App.ui.addDays(App.ui.today(), -i);
      const a = S.activity[d] || {};
      days.push({ d, n: Object.values(a).reduce((x, y) => x + y, 0) });
    }

    el.innerHTML = `
      <section class="card">
        <h1>Tiến độ</h1>
        <h3>Độ chính xác theo kỹ thuật</h3>
        ${groups.map((g) => {
          const st = S.drillStats[g.id] || { correct: 0, total: 0 };
          const pct = st.total ? Math.round((st.correct / st.total) * 100) : 0;
          return `<div class="meter"><span class="small label">${esc(g.name)}</span>
            <div class="bar"><div style="width:${pct}%;background:var(--primary)"></div></div>
            <span class="small val">${st.total ? pct + '% (' + st.total + ')' : '—'}</span></div>`;
        }).join('')}
        <h3>28 ngày gần đây</h3>
        <div style="display:grid;grid-template-columns:repeat(14,1fr);gap:4px">
          ${days.map((x) => `<div title="${x.d}: ${x.n} hoạt động" style="aspect-ratio:1;border-radius:4px;background:${x.n ? 'var(--ok)' : 'var(--bg)'};opacity:${x.n ? Math.min(0.35 + x.n / 20, 1) : 1};border:1px solid var(--line)"></div>`).join('')}
        </div>
        <p class="small muted">Chuỗi hiện tại: ${App.store.streak()} ngày · Bài viết: ${S.writing.length} · Speaking: ${S.speaking.length} · Đoạn săn tham chiếu: ${S.hunts.length}</p>
      </section>

      <section class="card">
        <h2>Sao lưu dữ liệu</h2>
        <p class="small">Dữ liệu chỉ nằm trong trình duyệt này. Nên xuất file sao lưu mỗi tuần, hoặc khi muốn chuyển sang máy khác.</p>
        <div class="row">
          <button class="primary" id="export">⬇️ Xuất dữ liệu (.json)</button>
          <label class="btn" style="margin:0;font-weight:400">⬆️ Nhập dữ liệu<input type="file" id="import" accept=".json,application/json" hidden></label>
          <button class="danger" id="reset">Xoá toàn bộ & bắt đầu lại</button>
        </div>
      </section>`;

    el.querySelector('#export').addEventListener('click', () => {
      const blob = new Blob([App.store.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `paraphrase-studio-${App.ui.today()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
    el.querySelector('#import').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        App.store.importJSON(await file.text());
        App.ui.toast('Đã nhập dữ liệu ✓');
        this.render(el);
      } catch (err) {
        App.ui.toast('Lỗi: ' + err.message);
      }
    });
    el.querySelector('#reset').addEventListener('click', () => {
      if (!confirm('Xoá toàn bộ tiến độ, bài viết và từ bạn đã thêm? Không thể hoàn tác.')) return;
      App.store.reset();
      App.ui.toast('Đã đặt lại');
      this.render(el);
    });
  },
};
