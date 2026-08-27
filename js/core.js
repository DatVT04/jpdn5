/* =============================================================
   N5 道場 — core: dữ liệu, lưu trữ, SRS, tiện ích UI
   ============================================================= */
(function (global) {
'use strict';

const RAW = global.N5_DATA || {};

/* ---------------- Utils ---------------- */
const $  = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const pick   = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sample = (arr, n) => shuffle(arr).slice(0, n);
const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const DAY = 86400000;
function todayKey(d) {
  const t = d ? new Date(d) : new Date();
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
}
function daysBetween(aKey, bKey) {
  return Math.round((new Date(bKey + 'T00:00:00') - new Date(aKey + 'T00:00:00')) / DAY);
}
function fmtDur(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }

/* ---------------- Kana ⇄ romaji ---------------- */
const KANA2ROM = {};
(RAW.kana ? [].concat(RAW.kana.hiragana || [], RAW.kana.katakana || []) : []).forEach(k => {
  if (!KANA2ROM[k.char]) KANA2ROM[k.char] = k.romaji;
});
Object.assign(KANA2ROM, { 'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo', 'ャ': 'ya', 'ュ': 'yu', 'ョ': 'yo', 'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o' });

function kanaToRomaji(str) {
  if (!str) return '';
  let out = '', i = 0;
  const s = String(str).replace(/[・\s、。！？]/g, '');
  while (i < s.length) {
    const two = s.substr(i, 2);
    if (KANA2ROM[two]) { out += KANA2ROM[two]; i += 2; continue; }
    const ch = s[i];
    if (ch === 'っ' || ch === 'ッ') {
      const nxt = KANA2ROM[s.substr(i + 1, 2)] || KANA2ROM[s[i + 1]] || '';
      if (nxt) out += nxt[0];
      i++; continue;
    }
    if (ch === 'ー') { out += out.slice(-1); i++; continue; }
    if (ch === 'ん' || ch === 'ン') { out += 'n'; i++; continue; }
    out += KANA2ROM[ch] || ch;
    i++;
  }
  return out;
}
/* Chuẩn hoá romaji: chấp nhận nhiều kiểu ghi (shi/si, tsu/tu, ...) */
function normRomaji(str) {
  return String(str || '').toLowerCase().trim()
    .replace(/[\s'’\-.,]/g, '')
    .replace(/shi/g, 'si').replace(/chi/g, 'ti').replace(/tsu/g, 'tu')
    .replace(/sha/g, 'sya').replace(/shu/g, 'syu').replace(/sho/g, 'syo')
    .replace(/cha/g, 'tya').replace(/chu/g, 'tyu').replace(/cho/g, 'tyo')
    .replace(/ja/g, 'zya').replace(/ju/g, 'zyu').replace(/jo/g, 'zyo').replace(/ji/g, 'zi')
    .replace(/fu/g, 'hu')
    .replace(/ou/g, 'o').replace(/oo/g, 'o').replace(/uu/g, 'u').replace(/aa/g, 'a')
    .replace(/ee/g, 'e').replace(/ei/g, 'e').replace(/ii/g, 'i')
    .replace(/m([bpm])/g, 'n$1')
    .replace(/wo/g, 'o');
}
function kataToHira(s) {
  return String(s || '').replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
}
/* So khớp câu trả lời gõ tay: chấp nhận kana hoặc romaji */
function answerMatches(input, accepted) {
  const list = Array.isArray(accepted) ? accepted : [accepted];
  const raw = String(input || '').trim();
  if (!raw) return false;
  const cands = new Set();
  cands.add(raw.toLowerCase());
  cands.add(kataToHira(raw));
  cands.add(normRomaji(raw));
  cands.add(normRomaji(kanaToRomaji(raw)));
  for (const a of list) {
    if (!a) continue;
    const A = String(a).trim();
    if (cands.has(A.toLowerCase())) return true;
    if (cands.has(kataToHira(A))) return true;
    const ar = normRomaji(kanaToRomaji(A)) || normRomaji(A);
    if (ar && cands.has(ar)) return true;
  }
  return false;
}

/* ---------------- Dataset ---------------- */
const DATA = {
  meta: RAW.meta || {},
  exam: RAW.exam || {},
  cat: RAW.categories || { kanji: {}, grammar: {}, vocab_topic: {}, pos: {} },
  kanji: RAW.kanji || [],
  vocab: RAW.vocabulary || [],
  grammar: RAW.grammar || [],
  counters: RAW.counters || [],
  numbers: RAW.numbers || [],
  hiragana: (RAW.kana && RAW.kana.hiragana) || [],
  katakana: (RAW.kana && RAW.kana.katakana) || [],
  kanaNotes: (RAW.kana && RAW.kana.notes) || []
};
DATA.verbs = DATA.vocab.filter(v => v.conjugation);
DATA.byId = {};
DATA.kanji.forEach(k => DATA.byId[k.id] = k);
DATA.vocab.forEach(v => DATA.byId[v.id] = v);
DATA.grammar.forEach(g => DATA.byId[g.id] = g);
DATA.kanaAll = DATA.hiragana.map((k, i) => Object.assign({ id: 'hi' + i, script: 'hiragana' }, k))
  .concat(DATA.katakana.map((k, i) => Object.assign({ id: 'ka' + i, script: 'katakana' }, k)));
DATA.kanaAll.forEach(k => DATA.byId[k.id] = k);
DATA.counters.forEach((c, i) => { c.id = 'c' + String(i).padStart(2, '0'); DATA.byId[c.id] = c; });

const DECKS = {
  kanji:   { label: 'Kanji',      icon: '漢', items: () => DATA.kanji },
  vocab:   { label: 'Từ vựng',    icon: '語', items: () => DATA.vocab },
  grammar: { label: 'Ngữ pháp',   icon: '文', items: () => DATA.grammar },
  kana:    { label: 'Kana',       icon: 'あ', items: () => DATA.kanaAll },
  counter: { label: 'Lượng từ',   icon: '個', items: () => DATA.counters }
};
function deckOf(id) {
  if (!id) return null;
  if (/^(hi|ka)\d/.test(id)) return 'kana';   // hi0…, ka0… — phải kiểm tra trước 'k' của kanji
  if (/^k\d/.test(id)) return 'kanji';
  if (id[0] === 'v') return 'vocab';
  if (id[0] === 'g') return 'grammar';
  if (id[0] === 'c') return 'counter';
  return 'kana';
}
/* Nhãn hiển thị cho một item bất kỳ */
function itemFace(it) {
  if (!it) return { front: '?', reading: '', meaning: '' };
  if (it.char && it.hanviet) return { front: it.char, reading: [].concat(it.onyomi || [], it.kunyomi || []).join('・'), meaning: it.meaning_vi };
  if (it.char) return { front: it.char, reading: it.romaji, meaning: it.romaji };
  if (it.word) return { front: it.word, reading: it.kana, meaning: it.meaning_vi };
  if (it.pattern) return { front: it.pattern, reading: it.formation, meaning: it.meaning_vi };
  if (it.counter) return { front: it.counter, reading: (it.readings || []).join('・'), meaning: it.usage_vi };
  return { front: '?', reading: '', meaning: '' };
}

/* ---------------- Store (localStorage) ---------------- */
const KEY = 'n5dojo.v1';
const DEFAULTS = {
  settings: {
    theme: 'dark',
    showRomaji: true,
    autoSpeak: false,
    ttsRate: 0.9,
    dailyGoal: 30,
    examDate: '',
    quizLen: 15,
    hideRomajiKana: false
  },
  srs: {},          // id -> {e,i,d,r,l,s}
  daily: {},        // 'YYYY-MM-DD' -> {rev, quiz, correct, total, minutes}
  seen: {},         // id -> {c: correct, w: wrong}
  exams: [],        // lịch sử thi thử
  streak: { cur: 0, best: 0, last: '' },
  createdAt: Date.now()
};

let S = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULTS));
    const parsed = JSON.parse(raw);
    const merged = JSON.parse(JSON.stringify(DEFAULTS));
    Object.keys(parsed || {}).forEach(k => {
      if (k === 'settings') Object.assign(merged.settings, parsed.settings || {});
      else merged[k] = parsed[k];
    });
    return merged;
  } catch (e) {
    console.warn('Không đọc được tiến độ, dùng mặc định.', e);
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
}
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { console.warn('Không lưu được tiến độ', e); }
  }, 120);
}
function state() { return S; }
function settings() { return S.settings; }
function setSetting(k, v) { S.settings[k] = v; save(); }
function resetAll() { S = JSON.parse(JSON.stringify(DEFAULTS)); save(); }

