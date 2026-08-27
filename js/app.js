/* =============================================================
   N5 道場 — router & khung ứng dụng
   ============================================================= */
(function (global) {
'use strict';

const N = global.N5;
const { $, $$, DATA, esc, SRS, TTS, itemFace, deckOf } = N;
const VIEWS = N.VIEWS;

const TITLES = {
  home: 'Trang chủ', review: 'Ôn tập SRS', flashcard: 'Flashcard', quiz: 'Luyện tập',
  kana: 'Bảng chữ cái', grammar: 'Ngữ pháp', browse: 'Tra cứu', exam: 'Thi thử',
  stats: 'Thống kê', settings: 'Cài đặt'
};

const App = {

  applyTheme() {
    const t = N.settings().theme || 'dark';
    document.documentElement.setAttribute('data-theme', t);
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0b0d1a' : '#f6f4ef');
  },

  toggleTheme() {
    N.setSetting('theme', N.settings().theme === 'dark' ? 'light' : 'dark');
    App.applyTheme();
  },

  refreshBadges() {
    const due = SRS.dueCount();
    const b = $('#dueBadge');
    if (b) { b.textContent = due; b.dataset.zero = due ? '0' : '1'; }

    const s = N.state();
    const chip = $('#streakChip');
    if (chip) chip.innerHTML = `🔥 <b>${s.streak.cur || 0}</b> ngày`;

    const goal = s.settings.dailyGoal || 30;
    const t = N.todayStats();
    const done = (t.rev || 0) + (t.total || 0);
    const p = Math.min(100, Math.round((done / goal) * 100));
    const ring = $('#goalRing');
    if (ring) ring.style.strokeDashoffset = String(100 - p);
    const gt = $('#goalMiniText');
    if (gt) gt.textContent = done + '/' + goal;
  },

  parseHash() {
    const h = (location.hash || '#/home').replace(/^#\/?/, '');
    const [path, query] = h.split('?');
    const params = {};
    (query || '').split('&').filter(Boolean).forEach(kv => {
      const [k, v] = kv.split('=');
      params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return { route: path || 'home', params };
  },

  render() {
    const { route, params } = App.parseHash();
    const view = $('#view');
    const fn = VIEWS[route] || VIEWS.home;
    TTS.stop();
    N.closeModal();
    view.scrollTop = 0;
    window.scrollTo({ top: 0 });
    view.innerHTML = '';
    try {
      fn(view, params);
    } catch (e) {
      console.error(e);
      view.innerHTML = `<div class="empty"><span class="em">⚠️</span>Có lỗi khi mở màn hình này.<br>
        <span class="tiny">${esc(e.message)}</span><br>
        <a class="btn sm" href="#/home" style="margin-top:12px">Về trang chủ</a></div>`;
    }
    $('#pageTitle').textContent = TITLES[route] || 'N5 道場';
    document.title = (TITLES[route] || 'Ôn luyện') + ' — N5 道場';
    $$('#mainNav .nav-item, #tabbar a').forEach(a => a.classList.toggle('active', a.dataset.route === route));
    $('#sidebar').classList.remove('open');
    App.refreshBadges();
    N.bindSpeak(view);
  },

  /* ---------- Tìm kiếm nhanh ---------- */
  openPalette() {
    const wrap = $('#paletteWrap'), inp = $('#paletteInput');
    wrap.hidden = false;
    inp.value = '';
    App.paletteResults('');
    setTimeout(() => inp.focus(), 30);
  },
  closePalette() { $('#paletteWrap').hidden = true; },

  paletteResults(q) {
    const box = $('#paletteResults');
    q = (q || '').trim().toLowerCase();
    let list;
    if (!q) {
      list = N.sample(DATA.kanji, 4).concat(N.sample(DATA.vocab, 3), N.sample(DATA.grammar, 3));
    } else {
      const hay = it => [it.char, it.word, it.kana, it.romaji, it.hanviet, it.meaning_vi, it.pattern, it.usage_vi, it.counter]
        .filter(Boolean).join(' ').toLowerCase();
      list = [].concat(DATA.kanji, DATA.vocab, DATA.grammar, DATA.counters, DATA.kanaAll)
        .filter(it => hay(it).includes(q)).slice(0, 30);
    }
    box.innerHTML = list.length ? list.map(it => {
      const f = itemFace(it), d = deckOf(it.id);
      return `<div class="pr" data-id="${it.id}">
        <span class="lead">${esc(f.front)}</span>
        <div style="min-width:0"><div><b>${esc(f.meaning)}</b></div>
          <div class="tiny dim">${esc(f.reading || '')}</div></div>
        <span class="tag" style="margin-left:auto">${esc((N.DECKS[d] || {}).label || '')}</span>
      </div>`;
    }).join('') : '<div class="empty" style="padding:26px">Không tìm thấy kết quả</div>';

    box.querySelectorAll('[data-id]').forEach(el => el.onclick = () => {
      App.closePalette();
      VIEWS.showDetail(DATA.byId[el.dataset.id]);
    });
  },

  init() {
    App.applyTheme();
    TTS.init();

    /* điều hướng */
    window.addEventListener('hashchange', App.render);
    if (!location.hash) location.hash = '#/home';
    App.render();

    /* nút & phím */
    $('#themeToggle').onclick = App.toggleTheme;
    $('#menuBtn').onclick = () => $('#sidebar').classList.toggle('open');
    $('#searchBtn').onclick = App.openPalette;
    $('#paletteWrap').onclick = e => { if (e.target.id === 'paletteWrap') App.closePalette(); };
    $('#paletteInput').addEventListener('input', e => App.paletteResults(e.target.value));

    document.addEventListener('keydown', e => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      if (e.key === 'Escape') { App.closePalette(); N.closeModal(); }
      if (typing) return;
      if (e.key === '/') { e.preventDefault(); App.openPalette(); }
      else if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) App.toggleTheme();
    });

    /* đóng sidebar khi bấm ra ngoài (mobile) */
    document.addEventListener('click', e => {
      const sb = $('#sidebar');
      if (!sb.classList.contains('open')) return;
      if (!sb.contains(e.target) && e.target.id !== 'menuBtn') sb.classList.remove('open');
    });

    /* nhắc nhở chuỗi ngày */
    const s = N.state();
    if (s.streak.last && s.streak.last !== N.todayKey() && s.streak.cur > 0) {
      setTimeout(() => N.toast(`🔥 Bạn đang có chuỗi ${s.streak.cur} ngày — học vài thẻ để giữ chuỗi nhé!`), 1400);
    }

    /* tắt splash */
    setTimeout(() => {
      const sp = $('#splash');
      if (sp) { sp.classList.add('hide'); setTimeout(() => sp.remove(), 500); }
    }, 550);

    App.refreshBadges();
    setInterval(App.refreshBadges, 60000);
  }
};

global.App = App;
document.addEventListener('DOMContentLoaded', App.init);
})(window);
