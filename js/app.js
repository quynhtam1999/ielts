// Bộ định tuyến: đọc phần sau dấu # trên địa chỉ (vd: #topics/urban)
// rồi gọi trang tương ứng trong App.views.
(function () {
  App.store.load();

  const main = document.getElementById('app');
  const nav = document.getElementById('nav');

  function route() {
    const [name, ...args] = (location.hash.slice(1) || 'home').split('/');
    const view = App.views[name] || App.views.home;
    // Dừng ghi âm nếu rời trang Speaking
    if (name !== 'speaking' && App.views.speaking.recording) App.views.speaking.stopAll();

    nav.querySelectorAll('a').forEach((a) => a.classList.toggle('active', a.dataset.route === name));
    nav.classList.remove('open');
    main.innerHTML = '';
    view.render(main, args);
    window.scrollTo(0, 0);
  }

  document.getElementById('menuBtn').addEventListener('click', () => nav.classList.toggle('open'));
  window.addEventListener('hashchange', route);
  route();
})();