/* Ghi nhận hoạt động trong ngày + chuỗi ngày */
function logDay(patch) {
  const k = todayKey();
  const d = S.daily[k] || (S.daily[k] = { rev: 0, quiz: 0, correct: 0, total: 0 });
  Object.keys(patch || {}).forEach(p => d[p] = (d[p] || 0) + patch[p]);
  const st = S.streak;
  if (st.last !== k) {
    const gap = st.last ? daysBetween(st.last, k) : 999;
    st.cur = gap === 1 ? st.cur + 1 : 1;
    st.last = k;
    st.best = Math.max(st.best || 0, st.cur);
  }
  save();
}
function todayStats() { return S.daily[todayKey()] || { rev: 0, quiz: 0, correct: 0, total: 0 }; }

/* Ghi nhận đúng/sai cho từng mục (dùng cho "điểm yếu") */
function logAnswer(id, ok) {
  if (!id) return;
  const s = S.seen[id] || (S.seen[id] = { c: 0, w: 0 });
  ok ? s.c++ : s.w++;
  logDay({ total: 1, correct: ok ? 1 : 0 });
  save();
}

/* ---------------- SRS (SM-2 rút gọn) ---------------- */
const SRS = {
  card(id) { return S.srs[id] || null; },
  ensure(id) {
    return S.srs[id] || (S.srs[id] = { e: 2.5, i: 0, d: todayKey(), r: 0, l: 0, s: 0 });
  },
  /** grade: 0 = Lại, 1 = Khó, 2 = Tốt, 3 = Dễ */
  grade(id, g) {
    const c = SRS.ensure(id);
    c.r = (c.r || 0) + 1;
    if (g === 0) {
      c.l = (c.l || 0) + 1;
      c.i = 0;
      c.e = clamp((c.e || 2.5) - 0.22, 1.3, 3.0);
      c.s = 0;
    } else {
      const base = c.i || 0;
      if (base === 0)      c.i = g === 1 ? 1 : (g === 3 ? 3 : 1);
      else if (base === 1) c.i = g === 1 ? 2 : (g === 3 ? 6 : 3);
      else                 c.i = Math.round(base * (c.e || 2.5) * (g === 1 ? 0.62 : (g === 3 ? 1.32 : 1)));
      c.i = clamp(c.i, 1, 240);
      c.e = clamp((c.e || 2.5) + (g === 3 ? 0.12 : g === 1 ? -0.14 : 0.02), 1.3, 3.0);
      c.s = Math.min(5, (c.s || 0) + 1);
    }
    const next = new Date();
    next.setDate(next.getDate() + c.i);
    c.d = todayKey(next);
    logDay({ rev: 1 });
    logAnswer(id, g > 0);
    save();
    return c;
  },
  isDue(id) {
    const c = S.srs[id];
    if (!c) return false;
    return daysBetween(c.d, todayKey()) >= 0;
  },
  due(deck) {
    const t = todayKey();
    return Object.keys(S.srs)
      .filter(id => daysBetween(S.srs[id].d, t) >= 0)
      .filter(id => !deck || deckOf(id) === deck)
      .filter(id => DATA.byId[id])
      .sort((a, b) => (S.srs[a].d < S.srs[b].d ? -1 : 1));
  },
  dueCount(deck) { return SRS.due(deck).length; },
  /** 0 chưa học · 1 mới · 2 đang nhớ · 3 thuộc */
  mastery(id) {
    const c = S.srs[id];
    if (!c) return 0;
    if (c.i >= 21 && (c.s || 0) >= 3) return 3;
    if (c.i >= 4) return 2;
    return 1;
  },
  deckProgress(deck) {
    const items = DECKS[deck].items();
    let learned = 0, mastered = 0;
    items.forEach(it => {
      const m = SRS.mastery(it.id);
      if (m > 0) learned++;
      if (m === 3) mastered++;
    });
    return { total: items.length, learned, mastered, pct: pct(learned, items.length), mpct: pct(mastered, items.length) };
  },
  /** Mục cần chú ý: sai nhiều nhất */
  weakest(n) {
    return Object.keys(S.seen)
      .map(id => ({ id, ...S.seen[id] }))
      .filter(x => x.w > 0 && DATA.byId[x.id])
      .sort((a, b) => (b.w - b.c) - (a.w - a.c) || b.w - a.w)
      .slice(0, n || 12);
  }
};

