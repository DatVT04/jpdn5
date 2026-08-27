/* =============================================================
   N5 道場 — bộ sinh câu hỏi + engine luyện tập
   ============================================================= */
(function (global) {
'use strict';

const N = global.N5;
const { DATA, esc, shuffle, pick, sample, clamp, pct, fmtDur, answerMatches, SRS, TTS } = N;

/* ---------------- Âm thanh phản hồi (WebAudio, không cần file) ---------------- */
const SFX = {
  ctx: null,
  on: true,
  tone(freq, dur, type, vol) {
    if (!SFX.on) return;
    try {
      SFX.ctx = SFX.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t = SFX.ctx.currentTime;
      const o = SFX.ctx.createOscillator(), g = SFX.ctx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.06, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.14));
      o.connect(g).connect(SFX.ctx.destination);
      o.start(t); o.stop(t + (dur || 0.14) + 0.02);
    } catch (e) {}
  },
  ok()   { SFX.tone(880, .1); setTimeout(() => SFX.tone(1320, .12), 70); },
  bad()  { SFX.tone(180, .18, 'square', .045); },
  done() { [660, 880, 1100].forEach((f, i) => setTimeout(() => SFX.tone(f, .16), i * 110)); }
};

/* ---------------- Tiện ích tạo đáp án ---------------- */
function opts(correct, poolFn, n) {
  n = n || 4;
  const out = [String(correct)];
  let guard = 0;
  while (out.length < n && guard++ < 400) {
    const c = poolFn();
    if (c == null) continue;
    const s = String(c).trim();
    if (!s || out.includes(s)) continue;
    out.push(s);
  }
  if (out.length < n) return null;
  const shuffled = shuffle(out);
  return { list: shuffled, idx: shuffled.indexOf(String(correct)) };
}
const fromList = (arr, fieldFn) => () => { const it = pick(arr); return it ? fieldFn(it) : null; };

function Q(o) { return Object.assign({ type: 'choice', kind: 'q' }, o); }

const PARTICLES = ['は', 'が', 'を', 'に', 'へ', 'で', 'と', 'も', 'か', 'ね', 'よ', 'の', 'から', 'まで', 'より'];
const FORM_LABEL = {
  masu: 'thể ます (lịch sự)',
  masu_nai: 'thể ません (phủ định lịch sự)',
  te: 'thể て',
  ta: 'thể た (quá khứ ngắn)',
  nai: 'thể ない (phủ định ngắn)'
};

/* Các cặp kana dễ nhìn nhầm — dùng làm đáp án nhiễu "ác" cho bài kiểm tra kana */
const KANA_CONFUSE = [
  ['あ', 'お', 'め', 'ぬ', 'む'], ['い', 'り', 'こ'], ['う', 'つ', 'ら', 'ろ'],
  ['き', 'さ', 'ち'], ['く', 'へ', 'し'], ['け', 'は', 'ほ', 'ま'],
  ['こ', 'に', 'た'], ['す', 'む', 'お'], ['そ', 'ろ', 'る'],
  ['ぬ', 'め', 'ね', 'れ', 'わ'], ['は', 'ほ', 'ま', 'ば'], ['ふ', 'ら', 'み'],
  ['ゆ', 'や', 'わ'], ['も', 'き', 'ま'], ['ん', 'そ', 'え'],
  ['シ', 'ツ', 'ソ', 'ン'], ['ク', 'ケ', 'タ', 'ワ', 'ラ'], ['ス', 'ヌ', 'フ', 'ブ'],
  ['チ', 'テ', 'ナ'], ['ナ', 'メ', 'ノ', 'ヌ'], ['マ', 'ム', 'ア'],
  ['ハ', 'ヘ', 'ホ'], ['ロ', 'コ', 'ユ', 'エ'], ['レ', 'ル', 'リ'],
  ['オ', 'ホ', 'ナ'], ['ニ', 'ミ', 'ヨ'], ['カ', 'ヤ', 'セ'],
  ['ト', 'イ', 'ヘ'], ['ウ', 'ワ', 'ラ'], ['モ', 'ヨ', 'ヲ']
];
const CONFUSE_MAP = {};
KANA_CONFUSE.forEach(g => g.forEach(c => { (CONFUSE_MAP[c] = CONFUSE_MAP[c] || []).push(...g.filter(x => x !== c)); }));
const KANA_HARD = DATA.kanaAll.filter(k => CONFUSE_MAP[k.char]);
const KATA_WORDS = DATA.vocab.filter(v => /^[ァ-ヶー]+$/.test(v.word));
const KANA_RULES = ((global.N5_EXTRA || {}).kanaRules) || [];

