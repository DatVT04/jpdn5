# -*- coding: utf-8 -*-
"""Chuyển dữ liệu thô đã bóc tách thành data/n5-gungun.js cho web."""
import json, re, sys, io, os, fitz, glob

sys.stdout.reconfigure(encoding='utf-8')
RAW = r'D:\jpdn5\data\_gungun_raw.json'
OUT = r'D:\jpdn5\data\n5-gungun.js'
BOOK = (r'C:\Users\vtdat\Downloads\1.VIP - GIÁO TRÌNH GUNGUN N5-20261006T015209Z-1-001'
        r'\1.VIP - GIÁO TRÌNH GUNGUN N5\GUNGUN TIẾNG NHẬT SƠ CẤP N5-VIP (260829)')

KANJI_MEANING = { "畑": "ruộng, nương (chữ Nhật tự tạo)", "秋": "mùa thu", "氷": "băng, đá lạnh", "泳": "bơi", "雪": "tuyết", "雲": "mây", "早": "sớm", "明": "sáng, sáng sủa", "朝": "buổi sáng", "犬": "con chó", "太": "to, mập", "京": "kinh đô", "林": "rừng cây", "森": "rừng rậm", "体": "cơ thể", "髪": "tóc", "不": "không, bất ~", "石": "đá", "夕": "buổi chiều tối", "銀": "bạc", "米": "gạo; nước Mỹ", "帰": "trở về", "良": "tốt, giỏi", "飯": "cơm", "合": "hợp, khớp nhau", "牛": "con bò", "物": "đồ vật", "毛": "lông, tóc", "交": "giao nhau", "海": "biển", "元": "gốc; khỏe (元気)", "兄": "anh trai", "光": "ánh sáng", "音": "âm thanh", "暗": "tối", "親": "cha mẹ; thân thiết", "門": "cổng", "運": "vận chuyển; vận may", "軽": "nhẹ", "重": "nặng", "寺": "chùa", "待": "chờ đợi", "荷": "hành lý", "歌": "bài hát, hát", "自": "tự, bản thân", "貝": "vỏ sò", "具": "dụng cụ", "内": "bên trong", "肉": "thịt", "言": "nói, lời nói", "田": "ruộng", "町": "thị trấn, khu phố", "魚": "con cá", "好": "thích; tốt", "士": "người có chuyên môn (võ sĩ, bác sĩ)", "売": "bán", "界": "thế giới, ranh giới", "画": "tranh vẽ; nét", "茶": "trà", "草": "cỏ", "酒": "rượu", "方": "phía; cách làm; vị (người)", "旅": "chuyến đi, du lịch", "族": "gia tộc", "同": "giống nhau, cùng", "病": "bệnh" }
HANVIET_FIX = {"畑": "---", "画": "HỌA"}

OLD_DATA = r'D:\jpdn5\data\n5-data.js'


def old_kanji_meanings():
    try:
        raw = io.open(OLD_DATA, encoding='utf-8').read()
        d = json.loads(raw[raw.index('{'):raw.rindex('}') + 1])
        return {k['char']: k['meaning_vi'] for k in d.get('kanji', [])}
    except Exception:
        return {}


# ------------------------------------------------------------------ romaji
ROMA = {
 'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
 'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
 'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
 'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo',
 'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro','わ':'wa','を':'o','ん':'n',
 'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go','ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
 'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do','ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
 'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
}
DIGRAPH = {'きゃ':'kya','きゅ':'kyu','きょ':'kyo','しゃ':'sha','しゅ':'shu','しょ':'sho',
 'ちゃ':'cha','ちゅ':'chu','ちょ':'cho','にゃ':'nya','にゅ':'nyu','にょ':'nyo',
 'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','みゃ':'mya','みゅ':'myu','みょ':'myo',
 'りゃ':'rya','りゅ':'ryu','りょ':'ryo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
 'じゃ':'ja','じゅ':'ju','じょ':'jo','びゃ':'bya','びゅ':'byu','びょ':'byo',
 'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo','ふぁ':'fa','ふぃ':'fi','ふぇ':'fe','ふぉ':'fo',
 'てぃ':'ti','でぃ':'di','うぃ':'wi','うぇ':'we','うぉ':'wo','しぇ':'she','じぇ':'je','ちぇ':'che'}