/* ---------------- TTS ---------------- */
const TTS = {
  voice: null,
  ready: false,
  init() {
    if (!('speechSynthesis' in window)) return;
    const pickVoice = () => {
      const vs = speechSynthesis.getVoices() || [];
      TTS.voice = vs.find(v => /ja[-_]JP/i.test(v.lang)) || vs.find(v => /^ja/i.test(v.lang)) || null;
      TTS.ready = !!TTS.voice;
    };
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  },
  speak(text) {
    if (!text || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = 'ja-JP';
      u.rate = Number(S.settings.ttsRate) || 0.9;
      if (TTS.voice) u.voice = TTS.voice;
      speechSynthesis.speak(u);
    } catch (e) { /* im lặng */ }
  },
  stop() { try { speechSynthesis.cancel(); } catch (e) {} }
};

/* ---------------- UI helpers ---------------- */
function toast(msg, kind) {
  const wrap = $('#toastWrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast ' + (kind || '');
  el.innerHTML = msg;
  wrap.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; }, 2000);
  setTimeout(() => el.remove(), 2400);
}
function openModal(html) {
  const wrap = $('#modalWrap'), m = $('#modal');
  m.innerHTML = html;
  wrap.hidden = false;
  wrap.onclick = e => { if (e.target === wrap) closeModal(); };
  return m;
}
function closeModal() { const w = $('#modalWrap'); if (w) w.hidden = true; }

function speakBtn(text, cls) {
  return `<button class="btn ${cls || 'sm ghost'}" data-speak="${esc(text)}" title="Nghe phát âm">🔊</button>`;
}
function bindSpeak(root) {
  $$('[data-speak]', root || document).forEach(b => {
    if (b.dataset.bound) return;
    b.dataset.bound = '1';
    b.addEventListener('click', e => { e.stopPropagation(); TTS.speak(b.dataset.speak); });
  });
}
function barHTML(p, cls) { return `<div class="bar ${cls || ''}"><i style="width:${clamp(p, 0, 100)}%"></i></div>`; }

global.N5 = {
  $, $$, esc, shuffle, pick, sample, clamp, todayKey, daysBetween, fmtDur, pct,
  kanaToRomaji, normRomaji, kataToHira, answerMatches,
  DATA, DECKS, deckOf, itemFace,
  state, settings, setSetting, save, load, resetAll,
  logDay, todayStats, logAnswer, SRS, TTS,
  toast, openModal, closeModal, speakBtn, bindSpeak, barHTML,
  KEY, DEFAULTS
};
})(window);
