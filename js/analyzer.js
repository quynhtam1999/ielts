// Bộ phân tích paraphrase (chạy hoàn toàn trên máy, không cần Internet).
// So sánh bài của bạn với đề bài / câu hỏi để tìm:
//   1. Cụm từ chép nguyên văn từ đề (từ 3 từ liên tiếp trở lên)
//   2. Tỉ lệ từ nội dung lấy lại từ đề
//   3. Từ bị lặp lại nhiều lần trong chính bài của bạn
// Đây là công cụ gợi ý, không thay thế giám khảo.
App.analyzer = (function () {
  // Từ chức năng (a, the, of…) không tính là "chép đề"
  const STOP = new Set(('a an the and or but nor so yet for of to in on at by with from into onto about as than then ' +
    'is are was were be been being am do does did done have has had having will would shall should can could may might must ' +
    'i me my mine we us our ours you your yours he him his she her hers it its they them their theirs ' +
    'this that these those there here what which who whom whose when where why how ' +
    'not no yes very too also just only more most less least much many some any all both each every other another such ' +
    'if because while although though whether up down out over under again further once own same ' +
    'one two first well really quite rather s t').split(' '));

  function norm(w) {
    return w.toLowerCase().replace(/[’]/g, "'").replace(/'s$/, '').replace(/^'+|'+$/g, '');
  }

  // Rút gọn rất đơn giản để "cities" và "city" được coi là một
  function stem(w) {
    if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
    if (w.length > 4 && w.endsWith('es') && /(sh|ch|x|ss)es$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
    return w;
  }

  // Tách văn bản thành các từ, nhớ vị trí để tô màu sau này
  function tokenize(text) {
    const re = /[A-Za-z][A-Za-z'’-]*/g;
    const out = [];
    let m;
    while ((m = re.exec(text))) {
      const n = norm(m[0]);
      out.push({ raw: m[0], start: m.index, end: m.index + m[0].length, n, s: stem(n), stop: STOP.has(n) });
    }
    return out;
  }

  function analyze(source, text, opts = {}) {
    const src = tokenize(source || '');
    const txt = tokenize(text || '');
    const keep = new Set();
    (opts.keep || []).forEach((k) => tokenize(k).forEach((t) => keep.add(t.s)));

    // 1) Cụm 3 từ liên tiếp trùng với đề
    const srcTri = new Set();
    for (let i = 0; i + 2 < src.length; i++) srcTri.add(src[i].s + ' ' + src[i + 1].s + ' ' + src[i + 2].s);
    const copied = new Array(txt.length).fill(false);
    for (let i = 0; i + 2 < txt.length; i++) {
      const tri = txt.slice(i, i + 3);
      if (!srcTri.has(tri.map((t) => t.s).join(' '))) continue;
      const content = tri.filter((t) => !t.stop);
      if (content.length === 0) continue;                 // toàn từ chức năng
      if (content.every((t) => keep.has(t.s))) continue;   // chỉ là từ khoá được phép giữ
      copied[i] = copied[i + 1] = copied[i + 2] = true;
    }

    // 2) Từ nội dung lấy lại từ đề
    const srcContent = new Set(src.filter((t) => !t.stop).map((t) => t.s));
    const content = txt.filter((t) => !t.stop && !keep.has(t.s));
    const reused = content.filter((t) => srcContent.has(t.s));
    const reusePct = content.length ? reused.length / content.length : 0;
    const reusedWords = [...new Set(reused.map((t) => t.n))];

    // 3) Từ lặp trong bài
    const threshold = txt.length < 80 ? 2 : 3;
    const counts = {};
    content.forEach((t) => { if (t.n.length > 2) counts[t.s] = (counts[t.s] || 0) + 1; });
    const repeated = Object.entries(counts).filter(([, c]) => c >= threshold)
      .map(([s, c]) => ({ word: (content.find((t) => t.s === s) || {}).n || s, stem: s, count: c }))
      .sort((a, b) => b.count - a.count);
    const repSet = new Set(repeated.map((r) => r.stem));

    // Tô màu: vàng = chép đề, gạch sóng đỏ = lặp từ
    const esc = App.ui.esc;
    let html = '';
    let pos = 0;
    let open = false;
    txt.forEach((t, i) => {
      const between = text.slice(pos, t.start);
      if (open && !copied[i]) { html += '</mark>'; open = false; }
      html += esc(between);
      if (!open && copied[i]) { html += '<mark class="copy">'; open = true; }
      html += repSet.has(t.s) && !t.stop ? `<span class="rep">${esc(t.raw)}</span>` : esc(t.raw);
      pos = t.end;
    });
    if (open) html += '</mark>';
    html += esc(text.slice(pos));

    const copiedCount = copied.filter(Boolean).length;
    return {
      wordCount: txt.length,
      reusePct,
      reusedWords,
      copiedPct: txt.length ? copiedCount / txt.length : 0,
      copiedCount,
      repeated,
      html,
      messages: feedback(txt.length, reusePct, copiedCount, repeated),
    };
  }

  function feedback(wc, reusePct, copiedCount, repeated) {
    const msgs = [];
    if (wc === 0) return [{ kind: 'note', text: 'Bạn chưa viết gì.' }];
    if (copiedCount >= 6) msgs.push({ kind: 'bad', text: `Có ${copiedCount} từ nằm trong các cụm chép nguyên văn từ đề (tô vàng). Hãy thử đổi cấu trúc hoặc gọi theo vai trò.` });
    else if (copiedCount > 0) msgs.push({ kind: 'note', text: 'Còn vài cụm giống đề (tô vàng). Chấp nhận được nếu đó là từ khoá.' });
    else msgs.push({ kind: 'good', text: 'Không có cụm 3 từ nào chép nguyên văn từ đề. Tốt!' });

    const pct = Math.round(reusePct * 100);
    if (reusePct > 0.5) msgs.push({ kind: 'bad', text: `${pct}% từ nội dung lấy lại từ đề. Mục tiêu: dưới 40%.` });
    else if (reusePct > 0.35) msgs.push({ kind: 'note', text: `${pct}% từ nội dung lấy lại từ đề. Khá ổn, có thể đổi thêm 1–2 từ.` });
    else msgs.push({ kind: 'good', text: `Chỉ ${pct}% từ nội dung lấy lại từ đề.` });

    if (repeated.length) {
      msgs.push({ kind: 'note', text: 'Từ lặp lại (gạch sóng đỏ): ' + repeated.map((r) => `“${App.ui.esc(r.word)}” ×${r.count}`).join(', ') + '. Thử dùng chuỗi tham chiếu (this approach, such a trend…).' });
    }
    return msgs;
  }

  // Hiển thị kết quả phân tích thành HTML
  function renderResult(r) {
    const pct = Math.round(r.reusePct * 100);
    const color = r.reusePct > 0.5 ? 'var(--bad)' : r.reusePct > 0.35 ? 'var(--warn)' : 'var(--ok)';
    return `
      <div class="analysis stack">
        <div class="rendered">${r.html}</div>
        <div class="meter"><span class="small">Lấy lại từ đề</span>
          <div class="bar"><div style="width:${pct}%;background:${color}"></div></div><b>${pct}%</b></div>
        <div class="small muted">${r.wordCount} từ${r.reusedWords.length ? ' · Từ lấy lại: ' + r.reusedWords.map(App.ui.esc).join(', ') : ''}</div>
        ${r.messages.map((m) => `<div class="${m.kind}">${m.text}</div>`).join('')}
      </div>`;
  }

  return { analyze, tokenize, renderResult };
})();