SMALL = {'ゃ':'ya','ゅ':'yu','ょ':'yo','ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o'}


def kata2hira(s):
    return ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in s)


def romaji(kana):
    s = kata2hira(re.sub(r'[\s　]', '', kana or ''))
    out, i = '', 0
    while i < len(s):
        two = s[i:i + 2]
        if two in DIGRAPH:
            out += DIGRAPH[two]; i += 2; continue
        c = s[i]
        if c == 'っ':
            nxt = s[i + 1:i + 3]
            r = DIGRAPH.get(nxt) or ROMA.get(s[i + 1:i + 2], '')
            out += r[0] if r else ''
            i += 1; continue
        if c == 'ー':
            out += out[-1] if out else ''
            i += 1; continue
        if c in SMALL:
            out += SMALL[c]; i += 1; continue
        out += ROMA.get(c, c if not ('\u3040' <= c <= '\u30ff') else '')
        i += 1
    return out



# ------------------------------------------------------------------ chia động từ
I_TO_U = {'い': 'う', 'き': 'く', 'ぎ': 'ぐ', 'し': 'す', 'ち': 'つ', 'に': 'ぬ',
          'ひ': 'ふ', 'び': 'ぶ', 'み': 'む', 'り': 'る'}
I_TO_A = {'い': 'わ', 'き': 'か', 'ぎ': 'が', 'し': 'さ', 'ち': 'た', 'に': 'な',
          'ひ': 'は', 'び': 'ば', 'み': 'ま', 'り': 'ら'}
I_TO_TE = {'き': 'いて', 'ぎ': 'いで', 'し': 'して', 'ち': 'って', 'り': 'って', 'い': 'って',
           'に': 'んで', 'び': 'んで', 'み': 'んで'}
I_TO_TA = {'き': 'いた', 'ぎ': 'いだ', 'し': 'した', 'ち': 'った', 'り': 'った', 'い': 'った',
           'に': 'んだ', 'び': 'んだ', 'み': 'んだ'}


