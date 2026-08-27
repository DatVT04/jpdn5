/* =============================================================
   N5 道場 — Thi thử · Thống kê · Cài đặt
   ============================================================= */
(function (global) {
'use strict';

const N = global.N5;
const { $, $$, DATA, DECKS, esc, shuffle, pick, sample, pct, clamp, SRS, TTS, itemFace, deckOf, fmtDur } = N;
const QUIZ = N.QUIZ;
const EXTRA = global.N5_EXTRA || { readings: [], responses: [], points: [] };
const V = global.N5.VIEWS || (global.N5.VIEWS = {});

/* ---------------- Dựng đề thi ---------------- */
function genQ(kind, n, filter) {
  const out = [];
  let guard = 0;
  const used = new Set();
  while (out.length < n && guard++ < n * 40) {
    const src = QUIZ.GEN[kind].src();
    if (!src.length) break;
    const pool = filter ? src.filter(filter) : src;
    if (!pool.length) break;
    const q = QUIZ.GEN[kind].make(pick(pool));
    if (!q || used.has(q.id + kind)) continue;
    used.add(q.id + kind);
    out.push({
      label: q.label,
      promptHTML: q.promptHTML || esc(q.prompt),
      promptCls: q.promptCls || '',
      sub: q.sub || '',
      options: q.options, answer: q.answer, optJp: q.optJp,
      explain: q.explain, srcId: q.id
    });
  }
  return out;
}

function readingBlock(count) {
  const out = [];
  sample(EXTRA.readings, count).forEach(r => {
    r.questions.forEach(q => {
      out.push({
        label: '読解 — Đọc hiểu',
        passage: r,
        promptHTML: esc(q.q), promptCls: 'sentence',
        options: q.options, answer: q.answer, optJp: true,
        explain: `${esc(q.vi)}<br><span class="tiny dim">${esc(r.vi)}</span>`
      });
    });
  });
  return out;
}

function listeningBlock(nResp, nPoint) {
  const out = [];
  sample(EXTRA.responses, nResp).forEach(r => {
    out.push({
      label: '即時応答 — Nghe và chọn câu đáp lại',
      audio: r.jp, audioOnly: true,
      promptHTML: '<span class="dim" style="font-size:16px">Bấm 🔊 để nghe câu nói</span>',
      options: r.options, answer: r.answer, optJp: true,
      explain: `Câu nghe: <b>${esc(r.jp)}</b><br>${esc(r.vi)}`
    });
  });
  sample(EXTRA.points, nPoint).forEach(p => {
    out.push({
      label: 'ポイント理解 — Nghe lấy thông tin',
      audio: p.jp, audioOnly: true,
      promptHTML: esc(p.q), promptCls: 'sentence',
      options: p.options, answer: p.answer, optJp: true,
      explain: `Câu nghe: <b>${esc(p.jp)}</b><br>${esc(p.vi)}`
    });
  });
  return out;
}

function wrapQ(q) {
  return {
    label: q.label,
    promptHTML: q.promptHTML || esc(q.prompt),
    promptCls: q.promptCls || '',
    sub: q.sub || '',
    options: q.options, answer: q.answer, optJp: q.optJp,
    explain: q.explain, srcId: q.id
  };
}

/* Đề kiểm tra bảng chữ cái: phủ đều 2 bảng, mọi loại âm, kèm chữ dễ nhầm và quy tắc đọc */
function kanaExamQuestions(opt) {
  opt = opt || {};
  const scope = opt.scope || 'both';
  const n = clamp(opt.n || 40, 10, 120);
  const G = QUIZ.GEN;
  const inScope = k => scope === 'both' || k.script === scope;

  const nRule = scope === 'both' ? Math.min(6, Math.round(n * 0.15)) : Math.min(4, Math.round(n * 0.12));
  const nWord = scope === 'hiragana' ? 0 : Math.min(5, Math.round(n * 0.12));
  const nChar = Math.max(1, n - nRule - nWord);

  /* Chữ cái: chia đều 2 bảng, ưu tiên phủ hết mọi loại âm */
  const byScript = { hiragana: [], katakana: [] };
  ['gojuon', 'dakuon', 'handakuon', 'youon', 'gairaigo'].forEach(t => {
    ['hiragana', 'katakana'].forEach(sc => {
      byScript[sc].push(...shuffle(DATA.kanaAll.filter(k => k.script === sc && k.type === t)));
    });
  });
  const queues = (scope === 'both' ? ['hiragana', 'katakana'] : [scope]).map(sc => byScript[sc]);
  const chars = [];
  for (let i = 0; chars.length < nChar && i < 400; i++) {
    const q = queues[i % queues.length];
    if (q && q.length) chars.push(q.shift());
    if (queues.every(x => !x.length)) break;
  }

  const out = [];
  chars.forEach((k, i) => {
    if (!inScope(k)) return;
    const kinds = QUIZ.CONFUSE_MAP[k.char]
      ? ['kana_romaji', 'romaji_kana', 'kana_confuse', 'kana_confuse']
      : ['kana_romaji', 'romaji_kana'];
    const q = G[kinds[i % kinds.length]].make(k) || G.kana_romaji.make(k);
    if (q) out.push(wrapQ(q));
  });

  sample(QUIZ.KANA_RULES, nRule).forEach(r => {
    const q = G.kana_rule.make(r);
    if (q) out.push(wrapQ(q));
  });

  sample(QUIZ.KATA_WORDS, nWord).forEach((v, i) => {
    const q = (i % 2 ? G.kata_spell : G.kata_word).make(v);
    if (q) out.push(wrapQ(q));
  });

  return shuffle(out).slice(0, n);
}

const EXAM_MODES = {
  full: {
    label: 'Đề đầy đủ', desc: '~70 câu · 105 phút · chấm điểm chuẩn JLPT',
    build: () => [
      { key: 'moji', name: '文字・語彙', vi: 'Chữ viết – Từ vựng', minutes: 25, group: 'A', questions: shuffle([].concat(
          genQ('kanji_reading', 4), genQ('vocab_reading', 5), genQ('orthography', 5),
          genQ('meaning_vocab', 8), genQ('vocab_meaning', 6))) },
      { key: 'bunpou', name: '文法・読解', vi: 'Ngữ pháp – Đọc hiểu', minutes: 50, group: 'A', questions: [].concat(
          shuffle([].concat(genQ('particle', 6), genQ('grammar_usage', 6), genQ('conjugation', 4), genQ('grammar_meaning', 4))),
          readingBlock(3)) },
      { key: 'choukai', name: '聴解', vi: 'Nghe hiểu', minutes: 30, group: 'B', questions: listeningBlock(8, 6) }
    ]
  },
  moji: {
    label: 'Chỉ 文字・語彙', desc: '28 câu · 25 phút',
    build: () => [{ key: 'moji', name: '文字・語彙', vi: 'Chữ viết – Từ vựng', minutes: 25, group: 'A', questions: shuffle([].concat(
      genQ('kanji_reading', 5), genQ('vocab_reading', 6), genQ('orthography', 6), genQ('meaning_vocab', 6), genQ('vocab_meaning', 5))) }]
  },
  bunpou: {
    label: 'Chỉ 文法・読解', desc: '27 câu · 50 phút',
    build: () => [{ key: 'bunpou', name: '文法・読解', vi: 'Ngữ pháp – Đọc hiểu', minutes: 50, group: 'A', questions: [].concat(
      shuffle([].concat(genQ('particle', 7), genQ('grammar_usage', 7), genQ('conjugation', 4), genQ('grammar_meaning', 4))), readingBlock(3)) }]
  },
  choukai: {
    label: 'Chỉ 聴解', desc: '14 câu · 30 phút · dùng giọng đọc máy',
    build: () => [{ key: 'choukai', name: '聴解', vi: 'Nghe hiểu', minutes: 30, group: 'B', questions: listeningBlock(8, 6) }]
  },
  kana: {
    label: 'Đề bảng chữ cái', desc: '40 câu · 15 phút · hiragana + katakana + quy tắc đọc',
    scoring: 'percent', pass: 90,
    build: (o) => [{ key: 'kana', name: 'かな テスト', vi: 'Hiragana + Katakana', minutes: (o && o.timeless) ? 15 : Math.max(6, Math.round((clamp((o && o.n) || 40, 10, 120)) * 0.375)),
      group: 'A', questions: kanaExamQuestions(o) }]
  },
  quick: {
    label: 'Mini test', desc: '20 câu · 15 phút · kiểm tra nhanh phong độ',
    build: () => [{ key: 'quick', name: 'ミニテスト', vi: 'Kiểm tra nhanh', minutes: 15, group: 'A', questions: shuffle([].concat(
      genQ('kanji_reading', 3), genQ('orthography', 3), genQ('meaning_vocab', 4),
      genQ('particle', 4), genQ('grammar_usage', 3), genQ('conjugation', 3))) }]
  }
};

/* ---------------- Màn hình thi ---------------- */
V.exam = function (root, params) {
  const hist = N.state().exams || [];

  function intro() {
    const last = hist[hist.length - 1];
    root.innerHTML = `
      <div class="hero">
        <h1>Thi thử JLPT N5</h1>
        <p class="sub">${esc(DATA.exam.description_vi || '')}</p>
        <div class="row">
          <span class="tag">Tổng ${(DATA.exam.scoring || {}).total_max || 180} điểm</span>
          <span class="tag">Đỗ từ ${(DATA.exam.scoring || {}).pass_total || 80} điểm</span>
          <span class="tag">Điểm liệt: A ≥ 38 · B ≥ 19</span>
        </div>
      </div>

      <div class="section-head"><h2>Chọn kiểu đề</h2>${last ? `<span class="tiny dim">Lần gần nhất: ${esc(last.date)} — ${last.total}/180 ${last.pass ? '✅' : '❌'}</span>` : ''}</div>
      <div class="grid g2">
        ${Object.keys(EXAM_MODES).map(k => `
          <div class="mod-card" data-mode="${k}">
            <span class="em">${k === 'full' ? '🏯' : k === 'choukai' ? '🎧' : k === 'quick' ? '⚡' : k === 'kana' ? 'あ' : '📄'}</span>
            <h3>${esc(EXAM_MODES[k].label)}</h3>
            <p>${esc(EXAM_MODES[k].desc)}</p>
          </div>`).join('')}
      </div>

      <div class="card" style="margin-top:16px">
        <div class="spread">
          <div>
            <h3>Cách tính điểm</h3>
            <p class="tiny dim" style="margin:6px 0 0">${esc((DATA.exam.scoring || {}).note_vi || '')}</p>
          </div>
          <label class="row" style="gap:8px"><span class="tiny">Tính giờ</span>
            <span class="switch"><input type="checkbox" id="exTimed" checked><i></i></span></label>
        </div>
        <div class="grid g2" style="margin-top:14px">
          ${((DATA.exam.scoring || {}).groups || []).map(g => `
            <div class="stat"><div class="k">Nhóm ${esc(g.group)}</div>
              <div class="v">${g.max}<small> điểm tối đa</small></div>
              <div class="tiny dim">${esc(g.name_vi)} · tối thiểu ${g.min_required}</div></div>`).join('')}
        </div>
        <p class="tiny dim" style="margin-top:12px">🎧 Phần nghe dùng giọng đọc tổng hợp của trình duyệt (không phải file thu âm thật) — hãy bật loa và kiểm tra giọng tiếng Nhật trong Cài đặt.</p>
      </div>

      ${hist.length ? `
        <div class="section-head"><h2>Lịch sử thi thử</h2><button class="btn sm ghost" id="clearHist">Xoá lịch sử</button></div>
        <div class="list">
          ${hist.slice().reverse().slice(0, 12).map(h => `
            <div class="item">
              <span class="lead sm">${h.pass ? '✅' : '❌'}</span>
              <div class="body"><div class="t">${h.total}/180 — ${esc(EXAM_MODES[h.mode] ? EXAM_MODES[h.mode].label : h.mode)}</div>
                <div class="s">${esc(h.date)} · A: ${h.scoreA}/120 · B: ${h.scoreB}/60 · đúng ${h.correct}/${h.totalQ}</div></div>
            </div>`).join('')}
        </div>` : ''}`;

    root.querySelectorAll('[data-mode]').forEach(c => c.onclick = () => {
      const timed = root.querySelector('#exTimed').checked;
      startExam(c.dataset.mode, timed);
    });
    const ch = root.querySelector('#clearHist');
    if (ch) ch.onclick = () => { N.state().exams = []; N.save(); intro(); N.toast('Đã xoá lịch sử thi thử'); };
  }

  function startExam(mode, timed, opt) {
    const sections = EXAM_MODES[mode].build(opt || {}).filter(s => s.questions.length);
    if (!sections.length) { N.toast('Không dựng được đề, thử lại nhé', 'err'); return; }
    const answers = sections.map(s => new Array(s.questions.length).fill(null));
    let si = 0, timer = null, left = 0;

    function runSection() {
      const sec = sections[si];
      left = sec.minutes * 60;
      root.innerHTML = `
        <div class="exam-timer" id="exTimer">
          <div>
            <div class="tiny dim">PHẦN ${si + 1}/${sections.length}</div>
            <div class="jp" style="font-weight:700">${esc(sec.name)} <span class="tiny dim">${esc(sec.vi)}</span></div>
          </div>
          <div class="clock" id="exClock" style="margin-left:auto">${timed ? fmtDur(left) : '∞'}</div>
          <button class="btn sm primary" id="exSubmit">Nộp phần này</button>
        </div>
        <div class="card" style="margin-bottom:14px">
          <div class="spread"><span class="tiny dim">Câu đã làm: <b id="exDone">0</b>/${sec.questions.length}</span>
            <button class="btn sm ghost" id="exQuit">Thoát</button></div>
          <div class="qnav" id="exNav" style="margin-top:10px"></div>
        </div>
        <div class="card" id="exPaper"></div>`;

      const paper = root.querySelector('#exPaper');
      let lastPassage = null;
      paper.innerHTML = sec.questions.map((q, i) => {
        let head = '';
        if (q.passage && q.passage.id !== lastPassage) {
          lastPassage = q.passage.id;
          head = `<div class="ex" style="margin:18px 0"><div class="tiny dim" style="margin-bottom:6px">Đoạn văn — ${esc(q.passage.type)}</div>
                   <div class="jp" style="line-height:2">${esc(q.passage.jp)}</div></div>`;
        }
        return head + `
          <div class="exam-q" id="exq${i}">
            <div class="no">問 ${i + 1} · ${esc(q.label)}</div>
            <div class="body ${q.promptCls || ''}">${q.promptHTML}</div>
            ${q.sub ? `<div class="tiny dim" style="margin:-8px 0 12px">${esc(q.sub)}</div>` : ''}
            ${q.audio ? `<div style="margin:-6px 0 14px"><button class="btn sm" data-audio="${esc(q.audio)}">🔊 Nghe</button>
              <span class="tiny dim" style="margin-left:8px">có thể nghe lại nhiều lần</span></div>` : ''}
            <div class="exam-opts">
              ${q.options.map((o, k) => `<div class="exam-opt" data-q="${i}" data-o="${k}"><span class="n">${k + 1}</span><span class="${q.optJp ? 'jp' : ''}">${esc(o)}</span></div>`).join('')}
            </div>
          </div>`;
      }).join('');

      paper.querySelectorAll('[data-audio]').forEach(b => b.onclick = () => TTS.speak(b.dataset.audio));
      paper.querySelectorAll('.exam-opt').forEach(el => el.onclick = () => {
        const qi = Number(el.dataset.q), oi = Number(el.dataset.o);
        answers[si][qi] = oi;
        paper.querySelectorAll(`.exam-opt[data-q="${qi}"]`).forEach(x => x.classList.remove('sel'));
        el.classList.add('sel');
        syncNav();
      });

      const nav = root.querySelector('#exNav');
      nav.innerHTML = sec.questions.map((q, i) => `<button data-go="${i}">${i + 1}</button>`).join('');
      nav.querySelectorAll('[data-go]').forEach(b => b.onclick = () => {
        const el = root.querySelector('#exq' + b.dataset.go);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      function syncNav() {
        const done = answers[si].filter(x => x !== null).length;
        root.querySelector('#exDone').textContent = done;
        nav.querySelectorAll('[data-go]').forEach((b, i) => b.classList.toggle('done', answers[si][i] !== null));
      }
      syncNav();

      root.querySelector('#exQuit').onclick = () => { clearInterval(timer); TTS.stop(); intro(); };
      root.querySelector('#exSubmit').onclick = () => confirmSubmit();

      clearInterval(timer);
      if (timed) {
        timer = setInterval(() => {
          left--;
          const c = root.querySelector('#exClock');
          if (!c) { clearInterval(timer); return; }
          c.textContent = fmtDur(left);
          if (left <= 60) root.querySelector('#exTimer').classList.add('warn');
          if (left <= 0) { clearInterval(timer); N.toast('Hết giờ! Tự động nộp bài.', 'err'); nextSection(); }
        }, 1000);
      }

      function confirmSubmit() {
        const blank = answers[si].filter(x => x === null).length;
        if (blank) {
          const m = N.openModal(`
            <h2>Nộp phần này?</h2>
            <p class="muted">Bạn còn <b>${blank}</b> câu chưa trả lời. Câu bỏ trống sẽ bị tính sai.</p>
            <div class="row" style="justify-content:flex-end;margin-top:16px">
              <button class="btn ghost" id="mCancel">Quay lại làm</button>
              <button class="btn primary" id="mOk">Nộp bài</button>
            </div>`);
          m.querySelector('#mCancel').onclick = N.closeModal;
          m.querySelector('#mOk').onclick = () => { N.closeModal(); nextSection(); };
        } else nextSection();
      }
    }

    function nextSection() {
      clearInterval(timer);
      TTS.stop();
      si++;
      if (si < sections.length) breakScreen();
      else finish();
    }

    function breakScreen() {
      const sec = sections[si];
      root.innerHTML = `
        <div class="card pad-lg center">
          <div style="font-size:44px">☕</div>
          <h1 style="margin:10px 0">Phần tiếp theo</h1>
          <p class="muted"><span class="jp" style="font-size:20px;font-weight:700">${esc(sec.name)}</span> — ${esc(sec.vi)}<br>
            ${sec.questions.length} câu · ${sec.minutes} phút${sec.key === 'choukai' ? ' · nhớ bật loa 🔊' : ''}</p>
          <button class="btn primary lg" id="exGo" style="margin-top:16px">Bắt đầu phần ${si + 1}</button>
        </div>`;
      root.querySelector('#exGo').onclick = runSection;
    }

    function finish() {
      const percentMode = EXAM_MODES[mode].scoring === 'percent';
      let correctA = 0, totalA = 0, correctB = 0, totalB = 0, correct = 0, totalQ = 0;
      const wrongIds = [];
      sections.forEach((sec, k) => {
        sec.questions.forEach((q, i) => {
          const ok = answers[k][i] === q.answer;
          totalQ++; if (ok) correct++;
          if (sec.group === 'B') { totalB++; if (ok) correctB++; }
          else { totalA++; if (ok) correctA++; }
          if (!ok && q.srcId) wrongIds.push(q.srcId);
          if (q.srcId && DATA.byId[q.srcId]) {
            N.logAnswer(q.srcId, ok);
            if (!ok) { const c = SRS.ensure(q.srcId); c.i = 0; c.d = N.todayKey(); }
          }
        });
      });
      const accuracy = pct(correct, totalQ);
      const scoreA = totalA ? Math.round((correctA / totalA) * 120) : 0;
      const scoreB = totalB ? Math.round((correctB / totalB) * 60) : 0;
      const hasA = totalA > 0, hasB = totalB > 0;
      const total = (hasA ? scoreA : 0) + (hasB ? scoreB : 0);
      const passA = !hasA || scoreA >= 38;
      const passB = !hasB || scoreB >= 19;
      const passMark = EXAM_MODES[mode].pass || 90;
      const pass = percentMode ? accuracy >= passMark : (passA && passB && ((hasA && hasB) ? total >= 80 : true));
      const wrongItems = Array.from(new Set(wrongIds)).map(id => DATA.byId[id]).filter(Boolean);
      const SCOPE_VI = { both: 'cả 2 bảng', hiragana: 'hiragana', katakana: 'katakana' };

      if (percentMode) {
        const st = N.state();
        st.kanaExams = st.kanaExams || [];
        st.kanaExams.push({
          date: new Date().toLocaleString('vi-VN'), scope: (opt && opt.scope) || 'both',
          correct, totalQ, acc: accuracy, ts: Date.now()
        });
      } else {
        N.state().exams.push({
          date: new Date().toLocaleString('vi-VN'), mode, scoreA, scoreB, total, pass,
          correct, totalQ, ts: Date.now()
        });
      }
      N.logDay({ quiz: 1 });
      N.save();
      QUIZ.SFX.done();

      const scopeLabel = SCOPE_VI[(opt && opt.scope) || 'both'];
      const kanaHist = (N.state().kanaExams || []).slice().reverse().slice(0, 6);

      root.innerHTML = percentMode ? `
        <div class="verdict-big ${pass ? 'pass' : 'fail'}">
          ${pass ? '🎉 ĐẠT — ' : '📚 CẦN ÔN THÊM — '}${accuracy}%
          <span style="font-size:18px;font-weight:600">(${correct}/${totalQ} câu · ${esc(scopeLabel)})</span>
        </div>
        <div class="grid" style="gap:12px;margin-top:16px">
          <div class="score-row"><span class="lbl">Độ chính xác</span>
            ${N.barHTML(accuracy, accuracy >= passMark ? 'green' : accuracy >= 75 ? 'amber' : '')}
            <span class="num" style="color:${accuracy >= passMark ? 'var(--matcha)' : accuracy >= 75 ? 'var(--amber)' : 'var(--coral)'}">${accuracy}%</span></div>
          <div class="score-row"><span class="lbl">Số câu sai</span>
            ${N.barHTML(pct(totalQ - correct, totalQ), 'amber')}
            <span class="num">${totalQ - correct}</span></div>
        </div>
        <div class="card" style="margin-top:14px">
          <h3>Nhận xét</h3>
          <p class="muted" style="margin:8px 0 0">${
            accuracy >= 95 ? 'Xuất sắc — bạn đã thuộc chắc phần này. Tối nay cứ tự tin làm bài.'
            : accuracy >= 90 ? 'Rất tốt. Chỉ còn vài chữ lẻ, xem lại danh sách sai bên dưới là đủ.'
            : accuracy >= 75 ? 'Gần ổn. Ôn ngay các chữ sai bên dưới rồi làm lại một đề nữa.'
            : 'Còn hổng khá nhiều. Học lại bằng flashcard theo từng hàng (あ→か→さ…) rồi quay lại thi.'}</p>
          ${wrongItems.length ? `<div class="chips" style="margin-top:14px">
            ${wrongItems.map(it => `<span class="chip" data-id="${it.id}">
              <b class="jp" style="font-size:17px">${esc(it.char || it.word || '')}</b> ${esc(it.romaji || it.meaning_vi || '')}</span>`).join('')}
          </div>` : ''}
        </div>
        <div class="row" style="margin-top:16px">
          <button class="btn primary" id="exAgain">Làm đề khác</button>
          ${wrongItems.length ? `<button class="btn pink" id="exFlash">🃏 Học lại ${wrongItems.length} chữ sai</button>` : ''}
          <button class="btn" id="exWrong">🎯 Luyện lại câu sai</button>
          <button class="btn ghost" id="exHome">Về trang thi thử</button>
        </div>
        ${kanaHist.length > 1 ? `
          <div class="section-head"><h2>Lịch sử đề kana</h2></div>
          <div class="list">
            ${kanaHist.map(h => `<div class="item">
              <span class="lead sm">${h.acc >= 90 ? '✅' : h.acc >= 75 ? '⚠️' : '❌'}</span>
              <div class="body"><div class="t">${h.acc}% — ${h.correct}/${h.totalQ} câu</div>
                <div class="s">${esc(h.date)} · ${esc(SCOPE_VI[h.scope] || h.scope)}</div></div></div>`).join('')}
          </div>` : ''}
        <div class="section-head"><h2>Xem lại bài làm</h2></div>
        <div class="card" id="exReview"></div>` : `
        <div class="verdict-big ${pass ? 'pass' : 'fail'}">
          ${pass ? '🎉 ĐỖ — ' : '📚 CHƯA ĐẠT — '}${total}/${(hasA ? 120 : 0) + (hasB ? 60 : 0)} điểm
        </div>
        <div class="grid" style="gap:12px;margin-top:16px">
          ${hasA ? `<div class="score-row">
            <span class="lbl">Nhóm A · Chữ–Từ–Ngữ pháp–Đọc</span>
            ${N.barHTML(pct(scoreA, 120), scoreA >= 38 ? 'green' : '')}
            <span class="num" style="color:${scoreA >= 38 ? 'var(--matcha)' : 'var(--coral)'}">${scoreA}/120</span></div>` : ''}
          ${hasB ? `<div class="score-row">
            <span class="lbl">Nhóm B · Nghe hiểu</span>
            ${N.barHTML(pct(scoreB, 60), scoreB >= 19 ? 'green' : '')}
            <span class="num" style="color:${scoreB >= 19 ? 'var(--matcha)' : 'var(--coral)'}">${scoreB}/60</span></div>` : ''}
          <div class="score-row"><span class="lbl">Số câu đúng</span>${N.barHTML(accuracy)}
            <span class="num">${correct}/${totalQ}</span></div>
        </div>
        <div class="card" style="margin-top:14px">
          <h3>Nhận xét</h3>
          <p class="muted" style="margin:8px 0 0">${
            pass ? 'Bạn đã vượt cả điểm sàn tổng lẫn điểm liệt từng nhóm. Giữ nhịp ôn SRS mỗi ngày để không tụt lại.'
                 : !passA ? 'Nhóm A chưa đạt điểm liệt (38). Ưu tiên ôn kanji – từ vựng – trợ từ trước.'
                 : !passB ? 'Nhóm B (nghe) chưa đạt điểm liệt (19). Hãy luyện nghe mỗi ngày 10 phút.'
                 : 'Từng nhóm đã qua điểm liệt nhưng tổng chưa tới 80. Cần nâng đều cả hai nhóm.'}</p>
        </div>
        <div class="row" style="margin-top:16px">
          <button class="btn primary" id="exAgain">Thi lại</button>
          <button class="btn pink" id="exWrong">Ôn câu sai</button>
          <button class="btn ghost" id="exHome">Về trang thi thử</button>
        </div>
        <div class="section-head"><h2>Xem lại bài làm</h2></div>
        <div class="card" id="exReview"></div>`;

      root.querySelectorAll('.chip[data-id]').forEach(el => el.onclick = () => V.showDetail(DATA.byId[el.dataset.id]));
      function flashWrong() { V.startCards(root, shuffle(wrongItems), { onQuit: intro, onAgain: flashWrong }); }
      const flashBtn = root.querySelector('#exFlash');
      if (flashBtn) flashBtn.onclick = flashWrong;

      const rev = root.querySelector('#exReview');
      rev.innerHTML = sections.map((sec, k) => `
        <h3 class="jp" style="margin:10px 0">${esc(sec.name)}</h3>
        ${sec.questions.map((q, i) => {
          const ua = answers[k][i], ok = ua === q.answer;
          return `<div class="exam-q">
            <div class="no">${ok ? '✅' : '❌'} 問 ${i + 1} · ${esc(q.label)}</div>
            ${q.passage ? `<div class="tiny dim jp" style="margin:6px 0">${esc(q.passage.jp)}</div>` : ''}
            <div class="body">${q.promptHTML}</div>
            <div class="exam-opts">
              ${q.options.map((o, x) => `<div class="exam-opt ${x === q.answer ? 'ok' : (x === ua ? 'bad' : '')}">
                <span class="n">${x + 1}</span><span class="${q.optJp ? 'jp' : ''}">${esc(o)}</span></div>`).join('')}
            </div>
            <div class="tiny muted" style="margin-top:10px">${q.explain || ''}</div>
          </div>`;
        }).join('')}`).join('');

      root.querySelector('#exAgain').onclick = () => startExam(mode, timed, opt);
      root.querySelector('#exHome').onclick = intro;
      function drillWrong() {
        const ids = [];
        sections.forEach((sec, k) => sec.questions.forEach((q, i) => { if (answers[k][i] !== q.answer && q.srcId) ids.push(q.srcId); }));
        const items = Array.from(new Set(ids)).map(id => DATA.byId[id]).filter(Boolean);
        if (!items.length) { N.toast('Không có câu sai nào gắn với mục dữ liệu 👍', 'ok'); return; }
        const qs = QUIZ.buildSet({ items: shuffle(items), count: Math.min(items.length, 20) });
        QUIZ.renderQuiz(root, qs, { onQuit: intro, onAgain: drillWrong });
      }
      root.querySelector('#exWrong').onclick = drillWrong;
    }

    breakScreen();
  }

  if (params.mode && EXAM_MODES[params.mode]) {
    startExam(params.mode, params.timed !== '0', {
      scope: params.scope || 'both',
      n: Number(params.n) || 40
    });
    return;
  }
  intro();
};

/* ---------------- THỐNG KÊ ---------------- */
V.stats = function (root) {
  const s = N.state();
  const decks = Object.keys(DECKS);
  const prog = {}; decks.forEach(d => prog[d] = SRS.deckProgress(d));

  /* độ chính xác 14 ngày gần nhất */
  const days = [];
  for (let k = 13; k >= 0; k--) {
    const d = new Date(); d.setDate(d.getDate() - k);
    const key = N.todayKey(d);
    const r = s.daily[key] || {};
    days.push({ key, label: (d.getMonth() + 1) + '/' + d.getDate(), acc: r.total ? Math.round((r.correct / r.total) * 100) : null, vol: (r.rev || 0) + (r.total || 0) });
  }
  const maxVol = Math.max(10, ...days.map(d => d.vol));

  /* chính xác theo bộ */
  const deckAcc = {};
  decks.forEach(d => deckAcc[d] = { c: 0, w: 0 });
  Object.keys(s.seen).forEach(id => {
    const d = deckOf(id);
    if (deckAcc[d]) { deckAcc[d].c += s.seen[id].c; deckAcc[d].w += s.seen[id].w; }
  });

  const totalRev = Object.values(s.daily).reduce((a, r) => a + (r.rev || 0) + (r.total || 0), 0);
  const weak = SRS.weakest(15);
  const exams = (s.exams || []).slice().reverse();

  root.innerHTML = `
    <div class="section-head"><h1>Thống kê</h1><span class="tiny dim">Bắt đầu từ ${new Date(s.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span></div>

    <div class="grid g4">
      <div class="stat"><div class="k">Tổng lượt ôn</div><div class="v">${totalRev}</div></div>
      <div class="stat"><div class="k">Chuỗi hiện tại</div><div class="v">${s.streak.cur || 0}<small> ngày</small></div></div>
      <div class="stat"><div class="k">Kỷ lục</div><div class="v">${s.streak.best || 0}<small> ngày</small></div></div>
      <div class="stat"><div class="k">Chính xác 14 ngày</div><div class="v">${V.accuracyRecent(14)}<small>%</small></div></div>
    </div>

    <div class="section-head"><h2>Hoạt động 14 ngày</h2></div>
    <div class="card">
      <svg class="chart" viewBox="0 0 700 200" preserveAspectRatio="none" style="height:200px">
        ${days.map((d, i) => {
          const w = 700 / days.length, x = i * w, h = (d.vol / maxVol) * 150;
          return `<rect x="${x + w * 0.18}" y="${165 - h}" width="${w * 0.64}" height="${Math.max(2, h)}" rx="4" fill="var(--indigo)" opacity="${d.vol ? .85 : .2}"></rect>
                  <text class="lbl" x="${x + w / 2}" y="182" text-anchor="middle">${d.label}</text>
                  ${d.acc !== null ? `<text class="lbl" x="${x + w / 2}" y="${158 - h}" text-anchor="middle" fill="var(--matcha)">${d.acc}%</text>` : ''}`;
        }).join('')}
      </svg>
      <p class="tiny dim">Cột = số lượt học/ôn · số xanh = % chính xác của ngày đó.</p>
    </div>

    <div class="grid g2" style="margin-top:16px">
      <div class="card">
        <h2>Tiến độ theo bộ</h2>
        <div class="grid" style="gap:14px;margin-top:12px">
          ${decks.map(d => {
            const p = prog[d], a = deckAcc[d], acc = a.c + a.w ? Math.round(a.c / (a.c + a.w) * 100) : null;
            return `<div>
              <div class="spread tiny"><span><b>${DECKS[d].icon} ${DECKS[d].label}</b> ${p.learned}/${p.total}</span>
                <span class="dim">${acc === null ? 'chưa có dữ liệu' : 'chính xác ' + acc + '%'}</span></div>
              ${N.barHTML(p.pct)}
              <div class="tiny dim" style="margin-top:4px">Đã thuộc: ${p.mastered} (${p.mpct}%)</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="card">
        <h2>90 ngày qua</h2>
        <div class="heat" style="margin-top:14px">${V.heatHTML(90)}</div>
        <h3 style="margin-top:20px">Phân bố trình độ thẻ</h3>
        ${(() => {
          let m = [0, 0, 0, 0];
          decks.forEach(d => DECKS[d].items().forEach(it => m[SRS.mastery(it.id)]++));
          const tot = m.reduce((a, b) => a + b, 0);
          const L = ['Chưa học', 'Mới học', 'Đang nhớ', 'Đã thuộc'];
          const C = ['var(--line-strong)', 'var(--coral)', 'var(--amber)', 'var(--matcha)'];
          return `<div style="display:flex;height:14px;border-radius:99px;overflow:hidden;margin:12px 0">
            ${m.map((v, i) => `<div style="width:${pct(v, tot)}%;background:${C[i]}"></div>`).join('')}
          </div>
          <div class="chips">${m.map((v, i) => `<span class="tag" style="border-color:${C[i]}">${L[i]}: ${v}</span>`).join('')}</div>`;
        })()}
      </div>
    </div>

    ${exams.length ? `
      <div class="section-head"><h2>Điểm thi thử</h2></div>
      <div class="card">
        <svg class="chart" viewBox="0 0 700 180" style="height:180px">
          <line x1="0" y1="${170 - 80 / 180 * 150}" x2="700" y2="${170 - 80 / 180 * 150}" stroke="var(--matcha)" stroke-dasharray="4 4" opacity=".6"></line>
          <text class="lbl" x="4" y="${166 - 80 / 180 * 150}" fill="var(--matcha)">mốc đỗ 80</text>
          ${exams.slice(0, 12).reverse().map((e, i, arr) => {
            const w = 700 / Math.max(arr.length, 1), x = i * w, h = (e.total / 180) * 150;
            return `<rect x="${x + w * .25}" y="${170 - h}" width="${w * .5}" height="${Math.max(2, h)}" rx="4" fill="${e.pass ? 'var(--matcha)' : 'var(--coral)'}" opacity=".85"></rect>
                    <text class="lbl" x="${x + w / 2}" y="${164 - h}" text-anchor="middle">${e.total}</text>`;
          }).join('')}
        </svg>
      </div>` : ''}

    ${weak.length ? `
      <div class="section-head"><h2>15 mục hay sai nhất</h2><button class="btn sm pink" id="stDrill">Luyện ngay</button></div>
      <div class="list">
        ${weak.map(w => { const it = DATA.byId[w.id], f = itemFace(it);
          return `<div class="item" data-id="${w.id}">
            <span class="lead ${String(f.front).length > 4 ? 'sm' : ''}">${esc(f.front)}</span>
            <div class="body"><div class="t">${esc(f.meaning)}</div><div class="s">${esc(f.reading)}</div></div>
            <div class="tail"><span class="tag" style="color:var(--coral)">sai ${w.w}</span><span class="tag">đúng ${w.c}</span></div>
          </div>`; }).join('')}
      </div>` : '<div class="empty"><span class="em">📊</span>Chưa đủ dữ liệu. Hãy luyện tập vài lượt để xem phân tích điểm yếu.</div>'}`;

  root.querySelectorAll('.item[data-id]').forEach(el => el.onclick = () => V.showDetail(DATA.byId[el.dataset.id]));
  const dr = root.querySelector('#stDrill');
  if (dr) dr.onclick = () => { location.hash = '#/quiz?weak=1'; };
};

/* ---------------- CÀI ĐẶT ---------------- */
V.settings = function (root) {
  const st = N.settings();
  const s = N.state();
  const cards = Object.keys(s.srs).length;

  root.innerHTML = `
    <div class="section-head"><h1>Cài đặt</h1></div>

    <div class="card">
      <h2>Giao diện</h2>
      <div class="grid g2" style="margin-top:14px">
        <label class="field"><span>Chủ đề</span>
          <select id="setTheme">
            <option value="dark" ${st.theme === 'dark' ? 'selected' : ''}>Tối (Ai-iro)</option>
            <option value="light" ${st.theme === 'light' ? 'selected' : ''}>Sáng (Washi)</option>
          </select></label>
        <label class="field"><span>Mục tiêu mỗi ngày</span>
          <select id="setGoal">${[10, 20, 30, 50, 80, 120].map(n => `<option value="${n}" ${n === st.dailyGoal ? 'selected' : ''}>${n} lượt/ngày</option>`).join('')}</select></label>
      </div>
      <div class="spread" style="margin-top:16px"><div><b>Hiện romaji</b><div class="tiny dim">Tắt để tập đọc kana thật sự</div></div>
        <span class="switch"><input type="checkbox" id="setRomaji" ${st.showRomaji ? 'checked' : ''}><i></i></span></div>
      <div class="spread" style="margin-top:14px"><div><b>Tự động đọc</b><div class="tiny dim">Phát âm khi hiện thẻ/câu hỏi</div></div>
        <span class="switch"><input type="checkbox" id="setAuto" ${st.autoSpeak ? 'checked' : ''}><i></i></span></div>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>Phát âm (giọng máy)</h2>
      <p class="tiny dim">Trạng thái: <b id="ttsState">${TTS.ready ? 'đã tìm thấy giọng tiếng Nhật ✅' : 'chưa thấy giọng ja-JP — hãy cài gói giọng tiếng Nhật của hệ điều hành'}</b></p>
      <label class="field" style="margin-top:12px"><span>Tốc độ đọc: <b id="rateVal">${st.ttsRate}</b></span>
        <input type="range" id="setRate" min="0.5" max="1.3" step="0.05" value="${st.ttsRate}" style="width:100%"></label>
      <button class="btn sm" id="ttsTest" style="margin-top:10px">🔊 Nghe thử: 日本語を勉強します</button>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>Kỳ thi</h2>
      <label class="field" style="margin-top:12px"><span>Ngày thi JLPT của bạn</span>
        <input type="date" id="setExam" value="${esc(st.examDate)}"></label>
      <p class="tiny dim" style="margin-top:8px">Đặt ngày thi để trang chủ đếm ngược và gợi ý nhịp học.</p>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>Dữ liệu học tập</h2>
      <p class="muted tiny">Tiến độ lưu trong trình duyệt này (localStorage). Đang theo dõi <b>${cards}</b> thẻ SRS,
        <b>${Object.keys(s.daily).length}</b> ngày hoạt động, <b>${(s.exams || []).length}</b> lần thi thử.</p>
      <div class="row" style="margin-top:14px">
        <button class="btn" id="btnExport">⬇ Xuất tiến độ (.json)</button>
        <button class="btn" id="btnImport">⬆ Nhập tiến độ</button>
        <input type="file" id="fileImport" accept="application/json" hidden>
        <button class="btn ghost" id="btnReset" style="color:var(--coral)">🗑 Xoá toàn bộ tiến độ</button>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>Phím tắt</h2>
      <div class="kv" style="grid-template-columns:120px 1fr">
        <span class="k">/</span><span class="v plain">Mở tìm kiếm nhanh</span>
        <span class="k">Space</span><span class="v plain">Lật thẻ flashcard</span>
        <span class="k">1 – 4</span><span class="v plain">Chọn đáp án / chấm thẻ</span>
        <span class="k">Enter</span><span class="v plain">Câu tiếp theo</span>
        <span class="k">S</span><span class="v plain">Nghe phát âm</span>
        <span class="k">T</span><span class="v plain">Đổi sáng/tối</span>
      </div>
    </div>

    <p class="tiny dim center" style="margin-top:18px">
      ${esc(DATA.meta.title || 'JLPT N5')} · dữ liệu v${esc(DATA.meta.version || '1.0.0')} ·
      ${DATA.kanji.length} kanji · ${DATA.vocab.length} từ · ${DATA.grammar.length} ngữ pháp<br>
      ${esc(DATA.meta.note || '')}
    </p>`;

  root.querySelector('#setTheme').onchange = e => { N.setSetting('theme', e.target.value); App.applyTheme(); };
  root.querySelector('#setGoal').onchange = e => { N.setSetting('dailyGoal', Number(e.target.value)); App.refreshBadges(); };
  root.querySelector('#setRomaji').onchange = e => N.setSetting('showRomaji', e.target.checked);
  root.querySelector('#setAuto').onchange = e => N.setSetting('autoSpeak', e.target.checked);
  root.querySelector('#setExam').onchange = e => { N.setSetting('examDate', e.target.value); N.toast('Đã lưu ngày thi', 'ok'); };
  const rate = root.querySelector('#setRate');
  rate.oninput = e => { N.setSetting('ttsRate', Number(e.target.value)); root.querySelector('#rateVal').textContent = e.target.value; };
  root.querySelector('#ttsTest').onclick = () => {
    TTS.speak('日本語を勉強します');
    setTimeout(() => { root.querySelector('#ttsState').textContent = TTS.ready ? 'đã tìm thấy giọng tiếng Nhật ✅' : 'chưa thấy giọng ja-JP — đang dùng giọng mặc định'; }, 400);
  };

  root.querySelector('#btnExport').onclick = () => {
    const blob = new Blob([JSON.stringify(N.state(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'n5-dojo-tien-do-' + N.todayKey() + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    N.toast('Đã xuất file tiến độ', 'ok');
  };
  const fi = root.querySelector('#fileImport');
  root.querySelector('#btnImport').onclick = () => fi.click();
  fi.onchange = () => {
    const f = fi.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const obj = JSON.parse(r.result);
        if (!obj || typeof obj !== 'object') throw new Error('sai định dạng');
        localStorage.setItem(N.KEY, JSON.stringify(obj));
        N.toast('Đã nhập tiến độ — đang tải lại…', 'ok');
        setTimeout(() => location.reload(), 700);
      } catch (e) { N.toast('File không hợp lệ ❌', 'err'); }
    };
    r.readAsText(f);
  };
  root.querySelector('#btnReset').onclick = () => {
    const m = N.openModal(`
      <h2>Xoá toàn bộ tiến độ?</h2>
      <p class="muted">Toàn bộ lịch sử SRS, thống kê và kết quả thi thử sẽ mất vĩnh viễn. Nên xuất file sao lưu trước.</p>
      <div class="row" style="justify-content:flex-end;margin-top:18px">
        <button class="btn ghost" id="rCancel">Huỷ</button>
        <button class="btn" id="rOk" style="background:var(--coral);color:#fff;border-color:transparent">Xoá hết</button>
      </div>`);
    m.querySelector('#rCancel').onclick = N.closeModal;
    m.querySelector('#rOk').onclick = () => { N.resetAll(); N.closeModal(); N.toast('Đã xoá — bắt đầu lại từ đầu'); setTimeout(() => location.reload(), 600); };
  };
};

})(window);
