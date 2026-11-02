// Trang Chủ đề. Các địa chỉ:
//   #topics                    danh sách chủ đề (+ ô tìm kiếm)
//   #topics/<id>               một chủ đề: danh sách từ khoá, tiến độ, nút học tiếp / ôn lại
//   #topics/<id>/terms/<n>     📝 từ khoá thứ n: tự viết ① cách gọi khác ② collocation → Xem đáp án → tự đánh giá
// Không chấm điểm tự động: bạn tự so bài viết của mình với đáp án mẫu (js/data/topics.js).
// Kết quả lưu ở state.topics[id][từ khoá] = { ok: true (đã nhớ) | false (cần ôn) | null (mới xem), date }
App.views.topics = {
  // ===================== Dữ liệu =====================
  parse(item) {
    const [term, vi, paras, colls, note] = item;
    const list = (s) => s.split('|').map((x) => x.trim()).filter(Boolean);
    return { term, vi, paras: list(paras), colls: list(colls), note };
  },

  saved(tid) {
    const S = App.store.state;
    return S.topics[tid] || (S.topics[tid] = {});
  },

  // Trạng thái 1 từ: 'ok' đã nhớ · 'low' cần ôn · 'seen' mới xem đáp án · '' chưa làm
  // (dữ liệu cũ có điểm % thì: từ 60% = đã nhớ)
  status(s) {
    if (!s) return '';
    if (s.ok === true || (s.ok === undefined && s.pct >= 60)) return 'ok';
    if (s.ok === false || (s.ok === undefined && s.pct < 60)) return 'low';
    return 'seen';
  },

  termStats(t) {
    const sv = App.store.state.topics[t.id] || {};
    const st = t.items.map((it) => this.status(sv[it[0]]));
    return {
      total: t.items.length,
      done: st.filter(Boolean).length,
      ok: st.filter((x) => x === 'ok').length,
      weak: st.filter((x) => x === 'low').length,
    };
  },

  // Từ cần ôn nhất: đánh dấu "cần ôn" và lâu chưa xem lại nhất. Bỏ trống topic = tìm trên mọi chủ đề
  weakest(topic) {
    let best = null;
    (topic ? [topic] : App.data.topics).forEach((t) => {
      const sv = App.store.state.topics[t.id] || {};
      t.items.forEach((it, j) => {
        const s = sv[it[0]];
        if (this.status(s) !== 'low') return;
        if (!best || (s.date || '') < (best.s.date || '')) best = { t, j, s };
      });
    });
    return best;
  },

  // "I15 I16 A32" → "Intermediate: Unit 15, 16 · Advanced: Unit 32"
  sourceText(t) {
    const us = (t.units || '').split(' ').filter(Boolean);
    const part = (p, name) => {
      const n = us.filter((u) => u[0] === p).map((u) => u.slice(1));
      return n.length ? `${name}: Unit ${n.join(', ')}` : '';
    };
    return [part('I', 'Intermediate'), part('A', 'Advanced')].filter(Boolean).join(' · ');
  },

  bar(pct) {
    return `<div class="progress"><div style="width:${Math.round(pct)}%"></div></div>`;
  },

  // Dấu ~ trong collocation = từ khoá bỏ mạo từ đầu (the countryside → countryside);
  // mạo từ cần dùng đã được viết sẵn trong dữ liệu (vd "protect the ~", "unspoilt ~")
  bare(term) {
    return term.replace(/^(the|a|an) /i, '');
  },
  fillColl(c, term) {
    return c.replace(/~/g, this.bare(term));
  },
  // Hiển thị: từ khoá in màu nhạt, phần còn lại in đậm
  showColl(c, term) {
    const esc = App.ui.esc;
    return c.includes('~')
      ? c.split('~').map((part) => `<b>${esc(part)}</b>`).join(`<span class="muted">${esc(this.bare(term))}</span>`)
      : `<b>${esc(c)}</b>`;
  },

  // ===================== Bộ định tuyến của trang =====================
  render(el, args) {
    const t = App.data.topics.find((x) => x.id === args[0]);
    if (!t) return this.renderList(el);
    App.store.state.lastTopic = t.id;
    App.store.save();
    if (args[1] === 'terms' && t.items.length) {
      const i = parseInt(args[2], 10);
      if (isNaN(i)) return this.renderHub(el, t); // "terms" hoặc "terms/done" cũ → về danh sách từ
      return this.renderItem(el, t, Math.max(0, Math.min(i, t.items.length - 1)));
    }
    this.renderHub(el, t);
  },

  // ===================== Danh sách chủ đề =====================
  renderList(el) {
    const esc = App.ui.esc;
    const card = (t) => {
      const a = this.termStats(t);
      return `<a class="card topic-card" href="#topics/${t.id}">
        <div class="topic-icon">${t.icon}</div>
        <h3>${esc(t.name)}</h3>
        <p class="small muted">${esc(t.vi)}</p>
        ${this.bar(a.total ? (a.done / a.total) * 100 : 0)}
        <span class="topic-meta">${a.done ? `${a.done}/` : ''}${a.total} từ khoá${a.ok ? ` · ${a.ok} đã nhớ` : ''}</span>
      </a>`;
    };
    const topics = App.data.topics.filter((t) => t.group !== 'skill');
    const skills = App.data.topics.filter((t) => t.group === 'skill');
    const total = App.data.topics.reduce((a, t) => a + t.items.length, 0);
    el.innerHTML = `
      <section class="hero">
        <span class="eyebrow">${App.data.topics.length} chủ đề · ${total} từ khoá</span>
        <h1>Học theo <span class="gradient-text">chủ đề</span></h1>
        <p class="muted">Với mỗi từ khoá, tự viết các <b>cách gọi khác</b> (paraphrase) và <b>collocation</b> đi kèm,
          rồi xem đáp án mẫu soạn từ <i>English Collocations in Use</i> để tự so.</p>
        <form class="search-box" id="find">
          <input type="search" id="q" placeholder="Tìm từ khoá, nghĩa tiếng Việt, collocation…" aria-label="Tìm kiếm">
        </form>
      </section>
      <h2>Chủ đề IELTS</h2>
      <div class="grid topic-grid">${topics.map(card).join('')}</div>
      <h2>Collocation theo chức năng <span class="muted small" style="font-family:var(--sans)">dùng được cho mọi đề</span></h2>
      <div class="grid topic-grid">${skills.map(card).join('')}</div>`;

    el.querySelector('#find').addEventListener('submit', (e) => {
      e.preventDefault();
      const q = el.querySelector('#q').value.trim();
      location.hash = '#search' + (q ? '/' + encodeURIComponent(q) : '');
    });
  },

  // ===================== Một chủ đề: danh sách từ khoá =====================
  renderHub(el, t) {
    const esc = App.ui.esc;
    const st = this.termStats(t);
    const sv = App.store.state.topics[t.id] || {};
    const next = t.items.findIndex((it) => !sv[it[0]]);
    const weak = this.weakest(t);
    const src = this.sourceText(t);
    el.innerHTML = `
      <a class="back" href="#topics">← Tất cả chủ đề</a>
      <section class="hero">
        <span class="eyebrow">${t.group === 'skill' ? 'Collocation theo chức năng' : 'Chủ đề IELTS'} · ${st.total} từ khoá</span>
        <h1>${t.icon} ${esc(t.name)}</h1>
        <p class="muted" style="margin:0">${esc(t.vi)}</p>
        ${this.bar((st.done / st.total) * 100)}
        <p class="small muted" style="margin:0 0 1.1rem">Đã làm ${st.done}/${st.total}${st.ok ? ` · ${st.ok} từ đã nhớ` : ''}${st.weak ? ` · ${st.weak} từ cần ôn` : ''}</p>
        <div class="row">
          ${next >= 0 ? `<a class="btn primary" href="#topics/${t.id}/terms/${next}">${st.done ? 'Làm tiếp' : 'Bắt đầu'} ▶</a>` : ''}
          ${weak ? `<a class="btn${next < 0 ? ' primary' : ''}" href="#topics/${t.id}/terms/${weak.j}">↺ Ôn từ cần ôn (${st.weak})</a>` : ''}
          ${next < 0 && !weak ? '<span class="good small">Bạn đã làm hết chủ đề này 🎉 Bấm vào một từ để làm lại.</span>' : ''}
        </div>
      </section>
      <section class="card">
        <ul class="term-list">
          ${t.items.map((x, j) => `<li><a href="#topics/${t.id}/terms/${j}">
              <span class="dot ${this.status(sv[x[0]])}"></span>
              <span class="t">${esc(x[0])}</span><span class="v">${esc(x[1])}</span></a></li>`).join('')}
        </ul>
        <div class="legend"><span><i class="dot ok"></i>đã nhớ</span><span><i class="dot low"></i>cần ôn</span><span><i class="dot seen"></i>đã xem đáp án</span><span><i class="dot"></i>chưa làm</span></div>
      </section>
      ${src ? `<p class="small muted">Collocation tham khảo từ <i>English Collocations in Use</i>, ${esc(src)}.</p>` : ''}`;
  },

  // ===================== 📝 Một từ khoá =====================
  renderItem(el, t, i) {
    const esc = App.ui.esc;
    const it = this.parse(t.items[i]);
    const sv = this.saved(t.id);
    const last = sv[it.term];
    const n = t.items.length;
    const nextHref = `#topics/${t.id}${i + 1 < n ? '/terms/' + (i + 1) : ''}`;
    const lastText = { ok: 'đã nhớ', low: 'cần ôn', seen: 'đã xem đáp án' }[this.status(last)];

    el.innerHTML = `
      <a class="back" href="#topics/${t.id}">← ${t.icon} ${esc(t.name)}</a>
      <div class="row spread small muted"><span>Từ khoá ${i + 1} / ${n}</span>${last ? `<span>Lần trước (${esc(last.date)}): ${lastText}</span>` : ''}</div>
      ${this.bar(((i + 1) / n) * 100)}

      <section class="card">
        <div class="term-head">
          <div>
            <h1 class="term">${esc(it.term)}</h1>
            <div class="vi">${esc(it.vi)}</div>
          </div>
          <button class="icon-btn" id="speak" title="Nghe phát âm" aria-label="Nghe phát âm">🔊</button>
        </div>

        <div class="stack">
          <div>
            <label for="para">① Cách gọi khác / paraphrase <span class="muted small">· đáp án mẫu có ${it.paras.length} cách</span></label>
            <textarea id="para" placeholder="Tự viết trước khi xem đáp án: …, …, …" style="min-height:84px"></textarea>
            <div class="hint small" id="hint-para" hidden></div>
          </div>
          <div>
            <label for="coll">② Collocation & động từ đi kèm <span class="muted small">· đáp án mẫu có ${it.colls.length} cụm</span></label>
            <textarea id="coll" placeholder="vd: … ${esc(this.bare(it.term))}, ${esc(this.bare(it.term))} …, …" style="min-height:84px"></textarea>
            <div class="hint small" id="hint-coll" hidden></div>
          </div>
        </div>
        <div class="row" style="margin-top:1.3rem" id="actions">
          <button class="primary" id="show">Xem đáp án</button>
          <button id="hint">💡 Gợi ý chữ cái đầu</button>
        </div>
        <div id="answer"></div>
        <div class="term-foot">
          ${i > 0 ? `<a class="btn ghost" href="#topics/${t.id}/terms/${i - 1}">◀ Từ trước</a>` : '<span></span>'}
          <a class="btn ghost" href="${nextHref}">${i + 1 < n ? 'Bỏ qua ▶' : 'Về danh sách ▶'}</a>
        </div>
      </section>`;

    const $ = (s) => el.querySelector(s);
    let logged = false;

    $('#speak').addEventListener('click', () => this.say(it.term));

    $('#hint').addEventListener('click', () => {
      const mask = (s) => s.replace(/[A-Za-z]+/g, (w) => w[0] + '_'.repeat(w.length - 1));
      $('#hint-para').innerHTML = 'Gợi ý: ' + it.paras.map((p) => `<span class="chip">${esc(mask(p))}</span>`).join('');
      $('#hint-coll').innerHTML = 'Gợi ý (~ = từ khoá): ' + it.colls.map((p) => `<span class="chip">${esc(mask(p))}</span>`).join('');
      $('#hint-para').hidden = false;
      $('#hint-coll').hidden = false;
    });

    // Lưu kết quả tự đánh giá rồi sang từ tiếp
    const rate = (ok) => {
      sv[it.term] = { ok, date: App.ui.today() };
      App.store.save();
      location.hash = nextHref;
    };

    const show = () => {
      $('#hint-para').hidden = true;
      $('#hint-coll').hidden = true;
      const chip = (html, say) => `<button class="chip ans" data-say="${esc(say)}" title="Bấm để nghe">${html}</button>`;
      $('#answer').innerHTML = `
        <div class="answer">
          <div class="ans-block">
            <div class="ans-title">① Cách gọi khác <span class="muted">(${it.paras.length})</span></div>
            <div>${it.paras.map((p) => chip(esc(p), p)).join('')}</div>
          </div>
          <div class="ans-block">
            <div class="ans-title">② Collocation <span class="muted">(${it.colls.length})</span></div>
            <div>${it.colls.map((c) => chip(this.showColl(c, it.term), this.fillColl(c, it.term))).join('')}</div>
          </div>
          ${it.note ? `<p class="note small" style="margin:1rem 0 0">⚠️ ${esc(it.note)}</p>` : ''}
          <p class="small muted" style="margin:.9rem 0 0">So với bài bạn viết ở trên. Bấm vào một cụm để nghe đọc.</p>
        </div>
        <div class="rate">
          <span class="small muted">Bạn thấy từ này thế nào?</span>
          <div class="row">
            <button class="primary" id="ok">✓ Đã nhớ</button>
            <button id="low">↺ Cần ôn lại</button>
          </div>
        </div>`;
      $('#answer').querySelectorAll('[data-say]').forEach((b) => b.addEventListener('click', () => this.say(b.dataset.say)));
      $('#ok').addEventListener('click', () => rate(true));
      $('#low').addEventListener('click', () => rate(false));
      $('#actions').hidden = true;
      // Lần đầu xem đáp án của từ này: tính vào nhiệm vụ (từ mới → "topics", đã làm trước đó → "review")
      if (!logged) {
        App.store.logActivity(last ? 'review' : 'topics');
        logged = true;
        if (!last) { sv[it.term] = { ok: null, date: App.ui.today() }; App.store.save(); }
      }
      $('#answer').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    $('#show').addEventListener('click', show);
    el.querySelectorAll('textarea').forEach((ta) => ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !$('#actions').hidden) show();
    }));
  },

  // Đọc to bằng giọng Anh–Anh của trình duyệt
  say(text) {
    if (!('speechSynthesis' in window)) return App.ui.toast('Trình duyệt không hỗ trợ đọc');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB';
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  },
};
