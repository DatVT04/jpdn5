# N5 道場 — Web ôn luyện JLPT N5

Web app tự học JLPT N5 bằng tiếng Việt: flashcard SRS, 21 dạng câu hỏi luyện tập,
bảng kana, sổ tay ngữ pháp, tra cứu và **thi thử chấm điểm theo chuẩn JLPT**.

Chạy hoàn toàn offline, không cần build, không cần backend. Tiến độ lưu trong `localStorage`.

## Chạy

Mở thẳng `index.html` bằng trình duyệt, hoặc chạy một web server tĩnh cho mượt:

```bash
python -m http.server 5177
```

rồi mở http://localhost:5177

## Tính năng

| Màn hình | Nội dung |
|---|---|
| **Giáo trình 14 chương** | Toàn bộ nội dung bám sát giáo trình **GUNGUN JOUTATSU! Tiếng Nhật sơ cấp N5**: mỗi chương có từ vựng chia theo phần A/B/C/D, mẫu ngữ pháp kèm giải thích + câu ví dụ, chữ Hán kèm âm On/Kun và từ ví dụ. Có tiến độ từng chương, học thẻ, luyện tập và đề kiểm tra riêng cho chương |
| **Trang chủ** | Thẻ "chương đang học" để vào thẳng bài trên lớp, đếm ngược ngày thi, chuỗi ngày học, mục tiêu ngày, mức sẵn sàng thi (ước tính điểm nhóm A), heatmap 30 ngày, lộ trình gợi ý |
| **Ôn tập SRS** | Hàng đợi thẻ đến hạn theo thuật toán giãn cách (SM-2 rút gọn), chấm 4 mức Lại/Khó/Tốt/Dễ |
| **Flashcard** | 5 bộ thẻ (kanji · từ vựng · ngữ pháp · kana · lượng từ), **lọc theo chương**, chỉ thẻ chưa học / đang học / đến hạn / 80 kanji cốt lõi / chỉ động từ |
| **Luyện tập** | 26 dạng câu hỏi: nghĩa kanji, âm Hán Việt, cách đọc, chính tả (表記), nghĩa từ, trợ từ, mẫu ngữ pháp, **chia động từ**, kana, lượng từ, số đếm. Có chế độ gõ chữ (nhận cả kana lẫn romaji) |
| **Bảng chữ cái** | Hiragana + katakana đầy đủ (gojuon/dakuon/youon/gairaigo), ẩn romaji để tự kiểm tra, luyện gõ, và **đề thi thử kana** (20/40/60/80 câu, chọn phạm vi 1 hoặc cả 2 bảng, có bấm giờ) |
| **Ngữ pháp** | 127 mẫu theo 14 chương, kèm giải thích và câu ví dụ lấy từ sách (**có furigana trên chữ Hán** như trong giáo trình), phát âm, kiểm tra theo chương |
| **Tra cứu** | Tìm theo kanji/kana/romaji/nghĩa tiếng Việt — gõ **không dấu** cũng ra (`nuoc` → nước), katakana/hiragana như nhau; an toàn với bộ gõ Telex và bàn phím kana trên iOS; phím `/` mở tìm kiếm nhanh |
| **Thi thử** | **Đề kiểm tra chương** (25 câu trộn từ vựng – kanji – ngữ pháp của đúng chương đó, chấm theo %). **Đề bảng chữ cái** (trộn nhận mặt chữ · viết theo romaji · chữ dễ nhầm · quy tắc trường âm/っ/âm ghép · từ katakana, chấm theo %, mốc đạt 90%). Đề đầy đủ 3 phần (文字・語彙 25′ · 文法・読解 50′ · 聴解 30′), tính giờ từng phần, chấm theo nhóm A (120đ, liệt 38) và B (60đ, liệt 19), tổng đỗ ≥ 80. Có đề lẻ từng phần và mini test 15′ |
| **Thống kê** | Biểu đồ hoạt động 14 ngày, phân bố trình độ thẻ, độ chính xác theo bộ, lịch sử điểm thi thử, 15 mục hay sai nhất |
| **Cài đặt** | Sáng/tối, ẩn romaji, tự động phát âm, tốc độ đọc, mục tiêu ngày, ngày thi, xuất/nhập tiến độ `.json`, xoá dữ liệu |

Câu trả lời sai được tự động đẩy vào hàng đợi SRS để gặp lại sớm.