def conjugate(word, kana, pos):
    """Sinh đủ 5 thể (ます・từ điển・て・た・ない) từ thể ます hoặc thể từ điển."""
    m = re.search(r'V\s?(I{1,3})', pos.replace('\u2160', 'I').replace('\u2161', 'II').replace('\u2162', 'III'))
    grp = len(m.group(1)) if m else 0
    if not grp:
        return None, 0

    disp = re.sub(r'^[（(][^）)]*[）)]', '', word).strip()        # bỏ tiền tố （～を）
    kana = kana.strip()

    def out(stem_w, stem_k, suffixes, grp_out):
        forms = {}
        for key, suf in suffixes.items():
            forms[key] = {'word': stem_w + suf, 'kana': stem_k + suf, 'romaji': romaji(stem_k + suf)}
        return forms, grp_out

    # 1) Danh từ + する/します  →  勉強する・勉強します…
    m2 = re.match(r'^(.+?)[（(]\s*し(ます|)\s*[）)]$', kana) or re.match(r'^(.+?)[（(]\s*する\s*[）)]$', kana)
    if m2:
        nk = m2.group(1)
        nw = re.sub(r'[（(][^）)]*[）)]$', '', disp).strip() or nk
        return out(nw, nk, {'masu': 'します', 'dict': 'する', 'te': 'して', 'ta': 'した', 'nai': 'しない'}, 3)

    SPECIAL = {'あります': ('あり', 'ある', 'あって', 'あった', 'ない'),
               'ある': ('あり', 'ある', 'あって', 'あった', 'ない'),
               'いらっしゃいます': ('いらっしゃい', 'いらっしゃる', 'いらっしゃって', 'いらっしゃった', 'いらっしゃらない')}
    if kana in SPECIAL:
        masu, dic, te, ta, nai = SPECIAL[kana]
        head_w = disp[:-len(kana)] if disp.endswith(kana) else ''
        forms = {'masu': masu + 'ます', 'dict': dic, 'te': te, 'ta': ta, 'nai': nai}
        return out(head_w, '', {k: v for k, v in forms.items()}, grp)[0], grp

    U_TO_I = {'う': 'い', 'く': 'き', 'ぐ': 'ぎ', 'す': 'し', 'つ': 'ち', 'ぬ': 'に',
              'ふ': 'ひ', 'ぶ': 'び', 'む': 'み', 'る': 'り'}
    U_TO_A = {'う': 'わ', 'く': 'か', 'ぐ': 'が', 'す': 'さ', 'つ': 'た', 'ぬ': 'な',
              'ふ': 'は', 'ぶ': 'ば', 'む': 'ま', 'る': 'ら'}
    U_TE = {'く': 'いて', 'ぐ': 'いで', 'す': 'して', 'つ': 'って', 'る': 'って', 'う': 'って',
            'ぬ': 'んで', 'ぶ': 'んで', 'む': 'んで'}
    U_TA = {k: v[:-1] + ('だ' if v.endswith('で') else 'た') for k, v in U_TE.items()}
    I_TO_U = {v: k for k, v in U_TO_I.items()}

    # 2) thể ます  →  quy về thể từ điển rồi chia
    if kana.endswith('ます'):
        stem_k, stem_w = kana[:-2], (disp[:-2] if disp.endswith('ます') else '')
        if not stem_w:
            stem_w = stem_k
        if grp == 2:
            return out(stem_w, stem_k, {'masu': 'ます', 'dict': 'る', 'te': 'て', 'ta': 'た', 'nai': 'ない'}, 2)
        if grp == 3:
            if stem_k.endswith('し'):
                return out(stem_w[:-1], stem_k[:-1], {'masu': 'します', 'dict': 'する', 'te': 'して',
                                                      'ta': 'した', 'nai': 'しない'}, 3)
            if stem_k.endswith('き'):
                head_k = stem_k[:-1]
                head_w = stem_w[:-1] if stem_w.endswith('き') else stem_w
                forms = {'masu': {'word': head_w + ('ます' if head_w.endswith('来') else 'きます'), 'kana': head_k + 'きます'},
                         'dict': {'word': head_w + ('る' if head_w.endswith('来') else 'くる'), 'kana': head_k + 'くる'},
                         'te': {'word': head_w + ('て' if head_w.endswith('来') else 'きて'), 'kana': head_k + 'きて'},
                         'ta': {'word': head_w + ('た' if head_w.endswith('来') else 'きた'), 'kana': head_k + 'きた'},
                         'nai': {'word': head_w + ('ない' if head_w.endswith('来') else 'こない'), 'kana': head_k + 'こない'}}
                for f in forms.values():
                    f['romaji'] = romaji(f['kana'])
                return forms, 3
            return None, grp
        last = stem_k[-1] if stem_k else ''
        if last not in I_TO_U:
            return None, grp
        u = I_TO_U[last]
        bw, bk = stem_w[:-1], stem_k[:-1]
        if bk.endswith('い') and u == 'く':        # 行きます
            return out(bw, bk, {'masu': 'きます', 'dict': 'く', 'te': 'って', 'ta': 'った', 'nai': 'かない'}, 1)
        return out(bw, bk, {'masu': last + 'ます', 'dict': u, 'te': U_TE[u],
                            'ta': U_TA[u], 'nai': U_TO_A[u] + 'ない'}, 1)

    # 3) thể từ điển
    last = kana[-1] if kana else ''
    bw, bk = (disp[:-1] if disp else kana[:-1]), kana[:-1]
    if grp == 2 and last == 'る':
        return out(bw, bk, {'masu': 'ます', 'dict': 'る', 'te': 'て', 'ta': 'た', 'nai': 'ない'}, 2)
    if grp == 3:
        if kana.endswith('する'):
            return out(disp[:-2] if disp.endswith('する') else kana[:-2], kana[:-2],
                       {'masu': 'します', 'dict': 'する', 'te': 'して', 'ta': 'した', 'nai': 'しない'}, 3)
        if kana.endswith('くる') or kana.endswith('来る'):
            hk = kana[:-2]
            hw = disp[:-2] if len(disp) >= 2 else hk
            forms = {'masu': {'word': hw + 'きます', 'kana': hk + 'きます'},
                     'dict': {'word': hw + 'くる', 'kana': hk + 'くる'},
                     'te': {'word': hw + 'きて', 'kana': hk + 'きて'},
                     'ta': {'word': hw + 'きた', 'kana': hk + 'きた'},
                     'nai': {'word': hw + 'こない', 'kana': hk + 'こない'}}
            for f in forms.values():
                f['romaji'] = romaji(f['kana'])
            return forms, 3
        return None, grp
    if last not in U_TO_I:
        return None, grp
    if kana.endswith('いく') or disp.endswith('行く'):
        return out(bw, bk, {'masu': 'きます', 'dict': 'く', 'te': 'って', 'ta': 'った', 'nai': 'かない'}, 1)
    return out(bw, bk, {'masu': U_TO_I[last] + 'ます', 'dict': last, 'te': U_TE[last],
                        'ta': U_TA[last], 'nai': U_TO_A[last] + 'ない'}, 1)


