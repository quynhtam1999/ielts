// Sổ từ vựng 4 cột: Tổng quát / Cụ thể / Theo vai trò / Biến thể từ loại
App.views.bank = {
  filter: { topic: '', q: '' },

  render(el) {
    this.el = el;
    const words = App.store.state.words;
    const topics = [...new Set(words.map((w) => w.topic).filter(Boolean))];
    const esc = App.ui.esc;
    el.innerHTML = `
      <section class="card">
        <h1>Sổ từ vựng theo cụm chủ đề</h1>
        <p class="muted">Học theo cụm, không học danh sách đồng nghĩa. Mỗi từ ghi 4 cột, kèm collocation đã kiểm tra trên từ điển.</p>
        <div class="row">
          <input type="search" id="q" placeholder="Tìm từ…" value="${esc(this.filter.q)}" style="flex:2;min-width:160px">
          <select id="topic" style="flex:1;min-width:150px">
            <option value="">Tất cả chủ đề</option>
            ${topics.map((t) => `<option ${t === this.filter.topic ? 'selected' : ''}>${esc(t)}</option>`).join('')}
          </select>
          <button class="primary" id="add">➕ Thêm từ</button>
        </div>
      </section>
      <div id="list"></div>
      <dialog id="dlg"></dialog>`;

    el.querySelector('#q').addEventListener('input', (e) => { this.filter.q = e.target.value; this.renderList(); });
    el.querySelector('#topic').addEventListener('change', (e) => { this.filter.topic = e.target.value; this.renderList(); });
    el.querySelector('#add').addEventListener('click', () => this.openEditor());
    this.renderList();
  },

  renderList() {
    const esc = App.ui.esc;
    const q = this.filter.q.trim().toLowerCase();
    const list = App.store.state.words.filter((w) => {
      if (this.filter.topic && w.topic !== this.filter.topic) return false;
      if (!q) return true;
      return JSON.stringify([w.headword, w.general, w.specific, w.role, w.forms, w.collocations]).toLowerCase().includes(q);
    });
    const chips = (arr) => (arr && arr.length ? arr.map((x) => `<span class="chip">${esc(x)}</span>`).join('') : '<span class="muted small">—</span>');
    this.el.querySelector('#list').innerHTML = list.length ? list.map((w) => `
      <section class="card">
        <div class="row spread">
          <h2 style="margin:0">${esc(w.headword)} <span class="tag">${esc(w.topic || 'Khác')}</span></h2>
          <div class="row"><button class="small" data-edit="${w.id}">Sửa</button><button class="small danger" data-del="${w.id}">Xoá</button></div>
        </div>
        <div class="facets">
          <div class="facet"><h4>Tổng quát</h4>${chips(w.general)}</div>
          <div class="facet"><h4>Cụ thể</h4>${chips(w.specific)}</div>
          <div class="facet"><h4>Theo vai trò</h4>${chips(w.role)}</div>
          <div class="facet"><h4>Biến thể từ loại</h4>${chips(w.forms)}</div>
        </div>
        ${w.collocations && w.collocations.length ? `<p class="small"><b>Collocation:</b> ${chips(w.collocations)}</p>` : ''}
        ${w.note ? `<p class="note small">${esc(w.note)}</p>` : ''}
      </section>`).join('') : '<p class="muted">Không tìm thấy từ nào.</p>';

    this.el.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () =>
      this.openEditor(App.store.state.words.find((w) => w.id === b.dataset.edit))));
    this.el.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
      if (!confirm('Xoá từ này khỏi sổ?')) return;
      App.store.deleteWord(b.dataset.del);
      this.renderList();
    }));
  },

  openEditor(word) {
    const esc = App.ui.esc;
    const w = word || { headword: '', topic: this.filter.topic, general: [], specific: [], role: [], forms: [], collocations: [], note: '' };
    const dlg = this.el.querySelector('#dlg');
    const field = (key, label, ph) => `<div><label>${label}</label>
      <input type="text" name="${key}" value="${esc((w[key] || []).join(', '))}" placeholder="${ph}"></div>`;
    dlg.innerHTML = `
      <form method="dialog" class="stack" id="wordForm">
        <h2>${word ? 'Sửa từ' : 'Thêm từ mới'}</h2>
        <div><label>Từ / cụm từ gốc *</label><input type="text" name="headword" required value="${esc(w.headword)}" placeholder="vd: people"></div>
        <div><label>Chủ đề</label><input type="text" name="topic" value="${esc(w.topic || '')}" placeholder="vd: Đô thị & quy hoạch"></div>
        <p class="small muted">Các mục bên dưới: cách nhau bằng dấu phẩy.</p>
        ${field('general', 'Tổng quát hơn', 'vd: the public, population')}
        ${field('specific', 'Cụ thể hơn', 'vd: working parents, the elderly')}
        ${field('role', 'Theo vai trò / chức năng', 'vd: residents, commuters')}
        ${field('forms', 'Biến thể từ loại', 'vd: populate → population')}
        ${field('collocations', 'Collocation', 'vd: local residents')}
        <div><label>Ghi chú</label><textarea name="note" style="min-height:60px">${esc(w.note || '')}</textarea></div>
        <div class="row"><button class="primary" value="save">Lưu</button><button value="cancel" formnovalidate>Huỷ</button></div>
      </form>`;
    dlg.returnValue = '';
    dlg.showModal();
    dlg.onclose = () => {
      if (dlg.returnValue !== 'save') return;
      const f = new FormData(dlg.querySelector('#wordForm'));
      const list = (k) => App.ui.splitList(f.get(k));
      App.store.upsertWord({
        ...w,
        headword: String(f.get('headword')).trim(),
        topic: String(f.get('topic')).trim(),
        general: list('general'), specific: list('specific'), role: list('role'),
        forms: list('forms'), collocations: list('collocations'),
        note: String(f.get('note')).trim(),
      });
      App.ui.toast('Đã lưu ✓');
      this.render(this.el);
    };
  },
};