### Trên điện thoại
- Thanh tab dưới: Nhà · Ôn tập (có số thẻ đến hạn) · Kana · Luyện · Thi thử; nút 🔍 trên cùng mở Tra cứu, ☰ mở toàn bộ menu
- Khi đang làm bài, lật thẻ hoặc thi, thanh tab tự ẩn để không bấm nhầm thoát; nút **Tiếp theo** nằm cố định ở vùng ngón cái
- Chi tiết từ/kanji mở dạng bottom sheet; ô nhập giữ cỡ 16px để iOS không tự phóng to
- Thêm vào màn hình chính (Safari → Chia sẻ → *Thêm vào MH chính*) để dùng như app toàn màn hình, có icon riêng

## Phím tắt

`/` tìm kiếm · `Space` lật thẻ · `1–4` chọn đáp án / chấm thẻ · `Enter` câu tiếp · `S` phát âm · `T` đổi giao diện

## Cấu trúc

```
index.html
manifest.webmanifest   cấu hình cài như app (PWA) + icons/
css/style.css          giao diện (2 theme, responsive, bottom-nav trên mobile)
data/n5-gungun.js      dữ liệu trích từ giáo trình GUNGUN N5 (14 chương · 965 từ · 161 kanji · 127 mẫu ngữ pháp · 139 bảng chia động từ)
data/n5-kana.js        bảng hiragana/katakana, lượng từ, cấu trúc kỳ thi JLPT
data/n5-data.js        bộ dữ liệu N5 tổng hợp ban đầu — không còn nạp vào web, chỉ dùng làm nguồn nghĩa tiếng Việt khi dựng lại dữ liệu
data/n5-extra.js       8 đoạn đọc hiểu + 24 bài nghe + 18 câu quy tắc đọc kana (biên soạn thêm)
js/core.js             lưu trữ, SRS, kana⇄romaji, TTS, helper UI
js/quiz.js             bộ sinh câu hỏi + engine luyện tập
js/views-study.js      trang chủ, SRS, flashcard, quiz, kana, ngữ pháp, tra cứu
js/views-exam.js       thi thử, thống kê, cài đặt
js/app.js              router hash, phím tắt, khung app
```

## Nguồn dữ liệu

Từ vựng, chữ Hán và ngữ pháp được trích tự động từ 14 file PDF của bộ **GUNGUN JOUTATSU! Tiếng Nhật sơ cấp N5 (bản VIP 260829)** — đọc theo toạ độ từng ô trong bảng của sách nên giữ đúng thứ tự chương, phần A/B/C/D và số trang.

**Furigana**: cách đọc nhỏ phía trên chữ Hán được bóc theo toạ độ rồi gán lại đúng chữ (gộp các mảnh rời của từ ghép, ví dụ 昨日《きのう》), hiển thị bằng thẻ `<ruby>` nên đọc được trên mọi trình duyệt. Phần đọc to (TTS) tự bỏ furigana.

Những phần được bổ sung ngoài sách, đã ghi rõ để bạn biết:
- **Nghĩa tiếng Việt của chữ Hán**: sách chỉ cho âm Hán Việt + từ ví dụ. 95 chữ lấy nghĩa từ bộ dữ liệu N5 tổng hợp, 66 chữ còn lại do mình bổ sung.
- **Bảng chia động từ** (ます・từ điển・て・た・ない): sinh tự động theo quy tắc nhóm I/II/III như sách dạy ở chương 8, có xử lý ngoại lệ 行く・来る・する・あります.
- **Romaji**: chuyển tự động từ kana.
- **Bảng chữ cái, đọc hiểu, nghe hiểu, đề thi JLPT**: giữ nguyên từ bản trước.

Khoảng 3% mục có cách đọc chưa chuẩn (chủ yếu ở các bảng số đếm in 2 cột) — gặp chỗ nào sai bạn cứ báo để mình sửa.

## Lưu ý

- Phần **nghe** dùng giọng đọc tổng hợp của trình duyệt (Web Speech API), không phải file thu âm thật.
  Cần cài gói giọng tiếng Nhật của hệ điều hành; kiểm tra trong **Cài đặt → Phát âm**.
- Điểm thi thử là quy đổi tuyến tính theo tỉ lệ câu đúng, không phải thang điểm chuẩn hoá của JLPT thật —
  dùng để theo dõi tiến bộ, không phải dự đoán chính xác.
- Dữ liệu N5 tổng hợp từ Minna no Nihongo I, Try! N5, Soumatome N5 (JLPT không công bố danh sách chính thức từ 2010).
