// Trang luyện tập: trắc nghiệm, điền từ, chọn chuỗi tham chiếu
App.views.drills = {
  session: null,

  render(el, args) {
    this.el = el;
    if (args[0]) this.start(args[0]);
    else this.renderMenu();
  },

  renderMenu() {
    const S = App.store.state;
    const mistakes = Object.keys(S.drillMistakes).filter((id) => App.data.drills.some((d) => d.id === id));
    this.el.innerHTML = `
      <section class="card">
        <h1>Luyện tập kỹ thuật</h1>
        <p class="muted">Mỗi lượt 10 câu, có giải thích ngay sau khi trả lời.</p>
      </section>
      <div class="grid">
        ${App.data.drillGroups.map((g) => {
          const n = g.id === 'all' ? App.data.drills.length : App.data.drills.filter((d) => d.tech === g.id).length;
          const st = S.drillStats[g.id];
          const acc = st && st.total ? Math.round((st.correct / st.total) * 100) + '% đúng' : 'Chưa làm';
          return `<div class="card">
            <h3>${g.name}</h3>
            <p class="small muted">${n} câu · ${g.id === 'all' ? '' : acc}</p>
            <a class="btn primary" href="#drills/${g.id}">Bắt đầu</a>
          </div>`;
        }).join('')}
        <div class="card">
          <h3>🔁 Làm lại câu sai</h3>
          <p class="small muted">${mistakes.length} câu từng làm sai</p>
          ${mistakes.length ? '<a class="btn primary" href="#drills/mistakes">Bắt đầu</a>' : '<button disabled>Chưa có</button>'}
        </div>
      </div>`;
  },

  start(group) {
    const all = App.data.drills;
    let pool;
    if (group === 'all') pool = all;
    else if (group === 'mistakes') pool = all.filter((d) => App.store.state.drillMistakes[d.id]);
    else pool = all.filter((d) => d.tech === group);
    if (!pool.length) { location.hash = '#drills'; return; }
    this.session = { group, items: App.ui.shuffle(pool).slice(0, 10), index: 0, score: 0 };
    this.renderQuestion();
  },

  renderQuestion() {
    const s = this.session;
    if (s.index >= s.items.length) return this.renderSummary();
    const d = s.items[s.index];
    const esc = App.ui.esc;
    let body = '';

    if (d.type === 'mcq') {
      // Xáo trộn đáp án, nhớ vị trí đáp án đúng
      const order = App.ui.shuffle(d.options.map((_, i) => i));
      body = `<div class="options">${order.map((i) => `<button data-opt="${i}">${esc(d.options[i])}</button>`).join('')}</div>`;
    } else if (d.type === 'type') {
      body = `<div class="row"><input type="text" id="typeAns" placeholder="Gõ đáp án… (${esc(d.hint)})" autocomplete="off" style="flex:1">
              <button class="primary" id="checkBtn">Kiểm tra</button></div>`;
    } else if (d.type === 'ref') {
      let k = 0;
      const passage = esc(d.passage).replace(/\{\{([+-])(.+?)\}\}/g, (_, sign, phrase) =>
        `<button class="cand" data-k="${k++}" data-ok="${sign === '+'}">${phrase}</button>`);
      body = `<p class="passage">${passage}</p><button class="primary" id="checkBtn">Kiểm tra</button>`;
    }

    this.el.innerHTML = `
      <section class="card">
        <div class="row spread"><span class="tag">${d.tech === 'caution' ? '⚠️ Collocation & từ khoá' : App.ui.techName(d.tech)}</span>
          <span class="muted small">Câu ${s.index + 1}/${s.items.length} · Đúng ${s.score}</span></div>
        <div class="progress"><div style="width:${(s.index / s.items.length) * 100}%"></div></div>
        <p class="question">${esc(d.q)}</p>
        ${d.sentence ? `<div class="sentence">${esc(d.sentence).replace('___', `<b>___</b>${d.hint ? ` <span class="muted">(${esc(d.hint)})</span>` : ''}`)}</div>` : ''}
        ${body}
        <div id="feedback"></div>
      </section>
      <a href="#drills" class="small">← Về danh sách bài</a>`;

    this.bind(d);
  },

  bind(d) {
    const el = this.el;
    if (d.type === 'mcq') {
      el.querySelectorAll('[data-opt]').forEach((btn) => btn.addEventListener('click', () => {
        const chosen = Number(btn.dataset.opt);
        el.querySelectorAll('[data-opt]').forEach((b) => {
          b.disabled = true;
          if (Number(b.dataset.opt) === d.answer) b.classList.add('correct');
        });
        if (chosen !== d.answer) btn.classList.add('wrong');
        this.finish(d, chosen === d.answer);
      }));
    } else if (d.type === 'type') {
      const input = el.querySelector('#typeAns');
      input.focus();
      const check = () => {
        const val = input.value.trim().toLowerCase();
        if (!val) return;
        input.disabled = true;
        el.querySelector('#checkBtn').disabled = true;
        const ok = d.answers.includes(val);
        this.finish(d, ok, ok ? '' : `Đáp án: <b>${App.ui.esc(d.answers[0])}</b>`);
      };
      el.querySelector('#checkBtn').addEventListener('click', check);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
    } else if (d.type === 'ref') {
      const cands = el.querySelectorAll('.cand');
      cands.forEach((c) => c.addEventListener('click', () => c.classList.toggle('sel')));
      el.querySelector('#checkBtn').addEventListener('click', (e) => {
        let ok = true;
        cands.forEach((c) => {
          const should = c.dataset.ok === 'true';
          const sel = c.classList.contains('sel');
          c.disabled = true;
          c.classList.remove('sel');
          if (should && sel) c.classList.add('ok');
          else if (should && !sel) { c.classList.add('miss'); ok = false; }
          else if (!should && sel) { c.classList.add('no'); ok = false; }
        });
        e.target.disabled = true;
        this.finish(d, ok, ok ? '' : 'Viền xanh đậm = cụm bạn bỏ sót; gạch ngang = cụm chọn nhầm.');
      });
    }
  },

  finish(d, ok, extra = '') {
    const s = this.session;
    if (ok) s.score++;
    App.store.recordDrill(d, ok);
    App.store.logActivity('drills');
    if (ok && App.store.state.drillMistakes[d.id] && s.group === 'mistakes') {
      delete App.store.state.drillMistakes[d.id];
      App.store.save();
    }
    const fb = this.el.querySelector('#feedback');
    fb.innerHTML = `
      <div class="${ok ? 'good' : 'bad'}" style="margin-top:1rem">
        <b>${ok ? '✅ Chính xác!' : '❌ Chưa đúng.'}</b> ${extra}<br>${App.ui.esc(d.explain)}
      </div>
      <p><button class="primary" id="nextBtn">${s.index + 1 < s.items.length ? 'Câu tiếp →' : 'Xem kết quả'}</button></p>`;
    const next = fb.querySelector('#nextBtn');
    next.focus();
    next.addEventListener('click', () => { s.index++; this.renderQuestion(); });
  },

  renderSummary() {
    const s = this.session;
    const pct = Math.round((s.score / s.items.length) * 100);
    const msg = pct >= 90 ? 'Xuất sắc! 🎉' : pct >= 70 ? 'Tốt lắm! 👍' : pct >= 50 ? 'Khá, ôn thêm chút nữa nhé.' : 'Đọc lại lý thuyết rồi thử lại nhé.';
    this.el.innerHTML = `
      <section class="card" style="text-align:center">
        <h1>Kết quả</h1>
        <div class="big-score">${s.score}/${s.items.length}</div>
        <p>${msg}</p>
        <div class="row" style="justify-content:center">
          <button class="primary" id="again">Làm lượt mới</button>
          <a class="btn" href="#drills">Chọn bài khác</a>
          ${s.group !== 'all' && s.group !== 'mistakes' ? `<a class="btn" href="#learn/${s.group === 'caution' ? 'warnings' : s.group}">Đọc lại lý thuyết</a>` : ''}
        </div>
      </section>`;
    this.el.querySelector('#again').addEventListener('click', () => this.start(s.group));
  },
};