/* ---------------- Các loại câu hỏi ---------------- */
const GEN = {

  /* ===== KANJI ===== */
  kanji_meaning: {
    deck: 'kanji', group: 'kanji', name: 'Kanji → nghĩa',
    src: () => DATA.kanji,
    make(k) {
      const o = opts(k.meaning_vi, fromList(DATA.kanji, x => x.meaning_vi));
      if (!o) return null;
      return Q({
        kind: 'kanji_meaning', id: k.id, label: 'Kanji này nghĩa là gì?',
        prompt: k.char, promptCls: '', speak: k.char,
        options: o.list, answer: o.idx, optJp: false,
        explain: `<b>${esc(k.char)}</b> — ${esc(k.hanviet)} · ${esc(k.meaning_vi)}<br>
          <span class="tiny dim">On: ${esc((k.onyomi || []).join('・') || '—')} · Kun: ${esc((k.kunyomi || []).join('・') || '—')}</span>`
      });
    }
  },

  meaning_kanji: {
    deck: 'kanji', group: 'kanji', name: 'Nghĩa → kanji',
    src: () => DATA.kanji,
    make(k) {
      const o = opts(k.char, fromList(DATA.kanji, x => x.char));
      if (!o) return null;
      return Q({
        kind: 'meaning_kanji', id: k.id, label: 'Chữ Hán nào mang nghĩa này?',
        prompt: k.meaning_vi, promptCls: 'text',
        options: o.list, answer: o.idx, optJp: true,
        explain: `<b>${esc(k.char)}</b> (${esc(k.hanviet)}) — ${esc(k.meaning_vi)}`
      });
    }
  },

  kanji_hanviet: {
    deck: 'kanji', group: 'kanji', name: 'Kanji → âm Hán Việt',
    src: () => DATA.kanji,
    make(k) {
      const o = opts(k.hanviet, fromList(DATA.kanji, x => x.hanviet));
      if (!o) return null;
      return Q({
        kind: 'kanji_hanviet', id: k.id, label: 'Âm Hán Việt của chữ này?',
        prompt: k.char, speak: k.char,
        options: o.list, answer: o.idx,
        explain: `<b>${esc(k.char)}</b> — ${esc(k.hanviet)} · ${esc(k.meaning_vi)}`
      });
    }
  },

  kanji_reading: {
    deck: 'kanji', group: 'kanji', name: 'Cách đọc từ có kanji',
    src: () => DATA.kanji.filter(k => (k.examples || []).length),
    make(k) {
      const ex = pick(k.examples || []);
      if (!ex || !ex.kana) return null;
      const pool = [];
      DATA.kanji.forEach(x => (x.examples || []).forEach(e => { if (e.kana && e.kana.length === ex.kana.length) pool.push(e.kana); }));
      const o = opts(ex.kana, () => pick(pool.length > 6 ? pool : DATA.vocab.map(v => v.kana)));
      if (!o) return null;
      return Q({
        kind: 'kanji_reading', id: k.id, label: 'Từ sau đọc thế nào?',
        prompt: ex.word, speak: ex.word,
        options: o.list, answer: o.idx, optJp: true,
        explain: `<b>${esc(ex.word)}</b>（${esc(ex.kana)}）— ${esc(ex.meaning_vi)}`
      });
    }
  },

  /* ===== TỪ VỰNG ===== */
  vocab_meaning: {
    deck: 'vocab', group: 'vocab', name: 'Từ → nghĩa',
    src: () => DATA.vocab,
    make(v) {
      const same = DATA.vocab.filter(x => x.topic === v.topic);
      const o = opts(v.meaning_vi, fromList(same.length > 6 ? same : DATA.vocab, x => x.meaning_vi));
      if (!o) return null;
      return Q({
        kind: 'vocab_meaning', id: v.id, label: 'Từ này nghĩa là gì?',
        prompt: v.word, speak: v.word, sub: N.settings().showRomaji ? v.kana : '',
        options: o.list, answer: o.idx,
        explain: `<b>${esc(v.word)}</b>（${esc(v.kana)} · ${esc(v.romaji)}）— ${esc(v.meaning_vi)}`
      });
    }
  },

  meaning_vocab: {
    deck: 'vocab', group: 'vocab', name: 'Nghĩa → từ',
    src: () => DATA.vocab,
    make(v) {
      const same = DATA.vocab.filter(x => x.pos === v.pos && x.id !== v.id);
      const o = opts(v.word, fromList(same.length > 6 ? same : DATA.vocab, x => x.word));
      if (!o) return null;
      return Q({
        kind: 'meaning_vocab', id: v.id, label: 'Từ tiếng Nhật tương ứng?',
        prompt: v.meaning_vi, promptCls: 'text',
        options: o.list, answer: o.idx, optJp: true,
        explain: `<b>${esc(v.word)}</b>（${esc(v.kana)}）— ${esc(v.meaning_vi)}`
      });
    }
  },

  vocab_reading: {
    deck: 'vocab', group: 'vocab', name: 'Từ → cách đọc',
    src: () => DATA.vocab.filter(v => v.word !== v.kana && /[一-龯]/.test(v.word)),
    make(v) {
      const pool = DATA.vocab.filter(x => x.kana.length === v.kana.length && x.id !== v.id);
      const o = opts(v.kana, fromList(pool.length > 6 ? pool : DATA.vocab, x => x.kana));
      if (!o) return null;
      return Q({
        kind: 'vocab_reading', id: v.id, label: 'Từ sau đọc thế nào?',
        prompt: v.word, speak: v.word,
        options: o.list, answer: o.idx, optJp: true,
        explain: `<b>${esc(v.word)}</b>（${esc(v.kana)}）— ${esc(v.meaning_vi)}`
      });
    }
  },

  orthography: {
    deck: 'vocab', group: 'vocab', name: 'Kana → cách viết kanji',
    src: () => DATA.vocab.filter(v => v.word !== v.kana && /[一-龯]/.test(v.word)),
    make(v) {
      const pool = DATA.vocab.filter(x => x.word !== x.kana && x.id !== v.id && /[一-龯]/.test(x.word));
      const o = opts(v.word, fromList(pool, x => x.word));
      if (!o) return null;
      return Q({
        kind: 'orthography', id: v.id, label: 'Cách viết đúng của từ này?',
        prompt: v.kana, speak: v.kana, sub: v.meaning_vi,
        options: o.list, answer: o.idx, optJp: true,
        explain: `<b>${esc(v.word)}</b>（${esc(v.kana)}）— ${esc(v.meaning_vi)}`
      });
    }
  },

  vocab_type: {
    deck: 'vocab', group: 'vocab', name: 'Gõ từ theo nghĩa', type: 'input',
    src: () => DATA.vocab,
    make(v) {
      return Q({
        kind: 'vocab_type', id: v.id, type: 'input',
        label: 'Gõ từ tiếng Nhật (kana hoặc romaji)',
        prompt: v.meaning_vi, promptCls: 'text',
        accept: [v.kana, v.word, v.romaji],
        answerText: v.word + '（' + v.kana + '）',
        explain: `<b>${esc(v.word)}</b>（${esc(v.kana)} · ${esc(v.romaji)}）— ${esc(v.meaning_vi)}`
      });
    }
  },

  /* ===== NGỮ PHÁP ===== */
  grammar_meaning: {
    deck: 'grammar', group: 'grammar', name: 'Mẫu câu → ý nghĩa',
    src: () => DATA.grammar,
    make(g) {
      const same = DATA.grammar.filter(x => x.category === g.category && x.id !== g.id);
      const o = opts(g.meaning_vi, fromList(same.length > 4 ? same : DATA.grammar, x => x.meaning_vi));
      if (!o) return null;
      return Q({
        kind: 'grammar_meaning', id: g.id, label: 'Mẫu ngữ pháp này nghĩa là gì?',
        prompt: g.pattern, promptCls: 'sentence',
        options: o.list, answer: o.idx,
        explain: `<b>${esc(g.pattern)}</b> — ${esc(g.meaning_vi)}<br><span class="tiny dim">Cấu trúc: ${esc(g.formation)}</span><br>
          <span class="jp">${esc(g.example.jp)}</span> <span class="tiny dim">${esc(g.example.vi)}</span>`
      });
    }
  },

  grammar_usage: {
    deck: 'grammar', group: 'grammar', name: 'Câu ví dụ → mẫu ngữ pháp',
    src: () => DATA.grammar.filter(g => g.example && g.example.jp),
    make(g) {
      const same = DATA.grammar.filter(x => x.category === g.category && x.id !== g.id);
      const o = opts(g.pattern, fromList(same.length > 4 ? same : DATA.grammar, x => x.pattern));
      if (!o) return null;
      return Q({
        kind: 'grammar_usage', id: g.id, label: 'Câu này dùng mẫu ngữ pháp nào?',
        prompt: g.example.jp, promptCls: 'sentence', speak: g.example.jp, sub: g.example.vi,
        options: o.list, answer: o.idx, optJp: true,
        explain: `<b>${esc(g.pattern)}</b> — ${esc(g.meaning_vi)} · <span class="tiny dim">${esc(g.formation)}</span>`
      });
    }
  },

  particle: {
    deck: 'grammar', group: 'grammar', name: 'Điền trợ từ',
    src: () => DATA.grammar.filter(g => g.category === 'tro-tu' && PARTICLES.includes(g.pattern.replace(/\s*\(.*\)\s*/, '')) && g.example && g.example.jp.includes(g.pattern.replace(/\s*\(.*\)\s*/, ''))),
    make(g) {
      const p = g.pattern.replace(/\s*\(.*\)\s*/, '');
      const jp = g.example.jp;
      let at = jp.indexOf(p);
      if (at <= 0) at = jp.indexOf(p, 1);
      if (at < 0) return null;
      const masked = esc(jp.slice(0, at)) + '<span class="q-blank">＿</span>' + esc(jp.slice(at + p.length));
      const o = opts(p, () => pick(PARTICLES));
      if (!o) return null;
      return Q({
        kind: 'particle', id: g.id, label: 'Điền trợ từ thích hợp',
        promptHTML: masked, promptCls: 'sentence', sub: g.example.vi, speak: jp,
        options: o.list, answer: o.idx, optJp: true,
        explain: `Trợ từ <b>${esc(p)}</b>: ${esc(g.meaning_vi)}<br><span class="jp">${esc(jp)}</span>`
      });
    }
  },

  /* ===== CHIA ĐỘNG TỪ ===== */
  conjugation: {
    deck: 'vocab', group: 'conj', name: 'Chia động từ',
    src: () => DATA.verbs,
    make(v) {
      const forms = Object.keys(v.conjugation);
      const f = pick(forms);
      const correct = v.conjugation[f].kana;
      const others = forms.filter(x => x !== f).map(x => v.conjugation[x].kana);
      const pool = others.concat(DATA.verbs.map(x => (x.conjugation[f] || {}).kana).filter(Boolean));
      const o = opts(correct, () => pick(pool));
      if (!o) return null;
      return Q({
        kind: 'conjugation', id: v.id, label: 'Chia sang ' + FORM_LABEL[f],
        prompt: v.word, speak: v.word, sub: v.kana + ' · ' + v.meaning_vi + ' · nhóm ' + v.verb_group,
        options: o.list, answer: o.idx, optJp: true,
        explain: `<b>${esc(v.word)}</b>（${esc(v.kana)}）→ ${FORM_LABEL[f]}: <b>${esc(correct)}</b>
          <br><span class="tiny dim">ます: ${esc(v.conjugation.masu.kana)} · て: ${esc(v.conjugation.te.kana)} · た: ${esc(v.conjugation.ta.kana)} · ない: ${esc(v.conjugation.nai.kana)}</span>`
      });
    }
  },

  conjugation_type: {
    deck: 'vocab', group: 'conj', name: 'Gõ thể chia', type: 'input',
    src: () => DATA.verbs,
    make(v) {
      const forms = Object.keys(v.conjugation);
      const f = pick(forms);
      const c = v.conjugation[f];
      return Q({
        kind: 'conjugation_type', id: v.id, type: 'input',
        label: 'Gõ ' + FORM_LABEL[f] + ' (kana hoặc romaji)',
        prompt: v.word, speak: v.word, sub: v.kana + ' · ' + v.meaning_vi + ' · nhóm ' + v.verb_group,
        accept: [c.kana, c.romaji],
        answerText: c.kana,
        explain: `<b>${esc(v.word)}</b> → ${FORM_LABEL[f]}: <b>${esc(c.kana)}</b> (${esc(c.romaji)})`
      });
    }
  },

  /* ===== KANA ===== */
  kana_romaji: {
    deck: 'kana', group: 'kana', name: 'Kana → romaji',
    src: () => DATA.kanaAll,
    make(k) {
      const o = opts(k.romaji, fromList(DATA.kanaAll, x => x.romaji));
      if (!o) return null;
      return Q({
        kind: 'kana_romaji', id: k.id, label: 'Chữ này đọc là gì?',
        prompt: k.char, speak: k.char,
        options: o.list, answer: o.idx,
        explain: `<b>${esc(k.char)}</b> = <b>${esc(k.romaji)}</b> (${k.script === 'hiragana' ? 'hiragana' : 'katakana'})`
      });
    }
  },

  romaji_kana: {
    deck: 'kana', group: 'kana', name: 'Romaji → kana',
    src: () => DATA.kanaAll,
    make(k) {
      const pool = DATA.kanaAll.filter(x => x.script === k.script);
      const o = opts(k.char, fromList(pool, x => x.char));
      if (!o) return null;
      return Q({
        kind: 'romaji_kana', id: k.id, label: 'Chọn chữ ' + (k.script === 'hiragana' ? 'hiragana' : 'katakana'),
        prompt: k.romaji, promptCls: 'text',
        options: o.list, answer: o.idx, optJp: true,
        explain: `<b>${esc(k.romaji)}</b> = ${esc(k.char)}`
      });
    }
  },

  kana_type: {
    deck: 'kana', group: 'kana', name: 'Gõ romaji của kana', type: 'input',
    src: () => DATA.kanaAll,
    make(k) {
      return Q({
        kind: 'kana_type', id: k.id, type: 'input', label: 'Gõ romaji của chữ này',
        prompt: k.char, speak: k.char,
        accept: [k.romaji], answerText: k.romaji,
        explain: `<b>${esc(k.char)}</b> = ${esc(k.romaji)}`
      });
    }
  },

  kana_confuse: {
    deck: 'kana', group: 'kana', name: 'Phân biệt kana dễ nhầm',
    src: () => KANA_HARD,
    make(k) {
      const sims = (CONFUSE_MAP[k.char] || []).map(c => DATA.kanaAll.find(x => x.char === c && x.script === k.script) || DATA.kanaAll.find(x => x.char === c))
        .filter(x => x && x.romaji !== k.romaji);
      let i = 0;
      const o = opts(k.romaji, () => (i < sims.length ? sims[i++].romaji : pick(DATA.kanaAll).romaji));
      if (!o) return null;
      return Q({
        kind: 'kana_confuse', id: k.id, label: 'Chú ý! Chữ này đọc là gì?',
        prompt: k.char, speak: k.char,
        options: o.list, answer: o.idx,
        explain: `<b>${esc(k.char)}</b> = <b>${esc(k.romaji)}</b><br><span class="tiny dim">Dễ nhầm với: ${esc((CONFUSE_MAP[k.char] || []).slice(0, 4).join(' · '))}</span>`
      });
    }
  },

  kata_word: {
    deck: 'kana', group: 'kana', name: 'Đọc từ katakana',
    src: () => KATA_WORDS,
    make(v) {
      const o = opts(v.meaning_vi, fromList(KATA_WORDS, x => x.meaning_vi));
      if (!o) return null;
      return Q({
        kind: 'kata_word', id: v.id, label: 'Từ katakana này nghĩa là gì?',
        prompt: v.word, speak: v.word,
        options: o.list, answer: o.idx,
        explain: `<b>${esc(v.word)}</b> = ${esc(v.romaji)} — ${esc(v.meaning_vi)}`
      });
    }
  },

  kata_spell: {
    deck: 'kana', group: 'kana', name: 'Viết từ bằng katakana',
    src: () => KATA_WORDS,
    make(v) {
      const o = opts(v.word, fromList(KATA_WORDS, x => x.word));
      if (!o) return null;
      return Q({
        kind: 'kata_spell', id: v.id, label: 'Từ nào viết đúng?',
        prompt: v.meaning_vi + '（' + v.romaji + '）', promptCls: 'text',
        options: o.list, answer: o.idx, optJp: true,
        explain: `<b>${esc(v.word)}</b> — ${esc(v.meaning_vi)}`
      });
    }
  },

  kana_rule: {
    deck: 'kana', group: 'kana', name: 'Quy tắc đọc (trường âm · っ · âm ghép)',
    src: () => KANA_RULES,
    make(r) {
      if (!r || !r.options) return null;
      return Q({
        kind: 'kana_rule', id: null, label: r.q ? 'Quy tắc đọc' : 'Từ sau đọc (romaji) là gì?',
        prompt: r.q ? r.q : r.jp, promptCls: r.q ? 'text' : '', speak: r.jp,
        options: r.options, answer: r.answer,
        explain: `<b>${esc(r.jp)}</b> → ${esc(r.options[r.answer])}<br>${esc(r.vi)}`
      });
    }
  },

  /* ===== LƯỢNG TỪ & SỐ ===== */
  counter_use: {
    deck: 'counter', group: 'counter', name: 'Lượng từ dùng cho gì',
    src: () => DATA.counters,
    make(c) {
      const o = opts(c.usage_vi, fromList(DATA.counters, x => x.usage_vi));
      if (!o) return null;
      return Q({
        kind: 'counter_use', id: c.id, label: 'Lượng từ này dùng để làm gì?',
        prompt: c.counter, speak: c.counter.replace('〜', ''),
        options: o.list, answer: o.idx,
        explain: `<b>${esc(c.counter)}</b> — ${esc(c.usage_vi)}<br><span class="tiny dim jp">${esc((c.readings || []).join('・'))}</span>`
      });
    }
  },

  counter_pick: {
    deck: 'counter', group: 'counter', name: 'Chọn lượng từ đúng',
    src: () => DATA.counters,
    make(c) {
      const o = opts(c.counter, fromList(DATA.counters, x => x.counter));
      if (!o) return null;
      return Q({
        kind: 'counter_pick', id: c.id, label: 'Dùng lượng từ nào?',
        prompt: c.usage_vi, promptCls: 'text',
        options: o.list, answer: o.idx, optJp: true,
        explain: `<b>${esc(c.counter)}</b> — ${esc(c.usage_vi)}<br><span class="tiny dim jp">${esc((c.readings || []).join('・'))}</span>`
      });
    }
  },

  counter_read: {
    deck: 'counter', group: 'counter', name: 'Cách đọc lượng từ',
    src: () => DATA.counters.filter(c => (c.readings || []).length > 2),
    make(c) {
      const r = pick(c.readings);
      const pool = [];
      DATA.counters.forEach(x => (x.readings || []).forEach(y => pool.push(y)));
      const o = opts(r, () => pick(pool));
      if (!o) return null;
      const idx = c.readings.indexOf(r) + 1;
      return Q({
        kind: 'counter_read', id: c.id, label: 'Cách đọc đúng',
        prompt: idx + ' ' + c.counter.replace('〜', ''), promptCls: 'text', sub: c.usage_vi,
        options: o.list, answer: o.idx, optJp: true,
        explain: `<b>${esc(c.counter)}</b> — ${esc((c.readings || []).join('・'))}`
      });
    }
  },

  number_read: {
    deck: 'counter', group: 'counter', name: 'Số đếm',
    src: () => DATA.numbers,
    make(n) {
      const o = opts(n.kana, fromList(DATA.numbers, x => x.kana));
      if (!o) return null;
      return Q({
        kind: 'number_read', id: null, label: 'Số này đọc thế nào?',
        prompt: n.kanji + '（' + n.digit + '）', speak: n.kana.split('／')[0],
        options: o.list, answer: o.idx, optJp: true,
        explain: `<b>${esc(n.kanji)}</b> = ${esc(String(n.digit))} — ${esc(n.kana)}`
      });
    }
  }
};

