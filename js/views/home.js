// Trang chủ: chuỗi ngày học, nhiệm vụ hằng ngày, lối vào các chủ đề
App.views.home = {
  render(el) {
    const S = App.store;
    const esc = App.ui.esc;
    const T = App.views.topics;
    const t = S.todayActivity();
    const all = App.data.topics.reduce((a, x) => a + x.items.length, 0);
    let done = 0;
    let good = 0;
    App.data.topics.forEach((x) => {
      const st = T.termStats(x);
      done += st.done;
      good += st.ok;
    });
    const last = App.data.topics.find((x) => x.id === S.state.lastTopic);
    const where = last ? '#topics/' + last.id : '#topics';
    const weak = T.weakest();
    const NEW = 10;   // nhiệm vụ: 10 từ mới mỗi ngày
    const REVIEW = 5; // nhiệm vụ: ôn lại 5 từ

    const item = (ok, href, text, progress, label) => `
      <li class="${ok ? 'done' : ''}">
        <span class="check">${ok ? '✓' : ''}</span>
        <span class="grow">${text}<br><span class="small muted">${progress}</span></span>
        ${href ? `<a class="btn" href="${href}">${ok ? 'Làm thêm' : label || 'Bắt đầu'}</a>` : ''}
      </li>`;

    el.innerHTML = `
      <section class="hero">
        <span class="eyebrow">IELTS Academic · Anh–Anh</span>
        <h1>Nói một ý, <span class="gradient-text">bằng nhiều cách</span></h1>
        <p class="muted">Học paraphrase và collocation theo chủ đề cho Writing và Speaking: tự viết, xem đáp án mẫu để tự so, ôn lại từ chưa nhớ.</p>
        <div class="stats">
          <div class="stat"><b>${S.streak()}</b><span>ngày liên tiếp</span></div>
          <div class="stat"><b>${(t.topics || 0) + (t.review || 0)}</b><span>từ đã làm hôm nay</span></div>
          <div class="stat"><b>${done}</b><span>/ ${all} từ khoá đã làm</span></div>
          <div class="stat"><b>${good}</b><span>từ đã nhớ</span></div>
        </div>
      </section>

      <a class="card cta" href="${where}">
        <span class="topic-icon">${last ? last.icon : '📚'}</span>
        <span class="grow"><b>${last ? 'Học tiếp: ' + esc(last.name) : 'Học theo ' + App.data.topics.length + ' chủ đề'}</b><br>
          <span class="small muted">${last ? esc(last.vi) : 'Chọn chủ đề → tự viết paraphrase và collocation → xem đáp án mẫu'}</span></span>
        <span class="btn primary">${last ? 'Tiếp tục ▶' : 'Bắt đầu ▶'}</span>
      </a>

      <section class="card">
        <h2>Nhiệm vụ hôm nay <span class="muted small">khoảng 20 phút</span></h2>
        <ul class="mission">
          ${item((t.topics || 0) >= NEW, where, `📝 Làm ${NEW} từ khoá mới`, `${t.topics || 0}/${NEW} từ`)}
          ${item((t.review || 0) >= REVIEW, weak ? `#topics/${weak.t.id}/terms/${weak.j}` : '',
            `↺ Ôn lại ${REVIEW} từ cần ôn`,
            weak ? `${t.review || 0}/${REVIEW} từ · gợi ý: ${esc(weak.t.items[weak.j][0])} (${esc(weak.t.name)})` : `${t.review || 0}/${REVIEW} từ · chưa có từ nào đánh dấu “cần ôn”`, 'Ôn ngay')}
        </ul>
        <p class="small muted" style="margin:.9rem 0 0">Mẹo: sau khi xem đáp án, đọc to các cụm bạn chưa nghĩ ra 2–3 lần rồi đặt 1 câu của riêng bạn.</p>
      </section>

      <div class="row spread" style="margin-top:2.2rem"><h2 style="margin:0">Chủ đề</h2><a href="#topics" class="small muted">Xem tất cả →</a></div>
      <div class="grid topic-grid" style="margin-top:1rem">
        ${App.data.topics.filter((x) => x.group !== 'skill').slice(0, 6).map((x) => `
          <a class="card topic-card" href="#topics/${x.id}">
            <div class="topic-icon">${x.icon}</div>
            <h3>${esc(x.name)}</h3>
            <p class="small muted">${esc(x.vi)}</p>
            <span class="topic-meta" style="margin-top:.6rem">${x.items.length} từ khoá</span>
          </a>`).join('')}
      </div>

      <h2>5 kỹ thuật paraphrase</h2>
      <div class="grid">
        ${App.data.techniques.map((tc) => `
          <a class="card topic-card" href="#learn/${tc.id}">
            <span class="tag" style="align-self:flex-start">Kỹ thuật ${tc.no}</span>
            <h3>${tc.name}</h3>
            <p class="small muted">${tc.short}</p>
          </a>`).join('')}
      </div>`;
  },
};
