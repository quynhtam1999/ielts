// Trang Chủ đề. Các địa chỉ:
//   #topics                    danh sách chủ đề
//   #topics/<id>               trang chủ đề: chọn cách học
//   #topics/<id>/terms/<n>     📝 từ khoá: tự điền ① cách gọi khác ② collocation (đáp án trong js/data/topics.js)
//   #topics/<id>/terms/done    tổng kết phần từ khoá
//   #topics/<id>/colloc        🧩 điền collocation vào câu ví dụ, 10 câu/lượt (dữ liệu js/data/collocations.js)
//   #topics/<id>/list          📖 danh sách collocation để đọc trước
App.views.topics = {
  // ===================== So khớp câu trả lời tự do =====================
  // Từ chức năng: bỏ qua khi so sánh (the, of, these…)
  STOP: new Set(('a an the this these that those such their its our his her my your them they it ' +
    'and or of to in on at for with by from into is are was were be been being has have had s someone something sb sth').split(' ')),
  // Từ tận cùng bằng s nhưng không phải số nhiều
  NOS: new Set('news series species means physics economics politics analysis crisis basis'.split(' ')),

  // Rút gọn từ để "improving / improved / improve" hay "cities / city" được coi là một
  stem(w) {
    if (this.NOS.has(w)) return w;
    if (w.length > 4 && w.endsWith('ies')) w = w.slice(0, -3) + 'y';
    else if (/(sh|ch|x|ss)es$/.test(w)) w = w.slice(0, -2);
    else if (w.length > 3 && w.endsWith('s') && !/(ss|us|is)$/.test(w)) w = w.slice(0, -1);
    if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
    else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
    if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1);
    return w;
  },

  // Biến một cụm thành tập "từ gốc" để so sánh; bỏ từ chức năng và (nếu cần) chính từ khoá
  key(text, remove) {
    const words = String(text).toLowerCase().replace(/[’']/g, ' ').match(/[a-z0-9]+/g) || [];
    return [...new Set(words.filter((w) => !this.STOP.has(w)).map((w) => this.stem(w)).filter((s) => !remove || !remove.has(s)))];
  },

  split(text) {
    return String(text || '').split(/[,;|/\n]+/).map((s) => s.trim()).filter(Boolean);
  },

  // Khớp nếu bạn viết đủ ý của đáp án (có thể dài hơn), hoặc viết gọn nhưng trúng ít nhất nửa cụm
  same(u, r) {
    if (!u.length || !r.length) return false;
    if (r.every((t) => u.includes(t))) return true;
    return u.every((t) => r.includes(t)) && u.length / r.length >= 0.5;
  },

  // So câu trả lời của bạn với danh sách đáp án mẫu
  grade(userText, refs, termKey, isColl) {
    const remove = isColl ? new Set(termKey) : null;
    const users = this.split(userText).map((t) => ({ text: t, k: this.key(t, remove), hits: [] }))
      .filter((u) => u.k.length && !(!isColl && u.k.every((x) => termKey.includes(x)))); // bỏ qua nếu chỉ chép lại từ khoá
    const res = refs.map((r, ri) => {
      const plain = isColl ? r.replace(/~/g, ' ') : r;
      const k = this.key(plain, remove);
      // "buses and metro lines": chỉ viết "buses" cũng tính là đúng
      const parts = plain.includes(',') || / and /.test(plain)
        ? plain.split(/,| and /).map((x) => this.key(x, remove)).filter((x) => x.length) : [];
      let hit = false;
      users.forEach((u) => {
        if (this.same(u.k, k) || parts.some((pk) => this.same(u.k, pk) && this.same(pk, u.k))) { hit = true; u.hits.push(ri); }
      });
      return { text: r, hit };
    });
    return { refs: res, users, extras: users.filter((u) => !u.hits.length).map((u) => u.text) };
  },

  // ===================== Dữ liệu =====================
  parse(item) {
    const [term, vi, paras, colls, note] = item;
    const list = (s) => s.split('|').map((x) => x.trim()).filter(Boolean);
    return { term, vi, paras: list(paras), colls: list(colls), note };
  },

  // Các collocation (từ file Anki) thuộc chủ đề: [unit, collocation, nghĩa, ví dụ, nghĩa ví dụ, biến thể]
  collocsOf(t) {
    if (!t._c) {
      const us = (t.units || '').split(' ').filter(Boolean);
      t._c = App.data.collocs.filter((r) => us.includes(r[0]));
    }
    return t._c;
  },

  unitName(u) {
    return (u[0] === 'I' ? 'Intermediate' : 'Advanced') + ' · Unit ' + u.slice(1) + ': ' + App.data.units[u];
  },

  saved(tid) {
    const S = App.store.state;
    return S.topics[tid] || (S.topics[tid] = {});
  },

  termStats(t) {
    const sv = App.store.state.topics[t.id] || {};
    const done = t.items.filter((it) => sv[it[0]]);
    const pct = done.length ? Math.round(done.reduce((a, it) => a + sv[it[0]].pct, 0) / done.length) : 0;
    return { done: done.length, total: t.items.length, pct };
  },

  // Collocation "đã thuộc" = lần gần nhất điền đúng
  collocStats(t) {
    const C = App.store.state.colloc;
    const list = this.collocsOf(t);
    return { total: list.length, learned: list.filter((r) => C[r[1]] && C[r[1]].lastOk).length, seen: list.filter((r) => C[r[1]]).length };
  },

  bar(pct, color) {
    return `<div class="progress"><div style="width:${Math.round(pct)}%${color ? ';background:' + color : ''}"></div></div>`;
  },

  // ===================== Bộ định tuyến của trang =====================
  render(el, args) {
    this.el = el;
    const t = App.data.topics.find((x) => x.id === args[0]);
    if (!t) return this.renderList(el);
    App.store.state.lastTopic = t.id;
    App.store.save();
    const mode = args[1];
    if (mode === 'colloc' && this.collocsOf(t).length) return this.startColloc(el, t);
    if (mode === 'list' && this.collocsOf(t).length) return this.renderBrowse(el, t);
    if (mode === 'terms' && t.items.length) {
      if (args[2] === 'done') return this.renderSummary(el, t);
      let i = parseInt(args[2], 10);
      if (isNaN(i)) {
        const sv = App.store.state.topics[t.id] || {};
        i = t.items.findIndex((it) => !sv[it[0]]);
        if (i < 0) i = 0;
      }
      return this.renderItem(el, t, Math.max(0, Math.min(i, t.items.length - 1)));
    }
    this.renderHub(el, t);
  },

  // ===================== Danh sách chủ đề =====================
  renderList(el) {
    const esc = App.ui.esc;
    const card = (t) => {
      const a = this.termStats(t);
      const b = this.collocStats(t);
      const total = a.total + b.total;
      const done = a.done + b.learned;
      const parts = [];
      if (a.total) parts.push(`${a.total} từ khoá`);
      if (b.total) parts.push(`${b.total} collocation`);
      return `<a class="card topic-card" href="#topics/${t.id}">
        <div class="topic-icon">${t.icon}</div>
        <h3>${esc(t.name)}</h3>
        <p class="small muted">${esc(t.vi)}</p>
        ${this.bar(total ? (done / total) * 100 : 0)}
        <p class="small muted" style="margin:0">${parts.join(' · ')}</p>
      </a>`;
    };
    const topics = App.data.topics.filter((t) => t.group !== 'skill');
    const skills = App.data.topics.filter((t) => t.group === 'skill');
    el.innerHTML = `
      <section class="card">
        <h1 class="gradient-text">Học theo chủ đề</h1>
        <p class="muted" style="margin-bottom:.4rem">Mỗi chủ đề có 3 cách học, đều là <b>tự điền</b>:</p>
        <ul class="small" style="margin:0;padding-left:1.2rem">
          <li>📝 <b>Từ khoá</b>: tự viết cách gọi khác (paraphrase) và collocation cho từ khoá của chủ đề.</li>
          <li>🧩 <b>Điền collocation</b>: điền cụm từ vào câu ví dụ (${App.data.collocs.length} cụm từ bộ <i>English Collocations in Use</i>).</li>
          <li>📖 <b>Danh sách</b>: đọc trước các collocation kèm nghĩa và ví dụ.</li>
        </ul>
      </section>
      <h2>Chủ đề IELTS <span class="muted small">(${topics.length})</span></h2>
      <div class="grid topic-grid">${topics.map(card).join('')}</div>
      <h2>Collocation theo chức năng <span class="muted small">(${skills.length}, dùng được cho mọi đề)</span></h2>
      <div class="grid topic-grid">${skills.map(card).join('')}</div>`;
  },

  // ===================== Trang một chủ đề =====================
  renderHub(el, t) {
    const esc = App.ui.esc;
    const a = this.termStats(t);
    const b = this.collocStats(t);
    const units = (t.units || '').split(' ').filter(Boolean);
    el.innerHTML = `
      <section class="card">
        <a href="#topics" class="small">← Tất cả chủ đề</a>
        <h1 style="margin-top:.4rem">${t.icon} ${esc(t.name)}</h1>
        <p class="muted" style="margin:0">${esc(t.vi)}</p>
      </section>
      <div class="grid">
        ${a.total ? `<div class="card mode-card">
          <h3>📝 Từ khoá & paraphrase</h3>
          <p class="small muted">${a.total} từ khoá. Với mỗi từ, tự viết các cách gọi khác và collocation đi kèm.</p>
          ${this.bar((a.done / a.total) * 100)}
          <p class="small muted">Đã làm ${a.done}/${a.total}${a.done ? ` · trung bình ${a.pct}%` : ''}</p>
          <div class="row">
            <a class="btn primary" href="#topics/${t.id}/terms">${a.done && a.done < a.total ? 'Làm tiếp' : 'Bắt đầu'}</a>
            ${a.done ? `<a class="btn" href="#topics/${t.id}/terms/done">Kết quả</a>` : ''}
          </div>
        </div>` : ''}
        ${b.total ? `<div class="card mode-card">
          <h3>🧩 Điền collocation</h3>
          <p class="small muted">${b.total} cụm. Đọc nghĩa tiếng Việt, tự gõ cụm từ còn thiếu trong câu ví dụ. 10 câu mỗi lượt.</p>
          ${this.bar((b.learned / b.total) * 100, 'var(--ok)')}
          <p class="small muted">Đã thuộc ${b.learned}/${b.total} · đã gặp ${b.seen}</p>
          <div class="row"><a class="btn primary" href="#topics/${t.id}/colloc">Luyện 10 câu</a></div>
        </div>
        <div class="card mode-card">
          <h3>📖 Danh sách collocation</h3>
          <p class="small muted">Đọc trước toàn bộ ${b.total} cụm kèm nghĩa, ví dụ và các biến thể.</p>
          <div class="row"><a class="btn" href="#topics/${t.id}/list">Xem danh sách</a></div>
        </div>` : ''}
      </div>
      ${units.length ? `<p class="small muted">Nguồn collocation: <i>English Collocations in Use</i>: ${units.map((u) => esc(this.unitName(u))).join(' / ')}</p>` : ''}`;
  },

  // ===================== 📝 Một từ khoá =====================
  // Collocation trong sách có chứa từ khoá → chấm thêm (điểm cộng, không tính vào %)
  bookColls(t, it) {
    const k = this.key(it.term);
    const sig = (x) => this.key(x).sort().join(' ');
    const own = it.colls.map((c) => sig(c.replace(/~/g, it.term)));
    const out = [];
    this.collocsOf(t).forEach((r) => {
      [r[1], ...r[5].split('·')].map((s) => s.trim()).filter(Boolean).forEach((s) => {
        const sk = this.key(s);
        if (k.every((x) => sk.includes(x)) && !out.includes(s) && !own.includes(sig(s))) out.push(s);
      });
    });
    return out;
  },

  renderItem(el, t, i) {
    const esc = App.ui.esc;
    const it = this.parse(t.items[i]);
    const book = this.bookColls(t, it);
    const sv = this.saved(t.id);
    const last = sv[it.term];
    const n = t.items.length;

    el.innerHTML = `
      <section class="card">
        <div class="row spread">
          <a href="#topics/${t.id}" class="small">← ${t.icon} ${esc(t.name)}</a>
          <span class="small muted">📝 Từ khoá ${i + 1}/${n}</span>
        </div>
        ${this.bar(((i + 1) / n) * 100)}
        <div class="term-nav">
          ${t.items.map((x, j) => {
            const s = sv[x[0]];
            const cls = j === i ? 'cur' : s ? (s.pct >= 60 ? 'ok' : 'low') : '';
            return `<a class="chip ${cls}" href="#topics/${t.id}/terms/${j}">${esc(x[0])}</a>`;
          }).join('')}
        </div>
      </section>

      <section class="card">
        <div class="term-head">
          <div>
            <h1 class="term">${esc(it.term)}</h1>
            <span class="muted">${esc(it.vi)}</span>
          </div>
          <button class="ghost small" id="speak" title="Nghe phát âm">🔊</button>
        </div>
        ${last ? `<p class="small muted">Lần trước (${esc(last.date)}): ${last.pct}%</p>` : ''}

        <div class="stack">
          <div>
            <label for="para">① Cách gọi khác / paraphrase <span class="muted small">(đáp án mẫu có ${it.paras.length} cách)</span></label>
            <textarea id="para" placeholder="vd: …, …, …" style="min-height:80px"></textarea>
            <div class="hint small" id="hint-para" hidden></div>
            <div id="res-para"></div>
          </div>
          <div>
            <label for="coll">② Collocation & động từ đi kèm <span class="muted small">(đáp án mẫu có ${it.colls.length} cụm${book.length ? ` + ${book.length} cụm trong sách` : ''})</span></label>
            <textarea id="coll" placeholder="vd: … ${esc(it.term)}, ${esc(it.term)} …, …" style="min-height:80px"></textarea>
            <div class="hint small" id="hint-coll" hidden></div>
            <div id="res-coll"></div>
          </div>
        </div>
        <div id="score"></div>
        <div class="row" style="margin-top:1rem">
          <button class="primary" id="check">Kiểm tra</button>
          <button id="hint">💡 Gợi ý</button>
        </div>
        <div class="row spread" style="margin-top:.8rem">
          ${i > 0 ? `<a class="btn ghost" href="#topics/${t.id}/terms/${i - 1}">◀ Từ trước</a>` : '<span></span>'}
          <a class="btn ghost" id="next" href="#topics/${t.id}/terms/${i + 1 < n ? i + 1 : 'done'}">${i + 1 < n ? 'Từ tiếp ▶' : 'Xem tổng kết ▶'}</a>
        </div>
      </section>`;

    const termKey = this.key(it.term);
    const $ = (s) => el.querySelector(s);

    $('#speak').addEventListener('click', () => this.say(it.term));

    $('#hint').addEventListener('click', () => {
      const mask = (s) => s.replace(/[A-Za-z]+/g, (w) => w[0] + '_'.repeat(w.length - 1));
      $('#hint-para').innerHTML = 'Gợi ý chữ cái đầu: ' + it.paras.map((p) => `<span class="chip">${esc(mask(p))}</span>`).join('');
      $('#hint-coll').innerHTML = 'Gợi ý (~ = từ khoá): ' + it.colls.map((p) => `<span class="chip">${esc(mask(p))}</span>`).join('');
      $('#hint-para').hidden = false;
      $('#hint-coll').hidden = false;
    });

    const check = () => {
      const p = this.grade($('#para').value, it.paras, termKey, false);
      const c = this.grade($('#coll').value, it.colls.concat(book), termKey, true);
      const cMain = c.refs.slice(0, it.colls.length);
      const cBook = c.refs.slice(it.colls.length);
      const pGot = p.refs.filter((r) => r.hit).length;
      const cGot = cMain.filter((r) => r.hit).length;
      // Điểm cộng: mỗi cụm bạn viết chỉ tính 1 lần, và chỉ khi nó không trùng đáp án mẫu
      const bGot = c.users.filter((u) => u.hits.length && u.hits.every((h) => h >= it.colls.length)).length;
      $('#res-para').innerHTML = this.renderResult('Đáp án mẫu', p.refs, p.extras, it.term, false);
      $('#res-coll').innerHTML = this.renderResult('Đáp án mẫu', cMain, c.extras, it.term, true)
        + (cBook.length ? this.renderResult('Trong sách <i>Collocations in Use</i> (điểm cộng)',
          cBook.filter((r) => r.hit).concat(cBook.filter((r) => !r.hit)).slice(0, Math.max(12, cBook.filter((r) => r.hit).length)), [], it.term, true)
          + (cBook.length > 12 ? `<p class="small muted" style="margin:.3rem 0 0">Sách còn nhiều cụm khác: xem trong <a href="#topics/${t.id}/list">📖 Danh sách</a>.</p>` : '') : '');
      $('#hint-para').hidden = true;
      $('#hint-coll').hidden = true;
      const pct = Math.min(100, Math.round(((pGot + cGot + bGot) / (it.paras.length + it.colls.length)) * 100));
      $('#score').innerHTML = `
        <div class="${pct >= 60 ? 'good' : 'info'}" style="margin-top:1rem">
          <b>${pct}%</b>: bạn nghĩ ra ${pGot}/${it.paras.length} cách gọi khác và ${cGot}/${it.colls.length} collocation${bGot ? ` (+${bGot} cụm trong sách)` : ''}.
          ${pct >= 60 ? 'Rất tốt! 👏' : 'Đọc to các cụm còn thiếu 2–3 lần rồi bấm “Làm lại”.'}
        </div>
        ${it.note ? `<p class="note small" style="margin-top:.8rem">⚠️ ${esc(it.note)}</p>` : ''}`;
      sv[it.term] = { pct, date: App.ui.today() };
      App.store.save();
      App.store.logActivity('topics');
      $('#check').textContent = 'Kiểm tra lại';
      if (!$('#again')) {
        const again = document.createElement('button');
        again.id = 'again';
        again.textContent = '↺ Làm lại';
        again.addEventListener('click', () => this.renderItem(el, t, i));
        $('#check').after(again);
      }
      $('#next').classList.replace('ghost', 'primary');
    };
    $('#check').addEventListener('click', check);
    el.querySelectorAll('textarea').forEach((ta) => ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) check();
    }));
  },

  // Hiện đáp án: ✓ xanh = bạn đã nghĩ ra, nét đứt = chưa nghĩ ra, vàng = ngoài đáp án mẫu
  renderResult(title, refs, extras, term, isColl) {
    const esc = App.ui.esc;
    const show = (s) => (isColl && s.includes('~')
      ? s.split('~').map((part) => `<b>${esc(part)}</b>`).join(`<span class="muted">${esc(term)}</span>`)
      : esc(s));
    const got = refs.filter((r) => r.hit).length;
    return `<div class="result">
      <div class="small muted">${title} (${got}/${refs.length}):</div>
      <div>${refs.map((x) => `<span class="chip ${x.hit ? 'hit' : 'miss'}">${x.hit ? '✓ ' : ''}${show(x.text)}</span>`).join('')}</div>
      ${extras.length ? `<div class="small muted" style="margin-top:.4rem">Ngoài đáp án mẫu (có thể vẫn đúng, hãy kiểm tra trên ozdic.com hoặc Oxford Collocations):</div>
        <div>${extras.map((x) => `<span class="chip extra">? ${esc(x)}</span>`).join('')}</div>` : ''}
    </div>`;
  },

  renderSummary(el, t) {
    const esc = App.ui.esc;
    const sv = this.saved(t.id);
    const st = this.termStats(t);
    el.innerHTML = `
      <section class="card">
        <a href="#topics/${t.id}" class="small">← ${t.icon} ${esc(t.name)}</a>
        <h1>📝 Từ khoá: tổng kết</h1>
        <div class="big-score">${st.pct}%</div>
        <p class="muted" style="text-align:center">Đã làm ${st.done}/${st.total} từ</p>
        ${t.items.map((x, j) => {
          const s = sv[x[0]];
          return `<div class="meter"><a class="small label" href="#topics/${t.id}/terms/${j}">${esc(x[0])}</a>
            <div class="bar"><div style="width:${s ? s.pct : 0}%;background:${s && s.pct >= 60 ? 'var(--ok)' : 'var(--warn)'}"></div></div>
            <span class="small val">${s ? s.pct + '%' : '—'}</span></div>`;
        }).join('')}
        <p class="small muted">Bấm vào một từ để làm lại. Từ dưới 60% nên ôn lại vào ngày mai.</p>
        <div class="row">
          ${this.collocsOf(t).length ? `<a class="btn primary" href="#topics/${t.id}/colloc">🧩 Sang phần điền collocation ▶</a>` : ''}
          <a class="btn" href="#topics">Danh sách chủ đề</a>
        </div>
      </section>`;
  },

  // ===================== 🧩 Điền collocation =====================
  // Chọn 10 câu: ưu tiên câu lần trước làm sai, rồi câu chưa gặp, rồi câu đã thuộc lâu nhất
  pick(t, n = 10) {
    const C = App.store.state.colloc;
    const rank = (r) => {
      const s = C[r[1]];
      if (!s) return 1;
      if (!s.lastOk) return 0;
      return 2 + s.ok;
    };
    const list = App.ui.shuffle(this.collocsOf(t).slice());
    list.sort((a, b) => rank(a) - rank(b) || ((C[a[1]] || {}).last || '').localeCompare((C[b[1]] || {}).last || ''));
    return App.ui.shuffle(list.slice(0, n));
  },

  startColloc(el, t) {
    this.session = { t, list: this.pick(t), i: 0, results: [] };
    this.renderCloze(el);
  },

  // Đọc to bằng giọng Anh–Anh của trình duyệt
  say(text) {
    if (!('speechSynthesis' in window)) return App.ui.toast('Trình duyệt không hỗ trợ đọc');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB';
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  },

  // Bỏ mã HTML (&amp; …) để so sánh và để đọc to
  plain(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent;
  },

  norm(s) {
    return String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[.,!?;:"]+$/g, '').replace(/\s+/g, ' ').trim();
  },

  renderCloze(el) {
    const esc = App.ui.esc;
    const S = this.session;
    const t = S.t;
    if (S.i >= S.list.length) return this.renderClozeSummary(el);
    const [unit, colloc, meaning, ex, exVi, variants] = S.list[S.i];
    // Câu ví dụ: phần <b>…</b> là chỗ cần điền
    const pieces = ex.split(/<b>([\s\S]*?)<\/b>/);
    const answers = pieces.filter((_, k) => k % 2 === 1).map((h) => this.plain(h));
    let g = 0;
    const sentence = pieces.map((p, k) => {
      if (k % 2 === 0) return p;
      const a = answers[g];
      return `<input class="gap" data-g="${g++}" autocomplete="off" autocapitalize="off" spellcheck="false" style="width:calc(${Math.max(a.length, 4) + 1}ch + 1.2rem)" aria-label="Chỗ trống">`;
    }).join('');

    el.innerHTML = `
      <section class="card">
        <div class="row spread">
          <a href="#topics/${t.id}" class="small">← ${t.icon} ${esc(t.name)}</a>
          <span class="small muted">🧩 Câu ${S.i + 1}/${S.list.length}</span>
        </div>
        ${this.bar((S.i / S.list.length) * 100)}
        <p class="small muted" style="margin:0">${esc(this.unitName(unit))}</p>
        <h2 class="meaning">${esc(meaning)}</h2>
        <p class="cloze">${sentence}</p>
        <p class="small muted">🇻🇳 ${esc(exVi)}</p>
        <div id="fb"></div>
        <div class="row" style="margin-top:1rem" id="actions">
          <button class="primary" id="check">Kiểm tra</button>
          <button id="hint">💡 Gợi ý</button>
          <button class="ghost" id="skip">Không biết</button>
        </div>
      </section>`;

    const $ = (s) => el.querySelector(s);
    const inputs = [...el.querySelectorAll('input.gap')];
    inputs[0].focus();
    let done = false;

    $('#hint').addEventListener('click', () => {
      inputs.forEach((inp, k) => {
        inp.placeholder = answers[k].replace(/[A-Za-z]+/g, (w) => w[0] + '_'.repeat(w.length - 1));
      });
    });

    const finish = (gaveUp) => {
      if (done) return;
      done = true;
      let allOk = !gaveUp;
      inputs.forEach((inp, k) => {
        const ok = !gaveUp && this.norm(inp.value) === this.norm(answers[k]);
        if (!ok) allOk = false;
        inp.classList.add(ok ? 'ok' : 'bad');
        inp.readOnly = true;
        if (!ok) inp.insertAdjacentHTML('afterend', `<span class="fix">${esc(answers[k])}</span>`);
      });
      S.results.push({ row: S.list[S.i], ok: allOk });
      App.store.recordColloc(colloc, allOk);
      App.store.logActivity('colloc');
      $('#fb').innerHTML = `
        <div class="${allOk ? 'good' : 'bad'}">
          ${allOk ? '✓ Chính xác!' : '✕ Chưa đúng.'} <b>${esc(colloc)}</b>: ${esc(meaning)}
          ${variants ? `<div class="small" style="margin-top:.4rem">Mở rộng: ${variants.split(' · ').map((v) => `<span class="chip">${esc(v)}</span>`).join('')}</div>` : ''}
        </div>`;
      $('#actions').innerHTML = `
        <button class="primary" id="next">${S.i + 1 < S.list.length ? 'Câu tiếp ▶' : 'Xem kết quả ▶'}</button>
        <button id="say">🔊 Nghe cả câu</button>`;
      $('#say').addEventListener('click', () => this.say(this.plain(ex)));
      $('#next').addEventListener('click', next);
      $('#next').focus();
    };
    const next = () => { S.i++; this.renderCloze(el); window.scrollTo(0, 0); };

    $('#check').addEventListener('click', () => finish(false));
    $('#skip').addEventListener('click', () => finish(true));
    inputs.forEach((inp, k) => inp.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (done) return next();
      if (k + 1 < inputs.length && !inputs[k + 1].value) inputs[k + 1].focus();
      else finish(false);
    }));
  },

  renderClozeSummary(el) {
    const esc = App.ui.esc;
    const S = this.session;
    const t = S.t;
    const ok = S.results.filter((r) => r.ok).length;
    const b = this.collocStats(t);
    el.innerHTML = `
      <section class="card">
        <a href="#topics/${t.id}" class="small">← ${t.icon} ${esc(t.name)}</a>
        <h1>🧩 Kết quả</h1>
        <div class="big-score">${ok}/${S.results.length}</div>
        <p class="muted" style="text-align:center">Chủ đề này: đã thuộc ${b.learned}/${b.total} collocation</p>
        <div class="stack">
          ${S.results.map((r) => `<div class="cl-row">
            <span class="mark ${r.ok ? 'ok' : 'bad'}">${r.ok ? '✓' : '✕'}</span>
            <div><b>${esc(r.row[1])}</b> <span class="muted">· ${esc(r.row[2])}</span></div>
          </div>`).join('')}
        </div>
        <p class="small muted">Câu sai sẽ được hỏi lại ở lượt sau.</p>
        <div class="row">
          <button class="primary" id="more">Luyện 10 câu nữa</button>
          <a class="btn" href="#topics/${t.id}">Về chủ đề</a>
        </div>
      </section>`;
    el.querySelector('#more').addEventListener('click', () => { this.startColloc(el, t); window.scrollTo(0, 0); });
  },

  // ===================== 📖 Danh sách collocation =====================
  renderBrowse(el, t) {
    const esc = App.ui.esc;
    const C = App.store.state.colloc;
    const byUnit = {};
    this.collocsOf(t).forEach((r) => (byUnit[r[0]] = byUnit[r[0]] || []).push(r));
    el.innerHTML = `
      <section class="card">
        <div class="row spread">
          <a href="#topics/${t.id}" class="small">← ${t.icon} ${esc(t.name)}</a>
          <a class="btn primary small" href="#topics/${t.id}/colloc">🧩 Luyện 10 câu</a>
        </div>
        <h1 style="margin-top:.4rem">📖 ${esc(t.name)}</h1>
        <input type="search" id="q" placeholder="Tìm collocation hoặc nghĩa…">
      </section>
      <div id="units">
        ${Object.keys(byUnit).map((u) => `<section class="card unit-block">
          <h3>${esc(this.unitName(u))}</h3>
          ${byUnit[u].map((r) => {
            const s = C[r[1]];
            return `<div class="cl-row" data-q="${esc((r[1] + ' ' + r[2] + ' ' + r[5]).toLowerCase())}">
              <span class="mark ${s ? (s.lastOk ? 'ok' : 'bad') : ''}">${s ? (s.lastOk ? '✓' : '✕') : '·'}</span>
              <div>
                <b>${esc(r[1])}</b> <button class="ghost tiny" data-say="${esc(r[1])}" title="Nghe">🔊</button>
                <span class="muted">· ${esc(r[2])}</span>
                <div class="small ex">${r[3]}</div>
                ${r[5] ? `<div class="small muted">${esc(r[5])}</div>` : ''}
              </div>
            </div>`;
          }).join('')}
        </section>`).join('')}
      </div>`;
    el.querySelectorAll('[data-say]').forEach((bt) => bt.addEventListener('click', () => this.say(bt.dataset.say)));
    el.querySelector('#q').addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      el.querySelectorAll('.unit-block').forEach((blk) => {
        let any = false;
        blk.querySelectorAll('.cl-row').forEach((row) => {
          const show = !q || row.dataset.q.includes(q);
          row.hidden = !show;
          if (show) any = true;
        });
        blk.hidden = !any;
      });
    });
  },
};