const GROUPS = {
  kanji:   { label: 'Kanji',        icon: '漢', kinds: ['kanji_meaning', 'meaning_kanji', 'kanji_hanviet', 'kanji_reading'] },
  vocab:   { label: 'Từ vựng',      icon: '語', kinds: ['vocab_meaning', 'meaning_vocab', 'vocab_reading', 'orthography'] },
  grammar: { label: 'Ngữ pháp',     icon: '文', kinds: ['grammar_meaning', 'grammar_usage', 'particle'] },
  conj:    { label: 'Chia động từ', icon: '動', kinds: ['conjugation', 'conjugation_type'] },
  kana:    { label: 'Kana',         icon: 'あ', kinds: ['kana_romaji', 'romaji_kana', 'kana_confuse', 'kana_rule', 'kata_word', 'kata_spell', 'kana_type'] },
  counter: { label: 'Lượng từ & số',icon: '個', kinds: ['counter_use', 'counter_pick', 'counter_read', 'number_read'] }
};

/* ---------------- Dựng bộ câu hỏi ---------------- */
function buildSet(cfg) {
  cfg = cfg || {};
  const kinds = (cfg.kinds && cfg.kinds.length ? cfg.kinds : Object.keys(GEN)).filter(k => GEN[k]);
  const count = cfg.count || 15;
  const out = [], used = new Set();
  let guard = 0;

  /* Ưu tiên danh sách item chỉ định (ôn câu sai / SRS) */
  const forced = (cfg.items || []).slice();

  while (out.length < count && guard++ < count * 60) {
    let q = null;
    if (forced.length) {
      const it = forced.shift();
      const okKinds = kinds.filter(k => {
        const g = GEN[k];
        return g.src().some(x => x === it || (x.id && x.id === it.id));
      });
      if (okKinds.length) q = GEN[pick(okKinds)].make(it);
      if (!q) continue;
    } else {
      const kind = pick(kinds);
      const src = GEN[kind].src();
      if (!src.length) continue;
      let item = pick(src);
      if (cfg.filter) {
        const pool = src.filter(cfg.filter);
        if (!pool.length) continue;
        item = pick(pool);
      }
      q = GEN[kind].make(item);
    }
    if (!q) continue;
    const sig = q.kind + '|' + (q.id || q.prompt || Math.random());
    if (used.has(sig)) continue;
    used.add(sig);
    out.push(q);
  }
  return out;
}

