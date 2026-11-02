// Trang chủ: chuỗi ngày học, nhiệm vụ hằng ngày, lối vào các chủ đề
App.views.home = {
  render(el) {
    const S = App.store;
    const esc = App.ui.esc;
    const t = S.todayActivity();
    const termsDone = Object.values(S.state.topics).reduce((a, o) => a + Object.keys(o).length, 0);
    const learned = Object.values(S.state.colloc).filter((c) => c.lastOk).length;
    const last = App.data.topics.find((x) => x.id === S.state.lastTopic);

    const item = (done, href, text, progress) => `
      <li class="${done ? 'done' : ''}">
        <span class="check">${done ? '✓' : ''}</span>
        <span class="grow">${text}<br><span class="small muted">${progress}</span></span>
        <a class="btn" href="${href}">${done ? 'Làm thêm' : 'Bắt đầu'}</a>
      </li>`;
    const where = last ? '#topics/' + last.id : '#topics';

    el.innerHTML = `
      <section class="card">
        <h1 class="gradient-text">Paraphrase Studio</h1>
        <p class="muted">Học paraphrase và collocation IELTS Academic theo chủ đề, dùng cho cả Writing lẫn Speaking.</p>
        <div class="stats">
          <div class="stat"><b>${S.streak()}</b><span>ngày liên tiếp 🔥</span></div>
          <div class="stat"><b>${(t.topics || 0) + (t.colloc || 0)}</b><span>bài hôm nay</span></div>
          <div class="stat"><b>${termsDone}</b><span>từ khoá đã làm</span></div>
          <div class="stat"><b>${learned}</b><span>/ ${App.data.collocs.length} collocation đã thuộc</span></div>
        </div>
      </section>

      <a class="card cta" href="${where}">
        <span class="topic-icon">${last ? last.icon : '📚'}</span>
        <span class="grow"><b>${last ? 'Học tiếp: ' + esc(last.name) : 'Học theo ' + App.data.topics.length + ' chủ đề'}</b><br>
          <span class="small muted">${last ? esc(last.vi) : 'Chọn chủ đề → tự điền paraphrase và collocation → so với đáp án mẫu'}</span></span>
        <span class="btn primary">${last ? 'Tiếp tục ▶' : 'Bắt đầu ▶'}</span>
      </a>

      <section class="card">
        <h2>Nhiệm vụ hôm nay <span class="muted small">(khoảng 20 phút)</span></h2>
        <ul class="mission">
          ${item((t.topics || 0) >= 5, where, '📝 Tự điền 5 từ khoá (cách gọi khác + collocation)', `${t.topics || 0}/5 từ`)}
          ${item((t.colloc || 0) >= 20, where, '🧩 Điền 20 câu collocation (2 lượt)', `${t.colloc || 0}/20 câu`)}
        </ul>
        <p class="small muted" style="margin:.6rem 0 0">Mẹo: học xong chủ đề nào, đọc to các cụm vừa sai 2–3 lần rồi đặt 1 câu của riêng bạn.</p>
      </section>

      <div class="row spread"><h2 style="margin:0">Chủ đề</h2><a href="#topics" class="small">Xem tất cả →</a></div>
      <div class="grid topic-grid" style="margin-top:.8rem">
        ${App.data.topics.filter((x) => x.group !== 'skill').slice(0, 6).map((x) => `
          <a class="card topic-card" href="#topics/${x.id}">
            <div class="topic-icon">${x.icon}</div>
            <h3>${esc(x.name)}</h3>
            <p class="small muted">${esc(x.vi)}</p>
          </a>`).join('')}
      </div>

      <h2>5 kỹ thuật paraphrase</h2>
      <div class="grid">
        ${App.data.techniques.map((tc) => `
          <a class="card topic-card" href="#learn/${tc.id}">
            <span class="tag">Kỹ thuật ${tc.no}</span>
            <h3>${tc.name}</h3>
            <p class="small muted">${tc.short}</p>
          </a>`).join('')}
      </div>`;
  },
};