# ------------------------------------------------------------------ tiêu đề chương
def chapter_titles():
    """Tiêu đề chương = dòng chữ Nhật lớn nhất ở trang mở đầu (ghép các mảnh cùng dòng)."""
    titles = {}
    for f in glob.glob(BOOK + r'\*.pdf'):
        m = re.match(r'(\d+)\.CHƯƠNG', os.path.basename(f))
        if not m:
            continue
        doc = fitz.open(f)
        sp = []
        for b in doc[0].get_text('dict')['blocks']:
            if b['type'] != 0:
                continue
            for l in b['lines']:
                for s in l['spans']:
                    txt = s['text'].strip()
                    if txt and s['size'] > 13 and re.search(r'[\u3040-\u30ff\u4e00-\u9faf]', txt):
                        sp.append({'y': s['bbox'][1], 'x': s['bbox'][0], 'sz': s['size'], 't': txt})
        bands = {}
        for s in sp:
            key = round(s['y'] / 10)
            bands.setdefault(key, []).append(s)
        best = ''
        for key, group in bands.items():
            if len(group) < 2 and len(group[0]['t']) < 4:
                continue
            txt = ''.join(z['t'] for z in sorted(group, key=lambda z: z['x']))
            txt = re.sub(r'[\s　]', '', txt)
            if len(txt) > len(best):
                best = txt
        titles[int(m.group(1))] = best
        doc.close()
    return titles


POS_VI = {'N': 'Danh từ', 'V I': 'Động từ nhóm I', 'V II': 'Động từ nhóm II', 'V III': 'Động từ nhóm III',
          'A い': 'Tính từ đuôi い', 'A な': 'Tính từ đuôi な', 'Adv.': 'Trạng từ', 'Adv': 'Trạng từ'}


