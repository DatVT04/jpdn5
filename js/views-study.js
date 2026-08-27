/* =============================================================
   N5 道場 — màn hình học: Trang chủ · SRS · Flashcard · Quiz ·
   Kana · Ngữ pháp · Tra cứu
   ============================================================= */
(function (global) {
'use strict';

const N = global.N5;
const { $, $$, DATA, DECKS, esc, shuffle, pick, sample, pct, clamp, SRS, TTS, itemFace, deckOf } = N;
const QUIZ = N.QUIZ;
const V = {};

/* ============ Chi tiết một mục (modal) ============ */
function detailHTML(it) {
  const deck = deckOf(it.id);
  const m = SRS.mastery(it.id);
  const mLabel = ['Chưa học', 'Mới học', 'Đang nhớ', 'Đã thuộc'][m];
  const card = SRS.card(it.id);
  let body = '';

  if (deck === 'kanji') {
    body = `
      <div class="detail-jp">${esc(it.char)}</div>
      <div class="center" style="margin-top:10px">${N.speakBtn(it.char, 'sm')}</div>
      <div class="kv">
        <span class="k">Hán Việt</span><span class="v plain"><b>${esc(it.hanviet)}</b></span>
        <span class="k">Nghĩa</span><span class="v plain">${esc(it.meaning_vi)}</span>
        <span class="k">Âm On</span><span class="v">${esc((it.onyomi || []).join('・') || '—')}</span>
        <span class="k">Âm Kun</span><span class="v">${esc((it.kunyomi || []).join('・') || '—')}</span>
        <span class="k">Số nét</span><span class="v plain">${it.strokes}</span>
        <span class="k">Nhóm</span><span class="v plain">${esc(DATA.cat.kanji[it.category] || it.category)}${it.core ? ' <span class="tag core">cốt lõi</span>' : ''}</span>
      </div>
      <h3 style="margin-top:18px">Từ ví dụ</h3>
      <div class="list" style="margin-top:8px">
        ${(it.examples || []).map(e => `
          <div class="item">
            <span class="lead sm">${esc(e.word)}</span>
            <div class="body"><div class="t">${esc(e.meaning_vi)}</div><div class="s">${esc(e.kana)} · ${esc(e.romaji)}</div></div>
            <div class="tail">${N.speakBtn(e.word)}</div>
          </div>`).join('')}
      </div>`;
  } else if (deck === 'vocab') {
    body = `
      <div class="detail-jp" style="font-size:52px">${esc(it.word)}</div>
      <div class="center" style="margin-top:8px"><span class="jp" style="color:var(--sakura);font-size:19px">${esc(it.kana)}</span></div>
      <div class="center" style="margin-top:10px">${N.speakBtn(it.word, 'sm')}</div>
      <div class="kv">
        <span class="k">Nghĩa</span><span class="v plain"><b>${esc(it.meaning_vi)}</b></span>
        <span class="k">Romaji</span><span class="v plain">${esc(it.romaji)}</span>
        <span class="k">Từ loại</span><span class="v plain">${esc(DATA.cat.pos[it.pos] || it.pos)}</span>
        <span class="k">Chủ đề</span><span class="v plain">${esc(DATA.cat.vocab_topic[it.topic] || it.topic)}</span>
      </div>
      ${it.conjugation ? `
        <h3 style="margin-top:18px">Bảng chia (nhóm ${it.verb_group})</h3>
        <div class="kv">
          ${Object.keys(it.conjugation).map(f => `
            <span class="k">${esc((QUIZ.FORM_LABEL[f] || f).split(' ')[1] || f)}</span>
            <span class="v">${esc(it.conjugation[f].kana)} <span class="tiny dim">${esc(it.conjugation[f].romaji)}</span></span>`).join('')}
        </div>` : ''}`;
  } else if (deck === 'grammar') {
    body = `
      <div class="center"><span class="jp" style="font-size:32px;font-weight:700">${esc(it.pattern)}</span></div>
      <div class="center muted" style="margin-top:6px">${esc(it.meaning_vi)}</div>
      <div class="center"><span class="gr-form">${esc(it.formation)}</span></div>
      <div class="ex">
        <div class="jp">${esc(it.example.jp)}</div>
        <div class="kana">${esc(it.example.kana)}</div>
        <div class="vi">${esc(it.example.vi)}</div>
        <div style="margin-top:8px">${N.speakBtn(it.example.jp)}</div>
      </div>
      <div class="tiny dim" style="margin-top:10px">Nhóm: ${esc(DATA.cat.grammar[it.category] || it.category)}</div>`;
  } else if (deck === 'counter') {
    body = `
      <div class="detail-jp" style="font-size:46px">${esc(it.counter)}</div>
      <div class="center muted" style="margin-top:8px">${esc(it.usage_vi)}</div>
      <div class="list" style="margin-top:14px">
        ${(it.readings || []).map((r, i) => `
          <div class="item"><span class="lead sm">${i + 1}</span>
            <div class="body"><div class="t jp">${esc(r)}</div></div>
            <div class="tail">${N.speakBtn(r.replace(/\s*\(.*\)/, ''))}</div>
          </div>`).join('')}
      </div>`;
  } else {
    body = `
      <div class="detail-jp">${esc(it.char)}</div>
      <div class="center" style="font-size:22px;margin-top:8px;letter-spacing:.06em">${esc(it.romaji)}</div>
      <div class="center" style="margin-top:10px">${N.speakBtn(it.char, 'sm')}</div>
      <div class="kv">
        <span class="k">Bảng</span><span class="v plain">${it.script === 'hiragana' ? 'Hiragana' : 'Katakana'}</span>
        <span class="k">Loại</span><span class="v plain">${esc(it.type)}</span>
      </div>`;
  }

  return `
    <div class="spread" style="margin-bottom:10px">
      <span class="tag">${esc((DECKS[deck] || {}).label || '')}</span>
      <button class="btn sm ghost" id="mClose">✕</button>
    </div>
    ${body}
    <div class="spread" style="margin-top:20px;padding-top:16px;border-top:1px solid var(--line)">
      <div class="tiny dim">Trạng thái: <b>${mLabel}</b>${card ? ` · ôn lại ${esc(card.d)} · ${card.i} ngày` : ''}</div>
      <div class="row">
        <button class="btn sm" id="mSrs">${card ? 'Ôn lại ngay' : '+ Thêm vào SRS'}</button>
      </div>
    </div>`;
}

function showDetail(it) {
  if (!it) return;
  const m = N.openModal(detailHTML(it));
  N.bindSpeak(m);
  m.querySelector('#mClose').onclick = N.closeModal;
  m.querySelector('#mSrs').onclick = () => {
    const c = SRS.ensure(it.id);
    c.i = 0; c.d = N.todayKey();
    N.save();
    N.toast('Đã thêm vào hàng đợi ôn tập ⚡', 'ok');
    N.closeModal();
    App.refreshBadges();
  };
}
V.showDetail = showDetail;

/* ============ Phiên thẻ ghi nhớ (dùng chung cho SRS & Flashcard) ============ */
function startCards(root, items, opt) {
  opt = opt || {};
  if (!items.length) {
    root.innerHTML = `<div class="empty"><span class="em">🌸</span>Không có thẻ nào ở đây. Hãy chọn bộ khác nhé.</div>`;
    return;
  }
  let i = 0, flipped = false, done = 0;
  const total = items.length;

  root.innerHTML = `
    <div class="q-top">
      <button class="btn sm ghost" id="cQuit">← Thoát</button>
      ${N.barHTML(0)}
      <span class="tiny dim" id="cCount">1/${total}</span>
    </div>
    <div class="fc-stage"><div class="fc" id="fcard"></div></div>
    <div class="grade-row" id="grades" style="visibility:hidden">
      <button class="grade" data-g="0"><b>Lại</b><span>&lt; 1 phút</span></button>
      <button class="grade" data-g="1"><b>Khó</b><span>1 ngày</span></button>
      <button class="grade" data-g="2"><b>Tốt</b><span>3 ngày</span></button>
      <button class="grade" data-g="3"><b>Dễ</b><span>6 ngày+</span></button>
    </div>
    <p class="center tiny dim" style="margin-top:14px">Space/click để lật · phím 1–4 để chấm · S để nghe</p>`;

  const bar = root.querySelector('.bar > i');
  const card = root.querySelector('#fcard');
  const grades = root.querySelector('#grades');
  root.querySelector('#cQuit').onclick = () => opt.onQuit && opt.onQuit();

  function draw() {
    const it = items[i];
    const deck = deckOf(it.id);
    const f = itemFace(it);
    flipped = false;
    card.classList.remove('flip');
    grades.style.visibility = 'hidden';
    bar.style.width = pct(done, items.length) + '%';
    root.querySelector('#cCount').textContent = (i + 1) + '/' + items.length;

    const mast = SRS.mastery(it.id);
    const back =
      deck === 'kanji' ? `
        <div class="fc-mean">${esc(it.hanviet)} · ${esc(it.meaning_vi)}</div>
        <div class="fc-kana">On: ${esc((it.onyomi || []).join('・') || '—')}　Kun: ${esc((it.kunyomi || []).join('・') || '—')}</div>
        ${(it.examples || [])[0] ? `<div class="fc-ex">${esc(it.examples[0].word)}（${esc(it.examples[0].kana)}）— ${esc(it.examples[0].meaning_vi)}</div>` : ''}`
      : deck === 'vocab' ? `
        <div class="fc-kana">${esc(it.kana)}</div>
        <div class="fc-mean">${esc(it.meaning_vi)}</div>
        ${N.settings().showRomaji ? `<div class="fc-romaji">${esc(it.romaji)}</div>` : ''}
        ${it.conjugation ? `<div class="fc-ex">ます: ${esc(it.conjugation.masu.kana)} · て: ${esc(it.conjugation.te.kana)} · た: ${esc(it.conjugation.ta.kana)} · ない: ${esc(it.conjugation.nai.kana)}</div>` : ''}`
      : deck === 'grammar' ? `
        <div class="fc-mean">${esc(it.meaning_vi)}</div>
        <div class="fc-kana">${esc(it.formation)}</div>
        <div class="fc-ex">${esc(it.example.jp)}<br><span class="tiny dim">${esc(it.example.vi)}</span></div>`
      : deck === 'counter' ? `
        <div class="fc-mean">${esc(it.usage_vi)}</div>
        <div class="fc-kana">${esc((it.readings || []).join('・'))}</div>`
      : `<div class="fc-mean" style="font-size:34px">${esc(it.romaji)}</div>
         <div class="fc-kana">${it.script === 'hiragana' ? 'Hiragana' : 'Katakana'} · ${esc(it.type)}</div>`;

    card.innerHTML = `
      <div class="fc-face front">
        <div class="fc-corner"><span>${esc((DECKS[deck] || {}).label || '')}</span>
          <span class="mastery-dot" data-m="${mast}"></span></div>
        <div class="fc-main ${String(f.front).length > 6 ? 'small' : ''}">${esc(f.front)}</div>
        ${deck === 'grammar' ? `<div class="fc-romaji">${esc(it.formation)}</div>` : ''}
        <div class="fc-hint">Nhấn để xem đáp án</div>
      </div>
      <div class="fc-face back">
        <div class="fc-corner"><span>${esc((DECKS[deck] || {}).label || '')}</span>${N.speakBtn(f.front)}</div>
        <div class="fc-main small">${esc(f.front)}</div>
        ${back}
      </div>`;
    N.bindSpeak(card);
    if (N.settings().autoSpeak) TTS.speak(f.front);
  }

  function flip() {
    if (flipped) return;
    flipped = true;
    card.classList.add('flip');
    grades.style.visibility = 'visible';
  }
  function grade(g) {
    if (!flipped) { flip(); return; }
    SRS.grade(items[i].id, g);
    done++;
    if (g === 0 && items.length < 400) items.push(items[i]);  // học lại cuối phiên
    i++;
    App.refreshBadges();
    if (i >= items.length) return finish();
    draw();
  }
  function finish() {
    N.QUIZ.SFX.done();
    root.innerHTML = `
      <div class="card pad-lg center">
        <div style="font-size:46px">🎉</div>
        <h1 style="margin:8px 0">Xong phiên học!</h1>
        <p class="muted">Bạn đã ôn <b>${done}</b> thẻ. Hệ thống SRS đã hẹn lịch ôn lại cho từng thẻ.</p>
        <div class="row" style="justify-content:center;margin-top:16px">
          <button class="btn primary" id="fAgain">Học tiếp</button>
          <button class="btn ghost" id="fBack">Quay lại</button>
        </div>
      </div>`;
    root.querySelector('#fAgain').onclick = () => opt.onAgain && opt.onAgain();
    root.querySelector('#fBack').onclick = () => opt.onQuit && opt.onQuit();
  }

  card.onclick = flip;
  grades.querySelectorAll('.grade').forEach(b => b.onclick = () => grade(Number(b.dataset.g)));
  function keys(e) {
    if (!document.body.contains(root)) { document.removeEventListener('keydown', keys); return; }
    if (e.target.tagName === 'INPUT') return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
    else if (/^[1-4]$/.test(e.key) && flipped) { e.preventDefault(); grade(Number(e.key) - 1); }
    else if (e.key.toLowerCase() === 's') TTS.speak(itemFace(items[i]).front);
  }
  document.addEventListener('keydown', keys);
  draw();
}
V.startCards = startCards;

/* ============ TRANG CHỦ ============ */
V.home = function (root) {
  const s = N.state();
  const t = N.todayStats();
  const goal = s.settings.dailyGoal || 30;
  const doneToday = (t.rev || 0) + (t.total || 0);
  const hour = new Date().getHours();
  const hello = hour < 11 ? 'おはよう！Chào buổi sáng' : hour < 18 ? 'こんにちは！Chào buổi chiều' : 'こんばんは！Chào buổi tối';
  const due = SRS.dueCount();

  const prog = {};
  Object.keys(DECKS).forEach(d => prog[d] = SRS.deckProgress(d));
  const allTotal = Object.values(prog).reduce((a, p) => a + p.total, 0);
  const allLearn = Object.values(prog).reduce((a, p) => a + p.learned, 0);
  const allMast  = Object.values(prog).reduce((a, p) => a + p.mastered, 0);

  /* dự đoán điểm thi: 60% độ phủ + 40% độ chính xác gần đây */
  const acc = accuracyRecent(14);
  const readiness = clamp(Math.round(pct(allLearn, allTotal) * 0.45 + pct(allMast, allTotal) * 0.25 + acc * 0.30), 0, 100);
  const predicted = Math.round(120 * readiness / 100);

  let countdown = '';
  if (s.settings.examDate) {
    const d = N.daysBetween(N.todayKey(), s.settings.examDate);
    countdown = d >= 0
      ? `<span class="tag" style="font-size:13px">📅 Còn <b>${d}</b> ngày tới kỳ thi</span>`
      : `<span class="tag">Kỳ thi đã qua — đặt lại ngày trong Cài đặt</span>`;
  }

  const weak = SRS.weakest(8);

  root.innerHTML = `
    <div class="hero">
      <h1>${esc(hello)}!</h1>
      <p class="sub">Mỗi ngày ${goal} thẻ — đủ để đi qua toàn bộ ${DATA.meta.counts ? DATA.meta.counts.kanji : 102} kanji, ${DATA.vocab.length} từ vựng và ${DATA.grammar.length} mẫu ngữ pháp N5 trước ngày thi.</p>
      <div class="row" style="margin-top:12px">${countdown}
        <span class="tag">🔥 chuỗi ${s.streak.cur || 0} ngày</span>
        <span class="tag">📈 hôm nay ${doneToday}/${goal}</span>
      </div>
      <div class="row">
        <a class="btn primary lg" href="#/review">⚡ Ôn tập ngay${due ? ' (' + due + ')' : ''}</a>
        <a class="btn lg" href="#/quiz">🎯 Luyện tập</a>
        <a class="btn lg ghost" href="#/exam">📝 Thi thử</a>
      </div>
    </div>

    <div class="grid g4" style="margin-top:16px">
      <div class="stat"><div class="k">Thẻ đến hạn</div><div class="v" style="color:${due ? 'var(--coral)' : 'var(--matcha)'}">${due}</div></div>
      <div class="stat"><div class="k">Đã học</div><div class="v">${allLearn}<small>/${allTotal}</small></div></div>
      <div class="stat"><div class="k">Đã thuộc</div><div class="v" style="color:var(--matcha)">${allMast}</div></div>
      <div class="stat"><div class="k">Chính xác 14 ngày</div><div class="v">${acc}<small>%</small></div></div>
    </div>

    <div class="grid g2" style="margin-top:16px">
      <div class="card">
        <div class="spread"><h2>Mức sẵn sàng thi</h2><span class="tag">${readiness}%</span></div>
        <p class="tiny dim" style="margin:8px 0 12px">Ước tính từ độ phủ kiến thức và độ chính xác gần đây — chỉ mang tính tham khảo.</p>
        ${N.barHTML(readiness, readiness >= 70 ? 'green' : readiness >= 45 ? 'amber' : '')}
        <div class="row" style="margin-top:12px;justify-content:space-between">
          <span class="tiny muted">Dự đoán nhóm Chữ–Từ–Ngữ pháp–Đọc: <b>~${predicted}/120</b> (đạt tối thiểu 38)</span>
          <span class="tag ${predicted >= 60 ? 'core' : ''}">${predicted >= 60 ? 'Tốt' : predicted >= 38 ? 'Sát ngưỡng' : 'Cần tăng tốc'}</span>
        </div>
      </div>
      <div class="card">
        <div class="spread"><h2>30 ngày gần đây</h2><span class="tiny dim">🔥 kỷ lục ${s.streak.best || 0} ngày</span></div>
        <div class="heat" style="margin-top:14px">${heatHTML(30)}</div>
        <p class="tiny dim" style="margin-top:10px">Ô càng sáng = học càng nhiều. Học đều mỗi ngày quan trọng hơn học dồn.</p>
      </div>
    </div>

    <div class="section-head"><h2>Kho kiến thức</h2><a class="btn sm ghost" href="#/browse">Tra cứu →</a></div>
    <div class="grid g3">
      ${Object.keys(DECKS).map(d => {
        const p = prog[d];
        return `<a class="mod-card" href="#/flashcard?deck=${d}">
          <span class="em">${DECKS[d].icon}</span>
          <h3>${DECKS[d].label}</h3>
          <p>${p.learned}/${p.total} đã học · ${p.mastered} thuộc</p>
          ${N.barHTML(p.pct)}
        </a>`;
      }).join('')}
      <a class="mod-card" href="#/grammar">
        <span class="em">📐</span><h3>Sổ tay ngữ pháp</h3>
        <p>${DATA.grammar.length} mẫu, chia ${Object.keys(DATA.cat.grammar).length} nhóm</p>
        ${N.barHTML(prog.grammar.pct)}
      </a>
    </div>

    ${weak.length ? `
      <div class="section-head"><h2>Điểm yếu cần ôn</h2><button class="btn sm pink" id="drillWeak">Luyện ngay</button></div>
      <div class="list">
        ${weak.map(w => {
          const it = DATA.byId[w.id], f = itemFace(it);
          return `<div class="item" data-id="${w.id}">
            <span class="lead">${esc(f.front)}</span>
            <div class="body"><div class="t">${esc(f.meaning)}</div><div class="s">${esc(f.reading)}</div></div>
            <div class="tail"><span class="tag" style="color:var(--coral)">sai ${w.w}</span><span class="tag">đúng ${w.c}</span></div>
          </div>`;
        }).join('')}
      </div>` : `
      <div class="section-head"><h2>Bắt đầu từ đâu?</h2></div>
      <div class="card">
        <p class="muted" style="margin-top:0">Lộ trình gợi ý cho người mới:</p>
        <ol class="muted" style="margin:0;padding-left:20px;line-height:2">
          <li><b>Tuần 1–2:</b> thuộc hết <a href="#/kana">hiragana + katakana</a> (bắt buộc, không dùng romaji khi thi).</li>
          <li><b>Tuần 3–6:</b> mỗi ngày 10 kanji + 20 từ vựng bằng <a href="#/flashcard">flashcard SRS</a>.</li>
          <li><b>Tuần 7–9:</b> học <a href="#/grammar">94 mẫu ngữ pháp</a> theo nhóm, luyện điền trợ từ.</li>
          <li><b>Tuần 10+:</b> <a href="#/exam">thi thử</a> mỗi tuần, ôn lại phần sai.</li>
        </ol>
      </div>`}

    <div class="section-head"><h2>Cấu trúc kỳ thi N5</h2><a class="btn sm ghost" href="#/exam">Vào thi thử →</a></div>
    <div class="grid g3">
      ${(DATA.exam.sections || []).map(sec => `
        <div class="card">
          <div class="jp" style="font-size:20px;font-weight:700">${esc(sec.name)}</div>
          <div class="muted tiny">${esc(sec.name_vi)}</div>
          <div class="row" style="margin-top:10px"><span class="tag">⏱ ${sec.minutes} phút</span><span class="tag">nhóm ${esc(sec.score_group)}</span></div>
        </div>`).join('')}
    </div>
    <p class="tiny dim" style="margin-top:10px">${esc((DATA.exam.scoring || {}).note_vi || '')}</p>`;

  root.querySelectorAll('.item[data-id]').forEach(el => el.onclick = () => showDetail(DATA.byId[el.dataset.id]));
  const dw = root.querySelector('#drillWeak');
  if (dw) dw.onclick = () => { location.hash = '#/quiz?weak=1'; };
};

function heatHTML(days) {
  const s = N.state();
  let html = '';
  for (let k = days - 1; k >= 0; k--) {
    const d = new Date(); d.setDate(d.getDate() - k);
    const key = N.todayKey(d);
    const rec = s.daily[key];
    const v = rec ? (rec.rev || 0) + (rec.total || 0) : 0;
    const l = v === 0 ? 0 : v < 10 ? 1 : v < 30 ? 2 : v < 60 ? 3 : 4;
    html += `<i data-l="${l}" title="${key}: ${v} lượt"></i>`;
  }
  return html;
}
function accuracyRecent(days) {
  const s = N.state();
  let c = 0, t = 0;
  for (let k = 0; k < days; k++) {
    const d = new Date(); d.setDate(d.getDate() - k);
    const rec = s.daily[N.todayKey(d)];
    if (rec) { c += rec.correct || 0; t += rec.total || 0; }
  }
  return t ? Math.round((c / t) * 100) : 0;
}
V.accuracyRecent = accuracyRecent;
V.heatHTML = heatHTML;

/* ============ ÔN TẬP SRS ============ */
V.review = function (root) {
  const dueIds = SRS.due();
  const byDeck = {};
  dueIds.forEach(id => { const d = deckOf(id); byDeck[d] = (byDeck[d] || 0) + 1; });

  if (!dueIds.length) {
    const newItems = pickNew(20);
    root.innerHTML = `
      <div class="card pad-lg center">
        <div style="font-size:52px">🌱</div>
        <h1 style="margin:10px 0">Không còn thẻ đến hạn!</h1>
        <p class="muted">Bạn đã ôn hết phần của hôm nay. Học thêm thẻ mới để tiến nhanh hơn nhé.</p>
        <div class="row" style="justify-content:center;margin-top:16px">
          <button class="btn primary lg" id="learnNew">Học 20 thẻ mới</button>
          <a class="btn lg ghost" href="#/quiz">Luyện tập thay thế</a>
        </div>
      </div>
      <div class="grid g4" style="margin-top:16px">
        ${Object.keys(DECKS).map(d => { const p = SRS.deckProgress(d);
          return `<div class="stat"><div class="k">${DECKS[d].label}</div><div class="v">${p.learned}<small>/${p.total}</small></div>${N.barHTML(p.pct)}</div>`; }).join('')}
      </div>`;
    root.querySelector('#learnNew').onclick = () => startCards(root, newItems, { onQuit: () => V.review(root), onAgain: () => V.review(root) });
    return;
  }

  root.innerHTML = `
    <div class="card pad-lg center">
      <div class="tiny dim">HÀNG ĐỢI HÔM NAY</div>
      <div class="result-score" style="color:var(--indigo)">${dueIds.length}<small> thẻ</small></div>
      <div class="row" style="justify-content:center;margin-top:6px">
        ${Object.keys(byDeck).map(d => `<span class="tag">${DECKS[d].icon} ${DECKS[d].label}: ${byDeck[d]}</span>`).join('')}
      </div>
      <div class="row" style="justify-content:center;margin-top:18px">
        <button class="btn primary lg" id="goAll">Bắt đầu ôn</button>
        <button class="btn lg" id="goQuiz">Ôn kiểu trắc nghiệm</button>
      </div>
      <p class="tiny dim" style="margin-top:14px">Thuật toán SRS giãn cách: thẻ nhớ tốt sẽ lâu gặp lại, thẻ hay quên sẽ quay lại sớm.</p>
    </div>`;

  const items = dueIds.map(id => DATA.byId[id]).filter(Boolean);
  root.querySelector('#goAll').onclick = () => startCards(root, items, { onQuit: () => V.review(root), onAgain: () => V.review(root) });
  root.querySelector('#goQuiz').onclick = () => {
    const qs = QUIZ.buildSet({ items: shuffle(items), count: Math.min(items.length, 20) });
    QUIZ.renderQuiz(root, qs, { onQuit: () => V.review(root), onAgain: () => V.review(root) });
  };
};

function pickNew(n) {
  const pool = [];
  ['kana', 'kanji', 'vocab', 'grammar', 'counter'].forEach(d => {
    DECKS[d].items().forEach(it => { if (!SRS.card(it.id)) pool.push(it); });
  });
  const kana = pool.filter(x => deckOf(x.id) === 'kana');
  return (kana.length ? kana : pool).slice(0, n);
}

/* ============ FLASHCARD ============ */
V.flashcard = function (root, params) {
  const deck = params.deck && DECKS[params.deck] ? params.deck : 'kanji';
  const catMap = deck === 'kanji' ? DATA.cat.kanji
    : deck === 'vocab' ? DATA.cat.vocab_topic
    : deck === 'grammar' ? DATA.cat.grammar : null;
  const catKey = deck === 'vocab' ? 'topic' : 'category';
  const state = { cat: params.cat || 'all', order: 'new', only: 'all' };

  function draw() {
    const items = filtered();
    root.innerHTML = `
      <div class="section-head"><h1>Flashcard</h1>
        <span class="tiny dim">${items.length} thẻ phù hợp</span></div>
      <div class="card">
        <div class="chips" style="margin-bottom:12px">
          ${Object.keys(DECKS).map(d => `<button class="chip ${d === deck ? 'on' : ''}" data-deck="${d}">${DECKS[d].icon} ${DECKS[d].label}</button>`).join('')}
        </div>
        ${catMap ? `<div class="chips scroll" style="margin-bottom:12px">
          <button class="chip ${state.cat === 'all' ? 'on' : ''}" data-cat="all">Tất cả</button>
          ${Object.keys(catMap).map(c => `<button class="chip ${state.cat === c ? 'on' : ''}" data-cat="${c}">${esc(catMap[c])}</button>`).join('')}
        </div>` : ''}
        <div class="grid g2">
          <label class="field"><span>Thứ tự</span>
            <select id="fOrder">
              <option value="new" ${state.order === 'new' ? 'selected' : ''}>Ưu tiên thẻ chưa học</option>
              <option value="random">Ngẫu nhiên</option>
              <option value="seq">Theo thứ tự giáo trình</option>
              <option value="weak">Thẻ hay sai trước</option>
            </select></label>
          <label class="field"><span>Phạm vi</span>
            <select id="fOnly">
              <option value="all" ${state.only === 'all' ? 'selected' : ''}>Tất cả</option>
              <option value="unlearned">Chỉ thẻ chưa học</option>
              <option value="learning">Đang học (chưa thuộc)</option>
              <option value="due">Chỉ thẻ đến hạn</option>
              ${deck === 'kanji' ? '<option value="core">Chỉ 80 kanji cốt lõi</option>' : ''}
              ${deck === 'vocab' ? '<option value="verb">Chỉ động từ</option>' : ''}
            </select></label>
        </div>
        <div class="row" style="margin-top:14px">
          <button class="btn primary" id="fStart" ${items.length ? '' : 'disabled'}>▶ Bắt đầu (${Math.min(items.length, 30)} thẻ)</button>
          <button class="btn" id="fStartAll" ${items.length ? '' : 'disabled'}>Học tất cả ${items.length}</button>
          <button class="btn ghost" id="fQuiz" ${items.length ? '' : 'disabled'}>🎯 Kiểm tra bộ này</button>
        </div>
      </div>

      <div class="section-head"><h2>Xem trước</h2><span class="tiny dim">bấm để xem chi tiết</span></div>
      <div class="grid ${deck === 'kanji' || deck === 'kana' ? 'g4' : 'g2'}" id="prev">
        ${items.slice(0, 24).map(it => {
          const f = itemFace(it), m = SRS.mastery(it.id);
          return (deck === 'kanji' || deck === 'kana')
            ? `<div class="kanji-tile" data-id="${it.id}"><b>${esc(f.front)}</b><span>${esc(f.meaning)}</span></div>`
            : `<div class="item" data-id="${it.id}"><span class="lead ${String(f.front).length > 4 ? 'sm' : ''}">${esc(f.front)}</span>
                 <div class="body"><div class="t">${esc(f.meaning)}</div><div class="s">${esc(f.reading)}</div></div>
                 <div class="tail"><span class="mastery-dot" data-m="${m}"></span></div></div>`;
        }).join('')}
      </div>`;

    root.querySelectorAll('[data-deck]').forEach(b => b.onclick = () => { location.hash = '#/flashcard?deck=' + b.dataset.deck; });
    root.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { state.cat = b.dataset.cat; draw(); });
    root.querySelector('#fOrder').onchange = e => { state.order = e.target.value; draw(); };
    root.querySelector('#fOnly').onchange = e => { state.only = e.target.value; draw(); };
    root.querySelectorAll('[data-id]').forEach(el => el.onclick = () => showDetail(DATA.byId[el.dataset.id]));

    const go = (n) => startCards(root, filtered().slice(0, n), { onQuit: draw, onAgain: draw });
    const st = root.querySelector('#fStart'), sa = root.querySelector('#fStartAll'), fq = root.querySelector('#fQuiz');
    if (st) st.onclick = () => go(30);
    if (sa) sa.onclick = () => go(9999);
    function deckQuiz() {
      const qs = QUIZ.buildSet({ items: shuffle(filtered()).slice(0, 20), count: 20 });
      QUIZ.renderQuiz(root, qs, { onQuit: draw, onAgain: deckQuiz });
    }
    if (fq) fq.onclick = deckQuiz;
  }

  function filtered() {
    let items = DECKS[deck].items().slice();
    if (catMap && state.cat !== 'all') items = items.filter(x => x[catKey] === state.cat);
    if (state.only === 'unlearned') items = items.filter(x => !SRS.card(x.id));
    if (state.only === 'learning')  items = items.filter(x => SRS.card(x.id) && SRS.mastery(x.id) < 3);
    if (state.only === 'due')       items = items.filter(x => SRS.isDue(x.id));
    if (state.only === 'core')      items = items.filter(x => x.core);
    if (state.only === 'verb')      items = items.filter(x => x.conjugation);
    const seen = N.state().seen;
    if (state.order === 'random') items = shuffle(items);
    else if (state.order === 'new') items = items.slice().sort((a, b) => (SRS.card(a.id) ? 1 : 0) - (SRS.card(b.id) ? 1 : 0));
    else if (state.order === 'weak') items = items.slice().sort((a, b) => ((seen[b.id] || {}).w || 0) - ((seen[a.id] || {}).w || 0));
    return items;
  }
  draw();
};

/* ============ LUYỆN TẬP (QUIZ) ============ */
V.quiz = function (root, params) {
  const cfg = { group: params.group || 'all', count: N.settings().quizLen || 15, typing: false };

  function draw() {
    const groups = QUIZ.GROUPS;
    root.innerHTML = `
      <div class="section-head"><h1>Luyện tập</h1><span class="tiny dim">${DATA.kanji.length + DATA.vocab.length + DATA.grammar.length}+ mục dữ liệu</span></div>

      <div class="grid g3">
        <div class="mod-card" data-quick="mix"><span class="em">🎲</span><h3>Tổng hợp</h3><p>Trộn mọi dạng câu hỏi — giống đề thi thật nhất</p></div>
        <div class="mod-card" data-quick="weak"><span class="em">🩹</span><h3>Vá lỗ hổng</h3><p>Chỉ hỏi những mục bạn hay sai</p></div>
        <div class="mod-card" data-quick="due"><span class="em">⚡</span><h3>Thẻ đến hạn</h3><p>${SRS.dueCount()} thẻ đang chờ ôn</p></div>
      </div>

      <div class="section-head"><h2>Chọn nội dung</h2></div>
      <div class="grid g3">
        ${Object.keys(groups).map(g => `
          <div class="mod-card" data-group="${g}">
            <span class="em">${groups[g].icon}</span>
            <h3>${groups[g].label}</h3>
            <p>${groups[g].kinds.length} dạng câu hỏi</p>
          </div>`).join('')}
      </div>

      <div class="section-head"><h2>Tuỳ chỉnh</h2></div>
      <div class="card">
        <div class="grid g2">
          <label class="field"><span>Số câu mỗi lượt</span>
            <select id="qLen">${[10, 15, 20, 30, 50].map(n => `<option value="${n}" ${n === cfg.count ? 'selected' : ''}>${n} câu</option>`).join('')}</select></label>
          <label class="field"><span>Dạng trả lời</span>
            <select id="qType">
              <option value="choice">Trắc nghiệm (nhanh)</option>
              <option value="mix">Trộn cả gõ chữ (khó hơn)</option>
            </select></label>
        </div>
        <p class="tiny dim" style="margin-top:12px">Mẹo: chế độ “gõ chữ” chấp nhận cả kana lẫn romaji — gõ <b>tabemasu</b> hay <b>たべます</b> đều đúng.</p>
      </div>`;

    root.querySelector('#qLen').onchange = e => { cfg.count = Number(e.target.value); N.setSetting('quizLen', cfg.count); };
    root.querySelector('#qType').onchange = e => { cfg.typing = e.target.value === 'mix'; };
    root.querySelectorAll('[data-group]').forEach(c => c.onclick = () => start({ group: c.dataset.group }));
    root.querySelectorAll('[data-quick]').forEach(c => c.onclick = () => start({ quick: c.dataset.quick }));
  }

  function start(o) {
    let kinds = null, items = null;
    if (o.group) {
      kinds = QUIZ.GROUPS[o.group].kinds.slice();
    } else if (o.quick === 'weak') {
      items = SRS.weakest(40).map(w => DATA.byId[w.id]).filter(Boolean);
      if (!items.length) { N.toast('Chưa có dữ liệu điểm yếu — hãy luyện vài lượt trước 😊'); return; }
    } else if (o.quick === 'due') {
      items = SRS.due().map(id => DATA.byId[id]).filter(Boolean);
      if (!items.length) { N.toast('Không còn thẻ đến hạn 🎉', 'ok'); return; }
    }
    if (!kinds) kinds = Object.keys(QUIZ.GEN);
    if (!cfg.typing) kinds = kinds.filter(k => QUIZ.GEN[k].type !== 'input');
    if (!kinds.length) kinds = Object.keys(QUIZ.GEN).filter(k => QUIZ.GEN[k].type !== 'input');

    const qs = QUIZ.buildSet({ kinds, count: cfg.count, items: items ? shuffle(items) : null });
    if (!qs.length) { N.toast('Không tạo được câu hỏi cho lựa chọn này', 'err'); return; }
    QUIZ.renderQuiz(root, qs, { onQuit: draw, onAgain: () => start(o) });
  }

  if (params.weak) { draw(); start({ quick: 'weak' }); return; }
  if (params.group) { draw(); start({ group: params.group }); return; }
  draw();
};

/* ============ KANA ============ */
V.kana = function (root, params) {
  const st = { script: params.script || 'hiragana', type: 'all' };

  function draw() {
    const list = (st.script === 'hiragana' ? DATA.hiragana : DATA.katakana)
      .map((k, i) => DATA.kanaAll.find(x => x.char === k.char && x.script === st.script) || k);
    const items = st.type === 'all' ? list : list.filter(k => k.type === st.type);
    const types = Array.from(new Set(list.map(k => k.type)));
    const TYPE_VI = { gojuon: 'Âm cơ bản (五十音)', dakuon: 'Âm đục (゛)', handakuon: 'Âm bán đục (゜)', youon: 'Âm ghép (ゃゅょ)', gairaigo: 'Âm ngoại lai' };
    const learned = items.filter(k => SRS.mastery(k.id) > 0).length;

    /* Xếp chữ đúng bảng 五十音: mỗi dòng là một hàng, mỗi cột là một nguyên âm a·i·u·e·o */
    const VOW = ['a', 'i', 'u', 'e', 'o'];
    const VHEAD = st.script === 'hiragana' ? ['あ', 'い', 'う', 'え', 'お'] : ['ア', 'イ', 'ウ', 'エ', 'オ'];
    const colOf = rom => { const m = String(rom).match(/([aiueo])$/); return m ? VOW.indexOf(m[1]) : 0; };
    function buildRows(arr) {
      const order = [], map = {};
      arr.forEach(k => {
        const key = k.type + '|' + k.row;
        if (!map[key]) { map[key] = { items: [] }; order.push(map[key]); }
        map[key].items.push(k);
      });
      return order.map(g => {
        const cells = [null, null, null, null, null];
        g.items.forEach(k => {
          let c = colOf(k.romaji);
          if (cells[c]) c = cells.indexOf(null);
          if (c < 0) c = cells.push(null) - 1;
          cells[c] = k;
        });
        const rom = g.items[0].romaji;
        return { label: (rom.replace(/[aiueo]+$/, '') || rom).toUpperCase(), cells };
      });
    }
    const sections = types.filter(t => st.type === 'all' || t === st.type)
      .map(t => ({ t, rows: buildRows(list.filter(k => k.type === t)) }));
    const cellHTML = k => k
      ? `<div class="kana-cell ${SRS.mastery(k.id) > 0 ? 'learned' : ''}" data-id="${k.id}" data-char="${esc(k.char)}">
           <b>${esc(k.char)}</b><span>${esc(k.romaji)}</span></div>`
      : '<div class="kana-empty"></div>';

    root.innerHTML = `
      <div class="section-head"><h1>Bảng chữ cái</h1>
        <div class="row">
          <button class="btn sm ${N.settings().hideRomajiKana ? '' : 'primary'}" id="kToggleRomaji">${N.settings().hideRomajiKana ? '👁 Hiện romaji' : '🙈 Ẩn romaji'}</button>
          <button class="btn sm pink" id="kDrill">⌨️ Luyện gõ</button>
          <button class="btn sm" id="kQuiz">🎯 Kiểm tra nhanh</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:14px">
        <div class="spread">
          <div class="chips">
            <button class="chip ${st.script === 'hiragana' ? 'on' : ''}" data-script="hiragana">ひらがな Hiragana</button>
            <button class="chip ${st.script === 'katakana' ? 'on' : ''}" data-script="katakana">カタカナ Katakana</button>
          </div>
          <span class="tiny dim">${learned}/${items.length} chữ đã học</span>
        </div>
        <div class="chips scroll" style="margin-top:12px">
          <button class="chip ${st.type === 'all' ? 'on' : ''}" data-type="all">Tất cả</button>
          ${types.map(t => `<button class="chip ${st.type === t ? 'on' : ''}" data-type="${t}">${esc(TYPE_VI[t] || t)}</button>`).join('')}
        </div>
      </div>

      <div class="card" style="margin-bottom:14px;border-color:color-mix(in srgb,var(--sakura) 40%,transparent)">
        <div class="spread">
          <div>
            <h2>📝 Thi thử bảng chữ cái</h2>
            <p class="tiny dim" style="margin:6px 0 0">Đề trộn: nhận mặt chữ · viết chữ theo romaji · phân biệt chữ dễ nhầm (シ/ツ, ソ/ン, ぬ/め…) · quy tắc trường âm – っ – âm ghép · đọc từ katakana. Có bấm giờ, chấm điểm và liệt kê chữ sai.</p>
          </div>
        </div>
        <div class="grid g3" style="margin-top:14px">
          <label class="field"><span>Phạm vi</span>
            <select id="kexScope">
              <option value="both">Cả 2 bảng (hiragana + katakana)</option>
              <option value="hiragana">Chỉ hiragana</option>
              <option value="katakana">Chỉ katakana</option>
            </select></label>
          <label class="field"><span>Số câu</span>
            <select id="kexN">
              <option value="20">20 câu (~8 phút)</option>
              <option value="40" selected>40 câu (~15 phút)</option>
              <option value="60">60 câu (~23 phút)</option>
              <option value="80">80 câu (~30 phút)</option>
            </select></label>
          <label class="field"><span>Bấm giờ</span>
            <select id="kexTimed">
              <option value="1">Có (như thi thật)</option>
              <option value="0">Không giới hạn</option>
            </select></label>
        </div>
        <button class="btn primary block lg" id="kexStart" style="margin-top:14px">▶ Bắt đầu thi thử</button>
      </div>

      ${sections.map(sec => `
        <div class="section-head"><h2>${esc(TYPE_VI[sec.t] || sec.t)}</h2>
          <span class="tiny dim">${sec.rows.length} hàng</span></div>
        <div class="kana-table ${N.settings().hideRomajiKana ? 'hide-romaji' : ''}">
          <div class="kana-row head">
            <div class="kana-rowlabel"></div>
            ${VHEAD.map(v => `<div class="kana-vh">${v}</div>`).join('')}
          </div>
          ${sec.rows.map(r => `
            <div class="kana-row">
              <div class="kana-rowlabel">${esc(r.label)}</div>
              ${r.cells.map(cellHTML).join('')}
            </div>`).join('')}
        </div>`).join('')}

      <div class="section-head"><h2>Ghi nhớ nhanh</h2></div>
      <div class="card">
        <ul class="muted" style="margin:0;padding-left:20px;line-height:1.9">
          ${DATA.kanaNotes.map(n => `<li>${esc(n)}</li>`).join('')}
          <li>Bấm vào từng chữ để nghe phát âm và thêm vào bộ ôn SRS.</li>
        </ul>
      </div>`;

    root.querySelectorAll('[data-script]').forEach(b => b.onclick = () => { st.script = b.dataset.script; draw(); });
    root.querySelectorAll('[data-type]').forEach(b => b.onclick = () => { st.type = b.dataset.type; draw(); });
    root.querySelectorAll('.kana-cell').forEach(c => c.onclick = () => {
      TTS.speak(c.dataset.char);
      showDetail(DATA.byId[c.dataset.id]);
    });
    root.querySelector('#kToggleRomaji').onclick = () => { N.setSetting('hideRomajiKana', !N.settings().hideRomajiKana); draw(); };
    function kanaQuiz() {
      const qs = QUIZ.buildSet({ kinds: ['kana_romaji', 'romaji_kana'], count: 20, items: shuffle(items) });
      QUIZ.renderQuiz(root, qs, { onQuit: draw, onAgain: kanaQuiz });
    }
    function kanaDrill() {
      const qs = QUIZ.buildSet({ kinds: ['kana_type'], count: 25, items: shuffle(items) });
      QUIZ.renderQuiz(root, qs, { onQuit: draw, onAgain: kanaDrill });
    }
    root.querySelector('#kQuiz').onclick = kanaQuiz;
    root.querySelector('#kexStart').onclick = () => {
      const scope = root.querySelector('#kexScope').value;
      const n = root.querySelector('#kexN').value;
      const timed = root.querySelector('#kexTimed').value;
      location.hash = `#/exam?mode=kana&scope=${scope}&n=${n}&timed=${timed}`;
    };
    root.querySelector('#kDrill').onclick = kanaDrill;
  }
  draw();
};

/* ============ NGỮ PHÁP ============ */
V.grammar = function (root, params) {
  const st = { cat: params.cat || 'all', q: '' };

  function draw() {
    const cats = DATA.cat.grammar;
    let list = DATA.grammar.slice();
    if (st.cat !== 'all') list = list.filter(g => g.category === st.cat);
    if (st.q) {
      const q = st.q.toLowerCase();
      list = list.filter(g => (g.pattern + g.meaning_vi + g.formation + g.example.jp + g.example.vi).toLowerCase().includes(q));
    }

    root.innerHTML = `
      <div class="section-head"><h1>Sổ tay ngữ pháp</h1>
        <button class="btn sm pink" id="gQuiz">🎯 Kiểm tra ${st.cat === 'all' ? 'tổng hợp' : 'nhóm này'}</button></div>

      <div class="search-bar">
        <input type="text" id="gSearch" placeholder="Tìm mẫu câu, ý nghĩa, ví dụ…" value="${esc(st.q)}">
      </div>
      <div class="chips scroll" style="margin-bottom:14px">
        <button class="chip ${st.cat === 'all' ? 'on' : ''}" data-cat="all">Tất cả (${DATA.grammar.length})</button>
        ${Object.keys(cats).map(c => {
          const n = DATA.grammar.filter(g => g.category === c).length;
          return `<button class="chip ${st.cat === c ? 'on' : ''}" data-cat="${c}">${esc(cats[c])} (${n})</button>`;
        }).join('')}
      </div>

      <div class="grid" style="gap:10px">
        ${list.length ? list.map(g => {
          const m = SRS.mastery(g.id);
          return `
          <div class="gr-item" data-id="${g.id}">
            <div class="gr-head">
              <span class="mastery-dot" data-m="${m}"></span>
              <span class="p">${esc(g.pattern)}</span>
              <span class="m">${esc(g.meaning_vi)}</span>
              <span class="caret">▾</span>
            </div>
            <div class="gr-body">
              <span class="gr-form">${esc(g.formation)}</span>
              <div class="ex">
                <div class="jp">${esc(g.example.jp)}</div>
                <div class="kana">${esc(g.example.kana)}</div>
                <div class="vi">${esc(g.example.vi)}</div>
              </div>
              <div class="row" style="margin-top:12px">
                ${N.speakBtn(g.example.jp, 'sm')}
                <button class="btn sm" data-srs="${g.id}">+ Ôn mẫu này</button>
                <span class="tag">${esc(cats[g.category] || g.category)}</span>
              </div>
            </div>
          </div>`;
        }).join('') : '<div class="empty"><span class="em">🔍</span>Không tìm thấy mẫu ngữ pháp nào.</div>'}
      </div>`;

    const inp = root.querySelector('#gSearch');
    inp.oninput = () => { st.q = inp.value; const p = inp.selectionStart; draw(); const n = root.querySelector('#gSearch'); n.focus(); n.setSelectionRange(p, p); };
    root.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { st.cat = b.dataset.cat; draw(); });
    root.querySelectorAll('.gr-head').forEach(h => h.onclick = () => h.parentElement.classList.toggle('open'));
    root.querySelectorAll('[data-srs]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      const c = SRS.ensure(b.dataset.srs); c.i = 0; c.d = N.todayKey(); N.save();
      N.toast('Đã thêm vào SRS ⚡', 'ok'); App.refreshBadges();
    });
    N.bindSpeak(root);
    function grammarQuiz() {
      const qs = QUIZ.buildSet({ kinds: ['grammar_meaning', 'grammar_usage', 'particle'], count: 20, items: st.cat === 'all' ? null : shuffle(list) });
      QUIZ.renderQuiz(root, qs, { onQuit: draw, onAgain: grammarQuiz });
    }
    root.querySelector('#gQuiz').onclick = grammarQuiz;
  }
  draw();
};