/* ---------------- Engine hiển thị ---------------- */
function renderQuiz(root, questions, opt) {
  opt = opt || {};
  let i = 0, correct = 0, streak = 0, bestStreak = 0, locked = false;
  const wrong = [];
  const t0 = Date.now();

  root.innerHTML = `
    <div class="q-wrap">
      <div class="q-top">
        <button class="btn sm ghost" id="qQuit">← Thoát</button>
        ${N.barHTML(0)}
        <span class="tiny dim" id="qCount">1/${questions.length}</span>
      </div>
      <div id="qHost"></div>
    </div>`;
  const bar = root.querySelector('.bar > i');
  const host = root.querySelector('#qHost');
  root.querySelector('#qQuit').onclick = () => opt.onQuit && opt.onQuit();

  function draw() {
    const q = questions[i];
    locked = false;
    bar.style.width = pct(i, questions.length) + '%';
    root.querySelector('#qCount').textContent = (i + 1) + '/' + questions.length;

    const promptHTML = q.promptHTML || esc(q.prompt);
    const body = q.type === 'input'
      ? `<div class="type-answer">
           <input type="text" id="qInput" placeholder="Nhập câu trả lời…" autocomplete="off" autocapitalize="off" spellcheck="false">
           <button class="btn primary" id="qCheck">Kiểm tra</button>
         </div>`
      : `<div class="opts" id="qOpts">${q.options.map((t, n) => `
            <button class="opt" data-i="${n}"><kbd>${n + 1}</kbd><span class="${q.optJp ? 'jp' : ''}">${esc(t)}</span></button>`).join('')}</div>`;

    host.innerHTML = `
      <div class="q-card">
        <div class="q-prompt-label">${esc(q.label)}</div>
        <div class="q-prompt ${q.promptCls || ''}">${promptHTML}</div>
        ${q.sub ? `<div class="q-sub">${esc(q.sub)}</div>` : ''}
        ${q.speak ? `<div style="margin-top:10px">${N.speakBtn(q.speak)}</div>` : ''}
        ${body}
        <div class="verdict" id="qVerdict"></div>
      </div>
      <div class="row" style="justify-content:space-between;margin-top:14px">
        <span class="tiny dim">Phím 1–4 để chọn · Enter để tiếp tục</span>
        <button class="btn sm" id="qNext" style="display:none">Tiếp theo →</button>
      </div>`;

    N.bindSpeak(host);
    if (N.settings().autoSpeak && q.speak) TTS.speak(q.speak);

    if (q.type === 'input') {
      const inp = host.querySelector('#qInput');
      inp.focus();
      host.querySelector('#qCheck').onclick = () => submitInput();
      inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); locked ? next() : submitInput(); } };
    } else {
      host.querySelectorAll('.opt').forEach(b => b.onclick = () => choose(Number(b.dataset.i)));
    }
    host.querySelector('#qNext').onclick = next;
  }

  function verdict(ok, q, userText) {
    const v = host.querySelector('#qVerdict');
    v.className = 'verdict show ' + (ok ? 'ok' : 'no');
    v.innerHTML = (ok ? '✅ <b>Chính xác!</b> ' : `❌ <b>Chưa đúng.</b> ${userText ? `<span class="tiny">Bạn nhập: ${esc(userText)}</span> ` : ''}`)
      + '<div style="margin-top:6px">' + (q.explain || '') + '</div>';
    host.querySelector('#qNext').style.display = '';
    host.querySelector('#qNext').focus();
    N.bindSpeak(v);
  }

  function score(ok, q, userText) {
    locked = true;
    if (ok) {
      correct++; streak++; bestStreak = Math.max(bestStreak, streak);
      SFX.ok();
      if (streak >= 3) flashCombo(streak);
    } else {
      streak = 0; SFX.bad();
      wrong.push({ q, userText });
      if (q.id && DATA.byId[q.id]) {
        const c = SRS.ensure(q.id);   // đưa câu sai vào hàng đợi ôn ngay
        c.i = 0; c.d = N.todayKey();
      }
    }
    if (q.id) N.logAnswer(q.id, ok); else N.logDay({ total: 1, correct: ok ? 1 : 0 });
    verdict(ok, q, userText);
  }

  function choose(n) {
    if (locked) return;
    const q = questions[i];
    const ok = n === q.answer;
    host.querySelectorAll('.opt').forEach((b, k) => {
      b.classList.add('locked');
      if (k === q.answer) b.classList.add('correct');
      else if (k === n) b.classList.add('wrong');
      else b.classList.add('faded');
    });
    score(ok, q, null);
  }

  function submitInput() {
    if (locked) return;
    const q = questions[i];
    const inp = host.querySelector('#qInput');
    const val = inp.value.trim();
    if (!val) { inp.focus(); return; }
    const ok = answerMatches(val, q.accept);
    inp.disabled = true;
    inp.style.borderColor = ok ? 'var(--matcha)' : 'var(--coral)';
    host.querySelector('#qCheck').disabled = true;
    if (!ok) q.explain = `Đáp án: <b>${esc(q.answerText)}</b><br>` + (q.explain || '');
    score(ok, q, val);
  }

  function next() {
    i++;
    if (i >= questions.length) return finish();
    draw();
  }

  function finish() {
    const secs = (Date.now() - t0) / 1000;
    const acc = pct(correct, questions.length);
    N.logDay({ quiz: 1 });
    SFX.done();
    root.innerHTML = `
      <div class="q-wrap">
        <div class="card pad-lg center">
          <div class="tiny dim">KẾT QUẢ</div>
          <div class="result-score" style="color:${acc >= 80 ? 'var(--matcha)' : acc >= 60 ? 'var(--amber)' : 'var(--coral)'}">
            ${correct}<small>/${questions.length}</small>
          </div>
          <div style="font-size:20px;font-weight:700;margin-top:6px">${acc}% chính xác</div>
          <div class="muted tiny" style="margin-top:6px">
            ⏱ ${fmtDur(secs)} · ~${(secs / questions.length).toFixed(1)}s/câu · 🔥 chuỗi đúng dài nhất: ${bestStreak}
          </div>
          <div style="margin-top:10px">${acc >= 90 ? '🏆 Xuất sắc! Giữ nhịp này là chắc đỗ.'
            : acc >= 70 ? '👍 Khá tốt — ôn lại phần sai là ổn.'
            : acc >= 50 ? '💪 Cần luyện thêm phần này.'
            : '📚 Hãy quay lại phần học trước khi luyện tiếp nhé.'}</div>
          <div class="row" style="justify-content:center;margin-top:18px">
            <button class="btn primary" id="rAgain">Làm bộ mới</button>
            ${wrong.length ? '<button class="btn pink" id="rWrong">Ôn ' + wrong.length + ' câu sai</button>' : ''}
            <button class="btn ghost" id="rBack">Về danh sách</button>
          </div>
        </div>
        ${wrong.length ? `
          <div class="section-head"><h2>Câu sai (${wrong.length})</h2><span class="tiny dim">Đã tự thêm vào hàng đợi ôn SRS</span></div>
          <div class="review-list">
            ${wrong.map(w => `
              <div class="review-item">
                <span class="jp">${esc(w.q.prompt || '—')}</span>
                <div style="min-width:0">
                  <div class="v">${w.q.type === 'input' ? esc(w.q.answerText) : esc(w.q.options[w.q.answer])}</div>
                  ${w.userText ? `<div class="x">${esc(w.userText)}</div>` : ''}
                  <div class="tiny dim">${esc(w.q.label)}</div>
                </div>
              </div>`).join('')}
          </div>` : ''}
      </div>`;
    const again = root.querySelector('#rAgain'), back = root.querySelector('#rBack'), rw = root.querySelector('#rWrong');
    if (again) again.onclick = () => opt.onAgain && opt.onAgain();
    if (back)  back.onclick  = () => opt.onQuit && opt.onQuit();
    if (rw)    rw.onclick    = () => renderQuiz(root, shuffle(wrong.map(w => w.q)), opt);
    opt.onFinish && opt.onFinish({ correct, total: questions.length, secs, wrong });
  }

  function flashCombo(n) {
    const el = document.createElement('div');
    el.className = 'combo';
    el.textContent = '🔥 ' + n + ' liên tiếp!';
    document.body.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; }, 900);
    setTimeout(() => el.remove(), 1250);
  }

  function keys(e) {
    if (!document.body.contains(root)) { document.removeEventListener('keydown', keys); return; }
    if (e.target.tagName === 'INPUT') return;
    const q = questions[i];
    if (!q) return;
    if (/^[1-4]$/.test(e.key) && q.type !== 'input' && !locked) { choose(Number(e.key) - 1); e.preventDefault(); }
    else if ((e.key === 'Enter' || e.key === ' ') && locked) { next(); e.preventDefault(); }
  }
  document.addEventListener('keydown', keys);

  draw();
}

global.N5.QUIZ = { GEN, GROUPS, buildSet, renderQuiz, SFX, FORM_LABEL, KATA_WORDS, KANA_HARD, KANA_RULES, CONFUSE_MAP };
})(window);
