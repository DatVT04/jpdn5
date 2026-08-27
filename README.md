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
| **Trang chủ** | Đếm ngược ngày thi, chuỗi ngày học, mục tiêu ngày, mức sẵn sàng thi (ước tính điểm nhóm A), heatmap 30 ngày, lộ trình gợi ý |
| **Ôn tập SRS** | Hàng đợi thẻ đến hạn theo thuật toán giãn cách (SM-2 rút gọn), chấm 4 mức Lại/Khó/Tốt/Dễ |
| **Flashcard** | 5 bộ thẻ (kanji · từ vựng · ngữ pháp · kana · lượng từ), lọc theo chủ đề, chỉ thẻ chưa học / đang học / đến hạn / 80 kanji cốt lõi / chỉ động từ |
| **Luyện tập** | 21 dạng câu hỏi: nghĩa kanji, âm Hán Việt, cách đọc, chính tả (表記), nghĩa từ, trợ từ, mẫu ngữ pháp, **chia động từ**, kana, lượng từ, số đếm. Có chế độ gõ chữ (nhận cả kana lẫn romaji) |
| **Bảng chữ cái** | Hiragana + katakana đầy đủ (gojuon/dakuon/youon/gairaigo), ẩn romaji để tự kiểm tra, luyện gõ, và **đề thi thử kana** (20/40/60/80 câu, chọn phạm vi 1 hoặc cả 2 bảng, có bấm giờ) |
| **Ngữ pháp** | 94 mẫu chia 12 nhóm, ví dụ có kana + bản dịch, phát âm, kiểm tra theo nhóm |
| **Tra cứu** | Tìm theo kanji/kana/romaji/nghĩa tiếng Việt; phím `/` mở tìm kiếm nhanh ở mọi màn hình |
| **Thi thử** | **Đề bảng chữ cái** (trộn nhận mặt chữ · viết theo romaji · chữ dễ nhầm · quy tắc trường âm/っ/âm ghép · từ katakana, chấm theo %, mốc đạt 90%). Đề đầy đủ 3 phần (文字・語彙 25′ · 文法・読解 50′ · 聴解 30′), tính giờ từng phần, chấm theo nhóm A (120đ, liệt 38) và B (60đ, liệt 19), tổng đỗ ≥ 80. Có đề lẻ từng phần và mini test 15′ |
| **Thống kê** | Biểu đồ hoạt động 14 ngày, phân bố trình độ thẻ, độ chính xác theo bộ, lịch sử điểm thi thử, 15 mục hay sai nhất |
| **Cài đặt** | Sáng/tối, ẩn romaji, tự động phát âm, tốc độ đọc, mục tiêu ngày, ngày thi, xuất/nhập tiến độ `.json`, xoá dữ liệu |

Câu trả lời sai được tự động đẩy vào hàng đợi SRS để gặp lại sớm.

## Phím tắt

`/` tìm kiếm · `Space` lật thẻ · `1–4` chọn đáp án / chấm thẻ · `Enter` câu tiếp · `S` phát âm · `T` đổi giao diện

## Cấu trúc

```
index.html
css/style.css          giao diện (2 theme, responsive, bottom-nav trên mobile)
data/n5-data.js        dữ liệu N5 gốc (102 kanji · 549 từ · 94 ngữ pháp · kana · lượng từ)
data/n5-extra.js       8 đoạn đọc hiểu + 24 bài nghe + 18 câu quy tắc đọc kana (biên soạn thêm)
js/core.js             lưu trữ, SRS, kana⇄romaji, TTS, helper UI
js/quiz.js             bộ sinh câu hỏi + engine luyện tập
js/views-study.js      trang chủ, SRS, flashcard, quiz, kana, ngữ pháp, tra cứu
js/views-exam.js       thi thử, thống kê, cài đặt
js/app.js              router hash, phím tắt, khung app
```

## Lưu ý

- Phần **nghe** dùng giọng đọc tổng hợp của trình duyệt (Web Speech API), không phải file thu âm thật.
  Cần cài gói giọng tiếng Nhật của hệ điều hành; kiểm tra trong **Cài đặt → Phát âm**.
- Điểm thi thử là quy đổi tuyến tính theo tỉ lệ câu đúng, không phải thang điểm chuẩn hoá của JLPT thật —
  dùng để theo dõi tiến bộ, không phải dự đoán chính xác.
- Dữ liệu N5 tổng hợp từ Minna no Nihongo I, Try! N5, Soumatome N5 (JLPT không công bố danh sách chính thức từ 2010).
