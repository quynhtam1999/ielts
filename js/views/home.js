// Trang chủ: thống kê nhanh + nhiệm vụ hằng ngày
App.views.home = {
  render(el) {
    const S = App.store;
    const t = S.todayActivity();
    const due = S.dueWords().length;
    const reviewTarget = Math.min(10, due + (t.review || 0));

    const item = (done, href, text, progress) => `
      <li class="${done ? 'done' : ''}">
        <span class="check">${done ? '✓' : ''}</span>
        <span class="grow">${text}<br><span class="small muted">${progress}</span></span>
        <a class="btn" href="${href}">${done ? 'Làm thêm' : 'Bắt đầu'}</a>
      </li>`;

    el.innerHTML = `
      <section class="card">
        <h1 class="gradient-text">Paraphrase Studio</h1>
        <p class="muted">Rèn 5 kỹ thuật paraphrase cho IELTS Academic, dùng được cho cả Writing lẫn Speaking.</p>
        <div class="stats">
          <div class="stat"><b>${S.streak()}</b><span>ngày liên tiếp 🔥</span></div>
          <div class="stat"><b>${S.state.words.length}</b><span>từ trong sổ</span></div>
          <div class="stat"><b>${due}</b><span>thẻ đến hạn ôn</span></div>
          <div class="stat"><b>${S.state.writing.length + S.state.speaking.length}</b><span>bài đã lưu</span></div>
        </div>
      </section>

      <section class="card">
        <h2>Nhiệm vụ hôm nay <span class="muted small">(khoảng 25 phút)</span></h2>
        <ul class="mission">
          ${item((t.drills || 0) >= 10, '#drills', '🎯 Làm 10 câu luyện kỹ thuật', `${t.drills || 0}/10 câu`)}
          ${item((t.writing || 0) >= 1, '#writing', '✍️ Một đề Writing: viết 3 cách mở bài, mỗi cách một kỹ thuật (10 phút)', `${t.writing || 0}/1 bài`)}
          ${item((t.speaking || 0) >= 1, '#speaking', '🎤 Trả lời 1 câu Speaking, mở đầu bằng cách paraphrase câu hỏi', `${t.speaking || 0}/1 câu`)}
          ${item(reviewTarget === 0 || (t.review || 0) >= reviewTarget, '#review', '🗂️ Ôn thẻ từ vựng đến hạn', `${t.review || 0}/${reviewTarget} thẻ`)}
        </ul>
      </section>

      <h2>5 kỹ thuật</h2>
      <div class="grid">
        ${App.data.techniques.map((tc) => `
          <div class="card">
            <span class="tag">Kỹ thuật ${tc.no}</span>
            <h3>${tc.name}</h3>
            <p class="small muted">${tc.short}</p>
            <div class="row">
              <a class="btn" href="#learn/${tc.id}">Đọc</a>
              <a class="btn primary" href="#drills/${tc.id}">Luyện</a>
            </div>
          </div>`).join('')}
      </div>`;
  },
};