def main():
    raw = json.load(open(RAW, encoding='utf-8'))
    titles = chapter_titles()
    meanings = old_kanji_meanings()
    meanings.update(KANJI_MEANING)
    chapters, vocab, kanji, grammar = [], [], [], []
    seen_kanji = {}

    for ch in sorted(raw, key=lambda c: c['no']):
        no = ch['no']
        parts = [{'letter': p['letter'], 'title_jp': p['title_jp']} for p in ch.get('parts', [])]
        vn = 0
        for v in ch['vocab']:
            vn += 1
            kana = re.sub(r'[\s　]', '', v['kana'])
            word = re.sub(r'[\s　]+', '', v['word'])
            pos = v.get('pos', '')
            entry = {
                'id': 'v%02d%03d' % (no, vn), 'ch': no, 'part': v.get('part') or 'A',
                'word': word, 'kana': kana, 'romaji': romaji(kana),
                'pos': pos, 'pos_vi': POS_VI.get(pos, ''),
                'meaning_vi': re.sub(r'\s+', ' ', v['meaning_vi']).strip(),
                'kind': v.get('kind', 'tu-vung')
            }
            forms, grp = conjugate(word, kana, pos)
            if forms:
                entry['verb_group'] = grp
                entry['conjugation'] = forms
            vocab.append(entry)
        kn = 0
        for k in ch['kanji']:
            if k['char'] in seen_kanji:
                continue
            seen_kanji[k['char']] = True
            kn += 1
            kanji.append({
                'id': 'k%02d%02d' % (no, kn), 'ch': no, 'char': k['char'],
                'hanviet': HANVIET_FIX.get(k['char'], k['hanviet'] or '---'),
                'meaning_vi': meanings.get(k['char'], ''),
                'onyomi': k['onyomi'], 'kunyomi': k['kunyomi'],
                'examples': [{'word': re.sub(r'[\s　]+', '', e['word']), 'kana': e['kana'],
                              'romaji': romaji(e['kana']), 'meaning_vi': e['meaning_vi']}
                             for e in k['examples'] if e.get('meaning_vi')]
            })
        gn = 0
        for g in ch['grammar']:
            gn += 1
            grammar.append({
                'id': 'g%02d%02d' % (no, gn), 'ch': no, 'part': g.get('part') or 'A', 'no': g['no'],
                'pattern': re.sub(r'\s+', ' ', g['pattern']).strip(),
                'meaning_vi': re.sub(r'\s+', ' ', g.get('meaning_vi') or '').strip(),
                'explain': [re.sub(r'\s+', ' ', x).strip() for x in g.get('explain', [])][:5],
                'examples': [re.sub(r'\s+', ' ', x).strip() for x in g.get('examples', [])][:5],
                'page': g.get('page') or 0
            })
        chapters.append({
            'no': no, 'title_jp': titles.get(no, ''), 'parts': parts,
            'counts': {'vocab': vn, 'kanji': kn, 'grammar': gn}
        })

    data = {
        'meta': {
            'title': 'GUNGUN JOUTATSU! Tiếng Nhật sơ cấp N5',
            'source': 'Giáo trình GUNGUN JOUTATSU N5 (bản VIP 260829) — 14 chương',
            'counts': {'chapters': len(chapters), 'vocabulary': len(vocab),
                       'kanji': len(kanji), 'grammar': len(grammar)}
        },
        'chapters': chapters, 'vocabulary': vocab, 'kanji': kanji, 'grammar': grammar
    }
    js = 'window.N5_GUNGUN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
    io.open(OUT, 'w', encoding='utf-8', newline='\n').write(js)
    print('Đã ghi', OUT, '%.1f KB' % (len(js.encode('utf-8')) / 1024))
    print('Chương:', len(chapters), '| Từ vựng:', len(vocab), '| Kanji:', len(kanji), '| Ngữ pháp:', len(grammar))
    for c in chapters:
        print(f"  C{c['no']:2} {c['title_jp'][:28]:30} từ {c['counts']['vocab']:3} · kanji {c['counts']['kanji']:2} · NP {c['counts']['grammar']:2}")
    nverb = len([v for v in vocab if v.get('conjugation')])
    print('Động từ có bảng chia:', nverb)
    for v in [x for x in vocab if x.get('conjugation')][:4]:
        c = v['conjugation']
        print('  ', v['word'], '(nhóm %d)' % v['verb_group'], '→',
              c['dict']['word'], '/', c['te']['word'], '/', c['ta']['word'], '/', c['nai']['word'])
    print('\nVí dụ romaji:', [(v['kana'], v['romaji']) for v in vocab[:3]],
          [(v['kana'], v['romaji']) for v in vocab if 'っ' in v['kana']][:3])


if __name__ == '__main__':
    main()
