// Trang Chủ đề: chọn 1 trong 16 chủ đề → với từng từ khoá, tự điền
//   ① cách gọi khác (paraphrase)   ② collocation / động từ đi kèm
// rồi bấm Kiểm tra để so với đáp án mẫu trong js/data/topics.js.
App.views.topics = {
  // Từ chức năng: bỏ qua khi so sánh (the, of, these…)
  STOP: new Set(('a an the this these that those such their its our his her my your them they it ' +
    'and or of to in on at for with by from into is are was were be been being has have had s').split(' ')),

  // Rút gọn từ để "improving / improved / improve" hay "cities / city" được coi là một
  stem(w) {
    if (w.length > 4 && w.endsWith('ies')) w = w.slice(0, -3) + 'y';
    else if (/(sh|ch|x|ss)es$/.test(w)) w = w.slice(0, -2);
    else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
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
    const users = this.split(userText).map((t) => ({ text: t, k: this.key(t, remove), hit: false }))
      .filter((u) => u.k.length && !(!isColl && u.k.every((x) => termKey.includes(x)))); // bỏ qua nếu chỉ chép lại từ khoá
    const res = refs.map((r) => {
      const plain = isColl ? r.replace(/~/g, ' ') : r;
      const k = this.key(plain, remove);
      // "buses and metro lines": chỉ viết "buses" cũng tính là đúng
      const parts = plain.includes(',') || / and /.test(plain)
        ? plain.split(/,| and /).map((x) => this.key(x, remove)).filter((x) => x.length) : [];
      let hit = false;
      users.forEach((u) => {
        if (this.same(u.k, k) || parts.some((pk) => this.same(u.k, pk) && this.same(pk, u.k))) { hit = true; u.hit = true; }
      });
      return { text: r, hit };
    });
    return { refs: res, extras: users.filter((u) => !u.hit).map((u) => u.text), got: res.filter((r) => r.hit).length, total: res.length };
  },

  parse(item) {
    const [term, vi, paras, colls, note] = item;
    const list = (s) => s.split('|').map((x) => x.trim()).filter(Boolean);
    return { term, vi, paras: list(paras), colls: list(colls), note };
  },

  saved(tid) {
    const S = App.store.state;
    return S.topics[tid] || (S.topics[tid] = {});
  },

  topicStats(t) {
    const sv = App.store.state.topics[t.id] || {};
    const done = t.items.filter((it) => sv[it[0]]);
    const pct = done.length ? Math.round(done.reduce((a, it) => a + sv[it[0]].pct, 0) / done.length) : 0;
    return { done: done.length, total: t.items.length, pct };
  },

  render(el, args) {
    this.el = el;
    const t = App.data.topics.find((x) => x.id === args[0]);
    if (!t) return this.renderList(el);
    if (args[1] === 'done') return this.renderSummary(el, t);
    let i = parseInt(args[1], 10);
    if (isNaN(i)) {
      const sv = App.store.state.topics[t.id] || {};
      i = t.items.findIndex((it) => !sv[it[0]]);
      if (i < 0) i = 0;
    }
    this.renderItem(el, t, Math.max(0, Math.min(i, t.items.length - 1)));
  },

  // ----- Danh sách 16 chủ đề -----
  renderList(el) {
    const esc = App.ui.esc;
    el.innerHTML = `
      <section class="card">
        <h1 class="gradient-text">Từ vựng theo chủ đề</h1>
        <p class="muted">Chọn một chủ đề. Với mỗi từ khoá, bạn tự điền:</p>
        <ol class="small" style="margin:.2rem 0 0;padding-left:1.2rem">
          <li><b>Cách gọi khác</b> để thay thế khi viết: từ đồng nghĩa, từ tổng quát/cụ thể, gọi theo vai trò, cụm tham chiếu (<i>this service, these networks</i>).</li>
          <li><b>Collocation & động từ đi kèm</b>: <i>improve public transport, affordable housing…</i></li>
        </ol>
        <p class="small muted" style="margin-bottom:0">Cách nhau bằng dấu phẩy. Bấm <b>Kiểm tra</b> để so với đáp án mẫu (tiếng Anh – Anh).</p>
      </section>
      <div class="grid topic-grid">
        ${App.data.topics.map((t) => {
          const st = this.topicStats(t);
          return `<a class="card topic-card" href="#topics/${t.id}">
            <div class="topic-icon">${t.icon}</div>
            <h3>${esc(t.name)}</h3>
            <p class="small muted">${esc(t.vi)}</p>
            <div class="progress"><div style="width:${(st.done / st.total) * 100}%"></div></div>
            <p class="small muted" style="margin:0">${st.done}/${st.total} từ${st.done ? ` · trung bình ${st.pct}%` : ''}</p>
          </a>`;
        }).join('')}
      </div>`;
  },

  // ----- Một từ khoá -----
  renderItem(el, t, i) {
    const esc = App.ui.esc;
    const it = this.parse(t.items[i]);
    const sv = this.saved(t.id);
    const last = sv[it.term];
    const n = t.items.length;

    el.innerHTML = `
      <section class="card">
        <div class="row spread">
          <a href="#topics" class="small">← 16 chủ đề</a>
          <span class="small muted">${t.icon} ${esc(t.name)} · ${i + 1}/${n}</span>
        </div>
        <div class="progress"><div style="width:${((i + 1) / n) * 100}%"></div></div>
        <div class="term-nav">
          ${t.items.map((x, j) => {
            const s = sv[x[0]];
            const cls = j === i ? 'cur' : s ? (s.pct >= 60 ? 'ok' : 'low') : '';
            return `<a class="chip ${cls}" href="#topics/${t.id}/${j}">${esc(x[0])}</a>`;
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
            <label for="coll">② Collocation & động từ đi kèm <span class="muted small">(đáp án mẫu có ${it.colls.length} cụm)</span></label>
            <textarea id="coll" placeholder="vd: ${esc(this.example(it))}" style="min-height:80px"></textarea>
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
          ${i > 0 ? `<a class="btn ghost" href="#topics/${t.id}/${i - 1}">◀ Từ trước</a>` : '<span></span>'}
          <a class="btn ghost" id="next" href="#topics/${t.id}/${i + 1 < n ? i + 1 : 'done'}">${i + 1 < n ? 'Từ tiếp ▶' : 'Xem tổng kết ▶'}</a>
        </div>
      </section>`;

    const termKey = this.key(it.term);
    const $ = (s) => el.querySelector(s);

    $('#speak').addEventListener('click', () => {
      if (!('speechSynthesis' in window)) return App.ui.toast('Trình duyệt không hỗ trợ đọc');
      const u = new SpeechSynthesisUtterance(it.term);
      u.lang = 'en-GB';
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    });

    $('#hint').addEventListener('click', () => {
      const mask = (s) => s.replace(/[A-Za-z]+/g, (w) => w[0] + '_'.repeat(w.length - 1));
      $('#hint-para').innerHTML = 'Gợi ý chữ cái đầu: ' + it.paras.map((p) => `<span class="chip">${esc(mask(p))}</span>`).join('');
      $('#hint-coll').innerHTML = 'Gợi ý (~ = từ khoá): ' + it.colls.map((p) => `<span class="chip">${esc(mask(p))}</span>`).join('');
      $('#hint-para').hidden = false;
      $('#hint-coll').hidden = false;
    });

    const check = () => {
      const p = this.grade($('#para').value, it.paras, termKey, false);
      const c = this.grade($('#coll').value, it.colls, termKey, true);
      $('#res-para').innerHTML = this.renderResult(p, it.term, false);
      $('#res-coll').innerHTML = this.renderResult(c, it.term, true);
      $('#hint-para').hidden = true;
      $('#hint-coll').hidden = true;
      const pct = Math.round(((p.got + c.got) / (p.total + c.total)) * 100);
      $('#score').innerHTML = `
        <div class="${pct >= 60 ? 'good' : 'info'}" style="margin-top:1rem">
          <b>${pct}%</b>: bạn nghĩ ra ${p.got}/${p.total} cách gọi khác và ${c.got}/${c.total} collocation.
          ${pct >= 60 ? 'Rất tốt! 👏' : 'Đọc to các cụm còn thiếu 2–3 lần rồi bấm “Làm lại”.'}
        </div>
        ${it.note ? `<p class="note small" style="margin-top:.8rem">⚠️ ${esc(it.note)}</p>` : ''}`;
      sv[it.term] = { pct, para: $('#para').value, coll: $('#coll').value, date: App.ui.today() };
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

  // Ví dụ gợi ý cách viết trong ô collocation
  example(it) {
    return `… ${it.term}, ${it.term} …, …`;
  },

  // Hiện đáp án: ✓ xanh = bạn đã nghĩ ra, nét đứt = chưa nghĩ ra, vàng = ngoài đáp án mẫu
  renderResult(r, term, isColl) {
    const esc = App.ui.esc;
    const show = (s) => (isColl && s.includes('~')
      ? s.split('~').map((part) => `<b>${esc(part)}</b>`).join(`<span class="muted">${esc(term)}</span>`)
      : esc(s));
    return `<div class="result">
      <div class="small muted">Đáp án mẫu (${r.got}/${r.total}):</div>
      <div>${r.refs.map((x) => `<span class="chip ${x.hit ? 'hit' : 'miss'}">${x.hit ? '✓ ' : ''}${show(x.text)}</span>`).join('')}</div>
      ${r.extras.length ? `<div class="small muted" style="margin-top:.4rem">Ngoài đáp án mẫu (có thể vẫn đúng, hãy kiểm tra trên ozdic.com hoặc Oxford Collocations):</div>
        <div>${r.extras.map((x) => `<span class="chip extra">? ${esc(x)}</span>`).join('')}</div>` : ''}
    </div>`;
  },

  // ----- Tổng kết chủ đề -----
  renderSummary(el, t) {
    const esc = App.ui.esc;
    const sv = this.saved(t.id);
    const st = this.topicStats(t);
    const idx = App.data.topics.indexOf(t);
    const nextT = App.data.topics[(idx + 1) % App.data.topics.length];
    el.innerHTML = `
      <section class="card">
        <a href="#topics" class="small">← 16 chủ đề</a>
        <h1>${t.icon} ${esc(t.name)}: tổng kết</h1>
        <div class="big-score">${st.pct}%</div>
        <p class="muted" style="text-align:center">Đã làm ${st.done}/${st.total} từ</p>
        ${t.items.map((x, j) => {
          const s = sv[x[0]];
          return `<div class="meter"><a class="small label" href="#topics/${t.id}/${j}">${esc(x[0])}</a>
            <div class="bar"><div style="width:${s ? s.pct : 0}%;background:${s && s.pct >= 60 ? 'var(--ok)' : 'var(--warn)'}"></div></div>
            <span class="small val">${s ? s.pct + '%' : '—'}</span></div>`;
        }).join('')}
        <p class="small muted">Bấm vào một từ để làm lại. Từ dưới 60% nên ôn lại vào ngày mai.</p>
        <div class="row">
          <a class="btn primary" href="#topics/${nextT.id}">Chủ đề tiếp: ${nextT.icon} ${esc(nextT.name)} ▶</a>
          <a class="btn" href="#topics">Danh sách chủ đề</a>
        </div>
      </section>`;
  },
};
