# -*- coding: utf-8 -*-
"""Trích xuất giáo trình GUNGUN JOUTATSU N5 (14 chương) thành dữ liệu cho web."""
import fitz, re, sys, os, json, glob

sys.stdout.reconfigure(encoding='utf-8')
BASE = r'C:\Users\vtdat\Downloads\1.VIP - GIÁO TRÌNH GUNGUN N5-20261006T015209Z-1-001\1.VIP - GIÁO TRÌNH GUNGUN N5'
BOOK = BASE + r'\GUNGUN TIẾNG NHẬT SƠ CẤP N5-VIP (260829)'
OUT = r'D:\jpdn5\data'

MAIN = 9.4                      # cỡ chữ nội dung chính
JP = re.compile(r'[\u3040-\u30ff\u4e00-\u9faf]')
CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'


# ----------------------------------------------------------------- tiện ích
def get_spans(page, min_size=0.0):
    out = []
    for b in page.get_text('dict')['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            for s in l['spans']:
                t = s['text'].strip()
                if t and s['size'] >= min_size:
                    out.append({'x': s['bbox'][0], 'x1': s['bbox'][2], 'y': s['bbox'][1],
                                'y1': s['bbox'][3], 'sz': s['size'], 'font': s['font'], 't': s['text']})
    return out


def band_rows(ss, tol=6.0):
    ss = sorted(ss, key=lambda s: (s['y'], s['x']))
    rows, cur = [], []
    for s in ss:
        if cur and s['y'] - cur[-1]['y'] > tol:
            rows.append(sorted(cur, key=lambda z: z['x']))
            cur = []
        cur.append(s)
    if cur:
        rows.append(sorted(cur, key=lambda z: z['x']))
    return rows


def line_text(row, main=MAIN):
    """Ghép 1 dòng: bỏ furigana (chữ nhỏ tiếng Nhật), giữ chỉ số dưới (chữ nhỏ là số)."""
    parts = []
    for s in sorted(row, key=lambda z: z['x']):
        t = s['t']
        if s['sz'] < main:
            if re.fullmatch(r'[0-9０-９]+', t.strip()):
                parts.append(t.strip())
            continue
        parts.append(t)
    return re.sub(r'\s+', ' ', ''.join(parts)).strip()


def clean_jp(s):
    return re.sub(r'[\s\u3000]+', '', s or '')


def page_no(page):
    """Số trang in trong sách (thường là dòng text đầu tiên của trang)."""
    first = page.get_text().strip().split(chr(10))[0].strip()
    if re.fullmatch(r"\d{1,3}", first):
        return int(first)
    cands = [s for s in get_spans(page, 6) if s["y"] < 45 and re.fullmatch(r"\d{1,3}", s["t"].strip())]
    cands.sort(key=lambda s: (s["y"], s["x"]))
    return int(cands[0]["t"].strip()) if cands else None


def page_part(page):
    for s in get_spans(page, 13):
        if s['x'] > 440 and s['y'] < 62 and s['t'].strip() in list('ABCD'):
            return s['t'].strip()
    return None


def page_kind(page):
    h = ''.join(s['t'].strip() for s in get_spans(page, 15) if s['x'] < 115 and s['y'] < 62)
    if '語' in h and '彙' in h:
        return 'vocab'
    if '漢' in h and '字' in h:
        return 'kanji'
    if '文' in h and '型' in h:
        return 'grammar'
    return 'other'


# ----------------------------------------------------------------- MỤC LỤC
def parse_toc():
    """Đọc mục lục: chương → phần A/B/C/D → mẫu ngữ pháp (kèm số trang) → nhóm chữ Hán."""
    TOC_MIN = 7.4
    chapters, cur_ch, cur_part = {}, None, None
    files = [BOOK + r'\0.1.GIỚI THIỆU VÀ MỤC LỤC N5 (C1-7) Q1_260829.pdf.pdf',
             BOOK + r'\0.2.MỤC LỤC N5 (C8-14) Q2.pdf.pdf']
    for f in files:
        doc = fitz.open(f)
        for pi in range(len(doc)):
            page = doc[pi]
            ss = [s for s in get_spans(page) if s['y'] > 38]
            if not ss:
                continue
            for row in band_rows(ss, tol=5):
                num = [s for s in row if s['x'] < 72 and re.fullmatch(r'\d{2}', s['t'].strip())
                       and s['sz'] >= 9]
                letter = [s for s in row if 72 <= s['x'] < 94 and s['t'].strip() in list('ABCD')
                          and s['sz'] >= 9]
                pgs = [s for s in row if s['x'] > 440 and re.fullmatch(r'\d{1,3}', s['t'].strip())]
                page_num = int(pgs[0]['t'].strip()) if pgs else None
                body = line_text([s for s in row if 72 <= s['x'] <= 440], TOC_MIN)

                if num:
                    cur_ch = int(num[0]['t'].strip())
                    chapters.setdefault(cur_ch, {'no': cur_ch, 'parts': [], 'grammar': [], 'kanji_groups': []})
                if cur_ch is None:
                    continue
                ch = chapters[cur_ch]

                if letter:
                    cur_part = letter[0]['t'].strip()
                    title = line_text([s for s in row if s['x'] >= 94 and s['x'] <= 440], TOC_MIN)
                    ch['parts'].append({'letter': cur_part,
                                        'title_jp': clean_jp(title.lstrip('-–— ')),
                                        'page': page_num})
                    continue
                if not body:
                    continue
                if body[0] in CIRCLED:
                    ch['grammar'].append({'no': CIRCLED.index(body[0]) + 1, 'part': cur_part,
                                          'pattern': body[1:].strip(), 'page': page_num})
                    continue
                m = re.match(r'^(\d+\.\d+)(.*)$', body)
                if m:
                    chars = [c for c in m.group(2) if JP.match(c)]
                    if chars:
                        ch['kanji_groups'].append({'code': m.group(1), 'chars': chars, 'page': page_num})
                    continue
                if re.match(r'^(CHỮ HÁN|ĐỌC HIỂU|NGHE HIỂU|LUYỆN TẬP|Mục lục)', body):
                    continue
                # dòng nối tiếp của mẫu ngữ pháp phía trên
                if ch['grammar'] and len(body) > 1 and not re.fullmatch(r'[\d\s.]+', body):
                    g = ch['grammar'][-1]
                    g['pattern'] = (g['pattern'] + ' ' + body).strip()
                    if page_num and not g['page']:
                        g['page'] = page_num
        doc.close()
    for ch in chapters.values():
        for g in ch['grammar']:
            g['pattern'] = re.sub(r'\s{2,}', ' ', g['pattern']).strip()
    return chapters


# ----------------------------------------------------------------- TỪ VỰNG
POS_TOKEN = re.compile(r'^（\s*(N|V\s?I{1,3}|A\s?[いな]?|Adv\.?\*?|[NAV][^）]{0,12})\s*）$')
KANA_ONLY = re.compile(r'^[぀-ヿ ～〜・（）()、\s]+$')
LATIN = re.compile(r'[A-Za-zÀ-ỹ]')


def vocab_columns(page, ss):
    """Dò vị trí 4 cột (từ | từ loại | cách đọc | nghĩa) riêng cho từng trang."""
    def mode(xs, default):
        if not xs:
            return default
        xs = sorted(xs)
        best, bestn = default, 0
        for x in xs:
            n = sum(1 for z in xs if abs(z - x) < 6)
            if n > bestn:
                best, bestn = x, n
        return best

    pos_x = mode([s['x'] for s in ss if POS_TOKEN.match(s['t'].strip())], 158)
    mean_x = mode([s['x'] for s in ss if s['x'] > pos_x + 60 and LATIN.search(s['t'])], 336)
    hdr = [s['x'] for s in ss if s['t'].strip().startswith('アクセント')]
    kana_candidates = [s['x'] for s in ss if pos_x + 20 < s['x'] < mean_x - 20 and KANA_ONLY.match(s['t'].strip())]
    kana_x = mode(kana_candidates, hdr[0] if hdr else pos_x + 55)
    kana_x = min(kana_x, mean_x - 20)
    return pos_x - 8, kana_x - 10, mean_x - 10


def dedupe_double(t):
    t = t.strip()
    if len(t) >= 4 and len(t) % 2 == 0 and t[:len(t) // 2] == t[len(t) // 2:]:
        return t[:len(t) // 2]
    return t


def extract_vocab(page, part):
    ss = [s for s in get_spans(page, MAIN) if 95 < s['y'] < 716]
    if not ss:
        return []
    b_pos, b_kana, b_mean = vocab_columns(page, ss)
    words = sorted([s for s in ss if s['x'] < b_pos], key=lambda s: s['y'])
    expr_y = min([s['y'] for s in ss if '表現' in s['t']], default=1e9)
    out = []
    for i, w in enumerate(words):
        y0 = w['y'] - 7
        y1 = words[i + 1]['y'] - 7 if i + 1 < len(words) else 716
        seg = [s for s in ss if y0 <= s['y'] < y1]
        tight = [s for s in ss if w['y'] - 4 <= s['y'] < (words[i + 1]['y'] - 4 if i + 1 < len(words) else 716)]
        word = ''.join(s['t'].strip() for s in sorted([s for s in seg if s['x'] < b_pos], key=lambda s: s['x']))
        if not JP.search(word) or any(h in word for h in ('アクセント', '言葉', '表現', '意味')):
            continue
        pos = ''.join(s['t'].strip() for s in sorted([s for s in tight if b_pos <= s['x'] < b_kana], key=lambda s: s['x']))
        kana = ''.join(s['t'].strip() for s in sorted([s for s in tight if b_kana <= s['x'] < b_mean], key=lambda s: s['x']))
        mean_rows = band_rows([s for s in seg if s['x'] >= b_mean], tol=6)
        mean = re.sub(r'\s+', ' ', ' '.join(''.join(z['t'].strip() for z in r) for r in mean_rows)).strip()
        if not mean:
            continue

        # dọn: （N） dính vào ô từ, cách đọc rơi vào ô từ loại...
        m = re.search(r'（\s*([^）]{1,14})\s*）\s*$', word)
        if m and not pos:
            pos, word = m.group(1), word[:m.start()]
        if pos and KANA_ONLY.match(pos) and not LATIN.search(pos):
            if not kana:
                kana = pos
            pos = ''
        m = re.search(r'（\s*([^）]{1,14})\s*）\s*$', word)
        if m and POS_TOKEN.match('（%s）' % m.group(1)):
            pos, word = m.group(1), word[:m.start()]
        word, kana = dedupe_double(word), dedupe_double(kana)
        if not word:
            continue
        pos = re.sub(r'\s+', ' ', pos.strip('（）() ')).strip()
        if pos and not re.fullmatch(r'(N|V ?I{1,3}|A ?[いな]?|Adv\.?\*?|N/.{1,10}|[A-Za-z /.*ぁ-ん]{0,14})', pos):
            pos = ''
        out.append({'word': word, 'kana': kana or word, 'pos': pos,
                    'meaning_vi': mean, 'part': part,
                    'kind': 'bieu-dat' if w['y'] > expr_y else 'tu-vung'})
    return out


# ----------------------------------------------------------------- CHỮ HÁN
def extract_kanji(page):
    ss = get_spans(page)
    bigs = sorted([s for s in ss if s['sz'] > 60 and len(s['t'].strip()) == 1], key=lambda s: s['y'])
    out = []
    for i, b in enumerate(bigs):
        top = b['y'] - 28
        bot = bigs[i + 1]['y'] - 28 if i + 1 < len(bigs) else 740
        seg = [s for s in ss if top <= s['y'] < bot]
        hv = [s['t'].strip() for s in seg if 10.5 < s['sz'] < 14.5 and s['x'] < 200 and s['y'] < b['y'] + 5
              and re.fullmatch(r'[^\W\d_]{2,}', s['t'].strip()) and s['t'].strip().isupper()]
        read_zone = [s for s in seg if s['sz'] >= MAIN and s['y'] > b['y'] + 85]
        kun = ''.join(s['t'].strip() for s in sorted([s for s in read_zone if 48 <= s['x'] < 125], key=lambda s: (s['y'], s['x'])))
        on = ''.join(s['t'].strip() for s in sorted([s for s in read_zone if 130 <= s['x'] < 205], key=lambda s: (s['y'], s['x'])))
        exs = []
        for row in band_rows([s for s in seg if s['sz'] >= MAIN and s['x'] > 195 and s['sz'] < 15], tol=6):
            txt = ''.join(s['t'] for s in row)
            if '・' not in txt:
                continue
            ws = [s for s in row if s['t'].strip() not in ('・', '') and not s['t'].strip().startswith('(')]
            if not ws:
                continue
            word = ''.join(s['t'].strip() for s in ws)
            mean = ' '.join(s['t'].strip() for s in row if s['t'].strip().startswith('('))
            rb = [s for s in seg if s['sz'] < MAIN and min(w['y'] for w in ws) - 13 < s['y'] < min(w['y'] for w in ws) + 2
                  and min(w['x'] for w in ws) - 4 <= s['x'] <= max(w['x1'] for w in ws) + 4]
            ruby = ''.join(s['t'].strip() for s in sorted(rb, key=lambda s: s['x']))
            tail = re.search(r'([\u3040-\u309f]+)$', word)
            if ruby and tail and not ruby.endswith(tail.group(1)):
                ruby += tail.group(1)
            exs.append({'word': word, 'kana': ruby, 'meaning_vi': mean.strip('() ').strip()})
        out.append({'char': b['t'].strip(), 'hanviet': hv[0] if hv else '',
                    'kunyomi': [x for x in re.split(r'[、,]', kun) if x.strip()],
                    'onyomi': [x for x in re.split(r'[、,]', on) if x.strip()],
                    'examples': exs})
    return out


# ----------------------------------------------------------------- NGỮ PHÁP
def page_lines(page):
    out = []
    for b in page.get_text('dict')['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            txt = ''.join(sp['text'] for sp in l['spans']).strip()
            if txt:
                out.append({'y': l['bbox'][1], 'x': l['bbox'][0], 'x1': l['bbox'][2],
                            'sz': l['spans'][0]['size'], 'font': l['spans'][0]['font'], 't': txt})
    return out


LATIN = re.compile(r'[a-zàáâãèéêìíòóôõùúăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹý]', re.I)


def extract_grammar(doc):
    """Mỗi mẫu câu = số thứ tự cỡ 13 ở lề trái + câu mẫu tiếng Nhật cùng dòng."""
    items = []
    for i in range(len(doc)):
        page = doc[i]
        ls = page_lines(page)
        part = page_part(page)
        marks = [l for l in ls if l['x'] < 64 and 12.3 < l['sz'] < 14.3 and re.fullmatch(r'\d{1,2}', l['t'])]
        marks.sort(key=lambda l: l['y'])
        for mi, m in enumerate(marks):
            pats = [l for l in ls if abs(l['y'] - m['y']) < 15 and l['x'] > 80
                    and 11.7 < l['sz'] < 14.6 and JP.search(l['t'])]
            if not pats:
                continue
            pats.sort(key=lambda l: (round(l['y'] / 8), l['x']))
            pat = re.sub(r'\s+', ' ', ' '.join(l['t'] for l in pats)).strip()
            # vế trả lời (→［ ...) nằm bên phải, cỡ nhỏ hơn
            cont = [l for l in ls if pats[0]['y'] - 6 < l['y'] < pats[0]['y'] + 45 and l['x'] > 250
                    and 9.5 < l['sz'] < 12 and JP.search(l['t'])]
            if cont:
                pat += ' ' + ' / '.join(re.sub(r'\s+', ' ', c['t']).strip() for c in sorted(cont, key=lambda c: c['y']))
            y_end = marks[mi + 1]['y'] - 10 if mi + 1 < len(marks) else 9999
            seg = [l for l in ls if m['y'] - 5 < l['y'] < y_end]
            meaning = ''
            for l in sorted(seg, key=lambda l: l['y']):
                if 'SemiBo' in l['font'] and l['sz'] >= 11 and LATIN.search(l['t']) and l['y'] > m['y'] + 10:
                    meaning = re.sub(r'\s+', ' ', l['t']).strip()
                    break
            extra = [re.sub(r'\s+', ' ', l['t']).strip() for l in sorted(seg, key=lambda l: l['y'])
                     if 'SemiBo' in l['font'] and 9 <= l['sz'] < 11 and LATIN.search(l['t'])
                     and l['x'] > 250 and l['y'] > m['y'] + 10][:2]
            if extra:
                meaning = (meaning + ' → ' + ' / '.join(extra)).strip(' →')
            bullets, examples = [], []
            for l in sorted(seg, key=lambda l: l['y']):
                t = re.sub(r'\s+', ' ', l['t']).strip()
                if t.startswith('♦') or t.startswith('•'):
                    # gom cả dòng xuống dòng của gạch đầu dòng
                    full = ''.join(z['t'] for z in sorted(
                        [z for z in seg if abs(z['y'] - l['y']) < 7 and z['sz'] >= 9], key=lambda z: z['x']))
                    bullets.append(re.sub(r'\s+', ' ', full).lstrip('♦• ').strip())
                elif t.startswith('例') and 'KozGoPro' in l['font']:
                    full = ''.join(z['t'] for z in sorted(
                        [z for z in seg if abs(z['y'] - l['y']) < 8 and z['sz'] >= 9.3], key=lambda z: z['x']))
                    body = re.sub(r'^例\s*', '', re.sub(r'\s+', ' ', full)).strip()
                    for piece in re.split(r'(?<=。)\s{2,}|\s{3,}|(?<=。)(?=\d[．.])', body):
                        piece = re.sub(r'^\d+[．.]\s*', '', piece).strip()
                        if len(piece) > 3 and JP.search(piece):
                            examples.append(piece)
            items.append({'no': int(m['t']), 'part': part, 'page': page_no(page) or 0, 'idx': i,
                          'pattern': pat, 'meaning_vi': meaning,
                          'explain': bullets[:6], 'examples': examples[:6]})
    # loại trùng (một mẫu câu đôi khi lặp lại ở trang sau)
    seen, out = set(), []
    for it in sorted(items, key=lambda z: (z['idx'], z['no'])):
        key = (it['no'], it['part'])
        if key in seen:
            continue
        seen.add(key)
        out.append(it)
    return sorted(out, key=lambda z: (z['idx'], z['no']))


# ----------------------------------------------------------------- CHẠY
def main():
    toc = parse_toc()
    print('MỤC LỤC: %d chương' % len(toc))
    chapters = []
    for f in sorted(glob.glob(BOOK + r'\*.pdf'), key=lambda p: int(re.match(r'(\d+)', os.path.basename(p)).group(1))):
        m = re.match(r'(\d+)\.CHƯƠNG', os.path.basename(f))
        if not m:
            continue
        no = int(m.group(1))
        doc = fitz.open(f)
        pmap = {}
        vocab, kanji = [], []
        for i in range(len(doc)):
            pno = page_no(doc[i])
            if pno:
                pmap.setdefault(pno, i)
            kind = page_kind(doc[i])
            if kind == 'vocab':
                vocab += extract_vocab(doc[i], page_part(doc[i]))
            elif kind == 'kanji':
                kanji += extract_kanji(doc[i])
        ch = toc.get(no, {'no': no, 'parts': [], 'grammar': [], 'kanji_groups': []})
        toc_pat = {(g['no'], g['part']): g['pattern'] for g in ch.get('grammar', [])}
        gram = extract_grammar(doc)
        for g in gram:
            g['pattern_toc'] = toc_pat.get((g['no'], g['part']), '')
        ch['grammar'] = gram
        ch['vocab'] = vocab
        ch['kanji'] = kanji
        chapters.append(ch)
        print(f"Chương {no:2}: {len(vocab):3} từ | {len(kanji):3} kanji | {len(ch['grammar']):2} ngữ pháp | "
              f"{len(ch['parts'])} phần | ví dụ NP: {sum(len(g.get('examples',[])) for g in ch['grammar'])}")
        doc.close()
    json.dump(chapters, open(os.path.join(OUT, '_gungun_raw.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('\nĐã ghi _gungun_raw.json')
    print('TỔNG: %d từ vựng, %d kanji, %d ngữ pháp' % (
        sum(len(c['vocab']) for c in chapters), sum(len(c['kanji']) for c in chapters),
        sum(len(c['grammar']) for c in chapters)))


if __name__ == '__main__':
    main()