/* ============ TRA CỨU ============ */
V.browse = function (root, params) {
  const st = { type: params.type || 'kanji', q: params.q || '', cat: 'all' };

  function results() {
    const q = st.q.trim().toLowerCase();
    let pool = st.type === 'kanji' ? DATA.kanji
      : st.type === 'vocab' ? DATA.vocab
      : st.type === 'grammar' ? DATA.grammar
      : st.type === 'counter' ? DATA.counters
      : DATA.kanaAll;
    if (st.cat !== 'all') pool = pool.filter(x => (x.category || x.topic) === st.cat);
    if (!q) return pool;
    return pool.filter(x => searchText(x).includes(q));
  }
  function searchText(x) {
    return [x.char, x.word, x.kana, x.romaji, x.hanviet, x.meaning_vi, x.pattern, x.formation, x.usage_vi,
      x.counter, (x.onyomi || []).join(''), (x.kunyomi || []).join(''), (x.readings || []).join(''),
      x.example && x.example.jp, x.example && x.example.vi,
      (x.examples || []).map(e => e.word + e.kana + e.meaning_vi).join('')].filter(Boolean).join(' ').toLowerCase();
  }

  function draw() {
    const list = results();
    const catMap = st.type === 'kanji' ? DATA.cat.kanji : st.type === 'vocab' ? DATA.cat.vocab_topic : st.type === 'grammar' ? DATA.cat.grammar : null;

    root.innerHTML = `
      <div class="section-head"><h1>Tra cứu</h1><span class="tiny dim">${list.length} kết quả</span></div>
      <div class="search-bar">
        <input type="text" id="bSearch" placeholder="Nhập kanji, kana, romaji hoặc nghĩa tiếng Việt…" value="${esc(st.q)}">
      </div>
      <div class="chips" style="margin-bottom:12px">
        ${[['kanji', '漢 Kanji', DATA.kanji.length], ['vocab', '語 Từ vựng', DATA.vocab.length], ['grammar', '文 Ngữ pháp', DATA.grammar.length],
           ['counter', '個 Lượng từ', DATA.counters.length], ['kana', 'あ Kana', DATA.kanaAll.length]]
          .map(([k, l, n]) => `<button class="chip ${st.type === k ? 'on' : ''}" data-type="${k}">${l} (${n})</button>`).join('')}
      </div>
      ${catMap ? `<div class="chips scroll" style="margin-bottom:14px">
        <button class="chip ${st.cat === 'all' ? 'on' : ''}" data-cat="all">Tất cả</button>
        ${Object.keys(catMap).map(c => `<button class="chip ${st.cat === c ? 'on' : ''}" data-cat="${c}">${esc(catMap[c])}</button>`).join('')}
      </div>` : ''}

      ${!list.length ? '<div class="empty"><span class="em">🔍</span>Không tìm thấy. Thử từ khoá khác nhé.</div>'
        : st.type === 'kanji'
        ? `<div class="grid g4">${list.map(k => `
            <div class="kanji-tile" data-id="${k.id}">
              <b>${esc(k.char)}</b><span>${esc(k.hanviet)}<br>${esc(k.meaning_vi)}</span>
            </div>`).join('')}</div>`
        : st.type === 'kana'
        ? `<div class="kana-grid">${list.map(k => `
            <div class="kana-cell" data-id="${k.id}"><b>${esc(k.char)}</b><span>${esc(k.romaji)}</span></div>`).join('')}</div>`
        : `<div class="list">${list.slice(0, 300).map(x => {
            const f = itemFace(x), m = SRS.mastery(x.id);
            return `<div class="item" data-id="${x.id}">
              <span class="lead ${String(f.front).length > 4 ? 'sm' : ''}">${esc(f.front)}</span>
              <div class="body"><div class="t">${esc(f.meaning)}</div><div class="s">${esc(f.reading)}</div></div>
              <div class="tail"><span class="mastery-dot" data-m="${m}"></span></div>
            </div>`;
          }).join('')}</div>`}
      ${list.length > 300 ? '<p class="tiny dim center" style="margin-top:12px">Hiển thị 300 kết quả đầu — hãy tìm cụ thể hơn.</p>' : ''}`;

    const inp = root.querySelector('#bSearch');
    inp.oninput = () => { st.q = inp.value; const p = inp.selectionStart; draw(); const n2 = root.querySelector('#bSearch'); n2.focus(); n2.setSelectionRange(p, p); };
    root.querySelectorAll('[data-type]').forEach(b => b.onclick = () => { st.type = b.dataset.type; st.cat = 'all'; draw(); });
    root.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { st.cat = b.dataset.cat; draw(); });
    root.querySelectorAll('[data-id]').forEach(el => el.onclick = () => showDetail(DATA.byId[el.dataset.id]));
  }
  draw();
};

global.N5.VIEWS = Object.assign(global.N5.VIEWS || {}, V);
})(window);
