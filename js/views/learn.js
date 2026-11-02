// Trang lý thuyết: 5 kỹ thuật + cảnh báo + cách học
App.views.learn = {
  render(el, args) {
    const D = App.data;
    el.innerHTML = `
      <section class="hero">
        <span class="eyebrow">Lý thuyết</span>
        <h1>5 kỹ thuật <em class="accent">paraphrase</em></h1>
        <p class="muted">Đọc từng kỹ thuật kèm ví dụ, rồi sang mục Chủ đề để tự viết cách gọi khác cho từng từ khoá.</p>
        <div class="row">${D.techniques.map((t) => `<a class="chip" href="#learn/${t.id}">${t.no}. ${t.name}</a>`).join('')}
          <a class="chip" href="#learn/warnings">Cảnh báo</a><a class="chip" href="#learn/tips">Cách học</a></div>
      </section>

      ${D.techniques.map((t) => `
        <section class="card" id="t-${t.id}">
          <span class="tag">Kỹ thuật ${t.no}</span>
          <h2>${t.name}</h2>
          <p>${t.idea}</p>
          <div class="table-wrap"><table>
            <tr>${t.table.head.map((h) => `<th>${h}</th>`).join('')}</tr>
            ${t.table.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}
          </table></div>
          <p>${t.extra}</p>
          <div class="info">${t.tip}</div>
        </section>`).join('')}

      <section class="card" id="t-warnings">
        <h2>Cảnh báo</h2>
        <div class="stack">${D.warnings.map((w) => `<div class="note">${w}</div>`).join('')}</div>
        <p><a class="btn primary" href="#topics">Luyện từ vựng theo chủ đề →</a></p>
      </section>

      <section class="card" id="t-tips">
        <h2>Cách học hiệu quả</h2>
        <div class="grid">
          ${D.studyTips.map((s) => `
            <div class="card">
              <h3>${s.title}</h3>
              <p class="small">${s.body}</p>
              <a href="${s.link}" ${s.link.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${s.linkText} →</a>
            </div>`).join('')}
        </div>
      </section>`;

    // Nếu địa chỉ là #learn/role thì cuộn tới kỹ thuật đó
    if (args[0]) {
      const target = document.getElementById('t-' + args[0]);
      if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  },
};
