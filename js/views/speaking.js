// Trang Speaking: nghe câu hỏi, ghi âm, chuyển giọng nói thành chữ (Chrome/Edge),
// rồi phân tích xem bạn có paraphrase câu hỏi hay chỉ lặp lại.
App.views.speaking = {
  rec: null,        // bộ nhận dạng giọng nói
  media: null,      // bộ ghi âm
  timerId: null,

  render(el, args) {
    this.stopAll();
    this.el = el;
    const q = App.data.speakingQuestions.find((x) => x.id === args[0]);
    if (q) this.renderPractice(q);
    else this.renderList();
  },

  renderList() {
    const esc = App.ui.esc;
    const parts = [1, 2, 3];
    const names = { 1: 'Part 1: câu hỏi ngắn về bản thân', 2: 'Part 2: nói 2 phút theo thẻ', 3: 'Part 3: thảo luận' };
    this.el.innerHTML = `
      <section class="card">
        <h1>Speaking: paraphrase câu hỏi</h1>
        <p>Giám khảo đánh giá cao khi bạn <b>không lặp nguyên câu hỏi</b> mà diễn đạt lại bằng từ của mình ngay câu đầu.</p>
        <p class="small muted">Nhận dạng giọng nói hoạt động tốt nhất trên Chrome hoặc Edge, cần cho phép dùng micro. Trình duyệt khác: bạn vẫn ghi âm được và tự gõ lại câu trả lời.</p>
      </section>
      ${parts.map((p) => `
        <section class="card">
          <h2>${names[p]}</h2>
          ${App.data.speakingQuestions.filter((q) => q.part === p).map((q) => `
            <div class="row spread attempt"><span style="flex:1;white-space:pre-line">${esc(q.text.split('\n')[0])}</span>
              <a class="btn" href="#speaking/${q.id}">Luyện</a></div>`).join('')}
        </section>`).join('')}
      ${this.historyHTML()}`;
    this.bindHistory();
  },

  historyHTML() {
    const list = App.store.state.speaking.slice(0, 10);
    if (!list.length) return '';
    const esc = App.ui.esc;
    return `<section class="card"><h2>Câu trả lời gần đây</h2>
      ${list.map((s) => `<div class="attempt"><div class="row spread"><span class="small muted">${s.date} · ${s.words} từ · lấy lại ${Math.round(s.reusePct * 100)}%</span>
        <button class="ghost danger small" data-del="${s.id}">Xoá</button></div>
        <p class="small"><b>${esc(s.question.split('\n')[0])}</b></p><p>${esc(s.transcript)}</p></div>`).join('')}
    </section>`;
  },
  bindHistory() {
    this.el.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
      App.store.state.speaking = App.store.state.speaking.filter((s) => s.id !== b.dataset.del);
      App.store.save();
      this.renderList();
    }));
  },

  renderPractice(q) {
    const esc = App.ui.esc;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.el.innerHTML = `
      <section class="card">
        <a href="#speaking" class="small">← Danh sách câu hỏi</a>
        <div class="row spread"><span class="tag">Part ${q.part}</span><span class="muted small">Nên nói khoảng ${q.seconds} giây</span></div>
        <div class="prompt-box" style="white-space:pre-line;margin-top:.5rem">${esc(q.text)}</div>
        <div class="row" style="margin-top:.75rem">
          <button id="listen">🔊 Nghe câu hỏi</button>
          <button id="hintBtn">💡 Gợi ý paraphrase</button>
        </div>
        <div id="hint" class="info" hidden style="margin-top:.75rem">${esc(q.hint)}
          <details style="margin-top:.5rem"><summary>Câu mở đầu mẫu</summary><p>${esc(q.opener)}</p></details></div>
      </section>

      <section class="card">
        <div class="row spread">
          <button class="rec-btn primary" id="recBtn">🎙️ Bắt đầu nói</button>
          <span class="timer" id="timer">0:00</span>
        </div>
        ${SR ? '' : '<p class="note small">Trình duyệt này không hỗ trợ chuyển giọng nói thành chữ. Bạn vẫn ghi âm được, sau đó tự gõ lại câu trả lời vào ô bên dưới.</p>'}
        <label for="transcript" style="margin-top:1rem">Câu trả lời của bạn (có thể sửa lại)</label>
        <textarea id="transcript" placeholder="Bấm “Bắt đầu nói”, hoặc gõ câu trả lời vào đây…"></textarea>
        <p class="interim" id="interim"></p>
        <audio id="playback" controls hidden style="width:100%"></audio>
        <div class="row" style="margin-top:.75rem">
          <button class="primary" id="analyze">🔍 Phân tích</button>
          <button id="save">💾 Lưu</button>
        </div>
        <div id="result"></div>
      </section>`;

    const $ = (s) => this.el.querySelector(s);
    $('#listen').addEventListener('click', () => this.speak(q.text));
    $('#hintBtn').addEventListener('click', () => { $('#hint').hidden = !$('#hint').hidden; });
    $('#recBtn').addEventListener('click', () => (this.recording ? this.stopAll() : this.startRec()));

    const analyze = () => {
      const text = $('#transcript').value;
      const r = App.analyzer.analyze(q.text, text, { keep: [] });
      const secs = this.elapsed || 0;
      const wpm = secs > 5 ? Math.round(r.wordCount / (secs / 60)) : null;
      $('#result').innerHTML = App.analyzer.renderResult(r) +
        (wpm ? `<p class="small muted">Tốc độ: khoảng <b>${wpm}</b> từ/phút (người nói lưu loát thường 120–160).</p>` : '') +
        (secs && secs < q.seconds * 0.5 ? `<div class="note">Câu trả lời hơi ngắn (${secs}s). Thử mở rộng bằng lý do + ví dụ cụ thể.</div>` : '');
      return r;
    };
    $('#analyze').addEventListener('click', analyze);
    $('#save').addEventListener('click', () => {
      const text = $('#transcript').value.trim();
      if (!text) { App.ui.toast('Chưa có câu trả lời'); return; }
      const r = analyze();
      App.store.state.speaking.unshift({
        id: 'sp' + Date.now().toString(36), date: App.ui.today(), qid: q.id, question: q.text,
        transcript: text, words: r.wordCount, reusePct: r.reusePct, seconds: this.elapsed || 0,
      });
      App.store.save();
      App.store.logActivity('speaking');
      App.ui.toast('Đã lưu ✓');
    });
  },

  speak(text) {
    if (!('speechSynthesis' in window)) { App.ui.toast('Trình duyệt không hỗ trợ đọc'); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/–/g, ''));
    u.lang = 'en-GB';
    u.rate = 0.95;
    const v = speechSynthesis.getVoices().find((x) => x.lang === 'en-GB');
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  },

  async startRec() {
    const $ = (s) => this.el.querySelector(s);
    const box = $('#transcript');
    this.recording = true;
    this.elapsed = 0;
    const btn = $('#recBtn');
    btn.textContent = '⏹️ Dừng';
    btn.classList.add('on');
    const start = Date.now();
    this.timerId = setInterval(() => {
      this.elapsed = Math.round((Date.now() - start) / 1000);
      const t = this.el.querySelector('#timer');
      if (t) t.textContent = App.ui.formatTime(this.elapsed);
    }, 250);

    // 1) Ghi âm để nghe lại
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      this.media = new MediaRecorder(stream);
      this.media.ondataavailable = (e) => chunks.push(e.data);
      this.media.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const audio = this.el.querySelector('#playback');
        if (audio) { audio.src = URL.createObjectURL(new Blob(chunks)); audio.hidden = false; }
      };
      this.media.start();
    } catch (e) {
      App.ui.toast('Không truy cập được micro: ' + e.message);
    }

    // 2) Chuyển giọng nói thành chữ (nếu trình duyệt hỗ trợ)
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    let finalText = box.value ? box.value.trim() + ' ' : '';
    const rec = new SR();
    rec.lang = 'en-GB';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript.trim() + ' ';
        else interim += r[0].transcript;
      }
      box.value = finalText;
      const it = this.el.querySelector('#interim');
      if (it) it.textContent = interim;
    };
    // Chrome tự dừng khi im lặng lâu, nên khởi động lại nếu vẫn đang ghi
    rec.onend = () => { if (this.recording && this.rec === rec) { try { rec.start(); } catch (_) { /* bỏ qua */ } } };
    rec.onerror = (e) => { if (e.error === 'not-allowed') App.ui.toast('Bạn cần cho phép dùng micro'); };
    this.rec = rec;
    rec.start();
  },

  stopAll() {
    this.recording = false;
    clearInterval(this.timerId);
    if (this.rec) { const r = this.rec; this.rec = null; try { r.stop(); } catch (_) { /* bỏ qua */ } }
    if (this.media && this.media.state !== 'inactive') this.media.stop();
    this.media = null;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    const btn = this.el && this.el.querySelector('#recBtn');
    if (btn) { btn.textContent = '🎙️ Nói tiếp'; btn.classList.remove('on'); }
    const it = this.el && this.el.querySelector('#interim');
    if (it) it.textContent = '';
  },
};
