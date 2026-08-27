/* =============================================================
   N5 道場 — dữ liệu bổ sung cho phần Đọc hiểu & Nghe hiểu
   (biên soạn theo phạm vi từ vựng/ngữ pháp N5)
   ============================================================= */
window.N5_EXTRA = {

  /* ---------- 読解: đoạn văn ngắn + câu hỏi ---------- */
  readings: [
    {
      id: 'r1', type: 'thông báo',
      jp: 'あしたは 学校が 休みです。テストは 来週の 月曜日に あります。教室は ３０２です。えんぴつと けしゴムを もって きて ください。',
      vi: 'Ngày mai trường nghỉ. Bài kiểm tra sẽ có vào thứ Hai tuần sau. Phòng học là 302. Hãy mang theo bút chì và cục tẩy.',
      questions: [
        { q: 'テストは いつ ありますか。', options: ['あした', '来週の 月曜日', '今日の 午後', '来月'], answer: 1, vi: 'Bài kiểm tra vào thứ Hai tuần sau.' },
        { q: '何を もって きますか。', options: ['ノートと 本', 'えんぴつと けしゴム', 'かさ', 'おべんとう'], answer: 1, vi: 'Mang bút chì và cục tẩy.' }
      ]
    },
    {
      id: 'r2', type: 'nhật ký',
      jp: 'きのうは 日曜日でした。朝 七時に おきて、家族と 朝ごはんを 食べました。それから、友だちと こうえんへ 行きました。こうえんで しゃしんを たくさん とりました。とても たのしかったです。',
      vi: 'Hôm qua là chủ nhật. Tôi dậy lúc 7 giờ sáng và ăn sáng cùng gia đình. Sau đó tôi đi công viên với bạn. Ở công viên tôi đã chụp rất nhiều ảnh. Rất vui.',
      questions: [
        { q: '朝ごはんは だれと 食べましたか。', options: ['友だちと', '家族と', 'ひとりで', '先生と'], answer: 1, vi: 'Ăn sáng cùng gia đình.' },
        { q: 'こうえんで 何を しましたか。', options: ['べんきょうしました', 'しゃしんを とりました', 'ねました', '本を 買いました'], answer: 1, vi: 'Đã chụp ảnh ở công viên.' }
      ]
    },
    {
      id: 'r3', type: 'giới thiệu bản thân',
      jp: 'はじめまして。わたしは グエンです。ベトナムから 来ました。今 大学で 日本語を べんきょうして います。しゅみは 音楽を 聞く ことです。どうぞ よろしく おねがいします。',
      vi: 'Rất vui được gặp. Tôi là Nguyên. Tôi đến từ Việt Nam. Hiện tôi đang học tiếng Nhật ở trường đại học. Sở thích của tôi là nghe nhạc. Rất mong được giúp đỡ.',
      questions: [
        { q: 'グエンさんは どこから 来ましたか。', options: ['中国', '韓国', 'ベトナム', 'アメリカ'], answer: 2, vi: 'Đến từ Việt Nam.' },
        { q: 'グエンさんの しゅみは 何ですか。', options: ['音楽を 聞く こと', 'えいがを 見る こと', 'りょこう', 'りょうり'], answer: 0, vi: 'Sở thích là nghe nhạc.' }
      ]
    },
    {
      id: 'r4', type: 'tra cứu thông tin',
      jp: '＜図書館の あんない＞　月曜日から 金曜日：九時から 八時まで。土曜日：十時から 五時まで。日曜日は 休みです。本は 二週間 かりる ことが できます。',
      vi: '<Hướng dẫn thư viện> Thứ Hai đến thứ Sáu: 9 giờ đến 8 giờ. Thứ Bảy: 10 giờ đến 5 giờ. Chủ nhật nghỉ. Có thể mượn sách trong 2 tuần.',
      questions: [
        { q: '土曜日は 何時までですか。', options: ['五時まで', '八時まで', '九時まで', '十時まで'], answer: 0, vi: 'Thứ Bảy mở đến 5 giờ.' },
        { q: '日曜日に 図書館へ 行く ことが できますか。', options: ['はい、できます', 'いいえ、休みです', '午前だけ できます', '午後だけ できます'], answer: 1, vi: 'Chủ nhật thư viện nghỉ.' },
        { q: '本は どのぐらい かりる ことが できますか。', options: ['一週間', '二週間', '一か月', '三日'], answer: 1, vi: 'Mượn được 2 tuần.' }
      ]
    },
    {
      id: 'r5', type: 'tin nhắn',
      jp: '山田さんへ　ごめんなさい。今日は 仕事が おおいですから、六時に 行く ことが できません。七時半ごろ えきの 前で 会いませんか。　田中',
      vi: 'Gửi anh Yamada. Xin lỗi. Hôm nay nhiều việc quá nên tôi không thể đến lúc 6 giờ. Khoảng 7 rưỡi mình gặp nhau trước ga nhé? Tanaka',
      questions: [
        { q: '田中さんは 何時に 会いたいですか。', options: ['六時', '七時', '七時半ごろ', '八時'], answer: 2, vi: 'Muốn gặp khoảng 7 giờ rưỡi.' },
        { q: 'どこで 会いますか。', options: ['会社', 'えきの 前', '田中さんの 家', 'こうえん'], answer: 1, vi: 'Gặp trước ga.' }
      ]
    },
    {
      id: 'r6', type: 'thư ngắn',
      jp: '先週の 土曜日、家族と 山へ 行きました。天気が よくて、とても きれいでした。山の 上で おべんとうを 食べました。来月も また 行きたいです。',
      vi: 'Thứ Bảy tuần trước tôi đã đi núi cùng gia đình. Thời tiết đẹp và rất nên thơ. Chúng tôi ăn cơm hộp trên núi. Tháng sau tôi lại muốn đi nữa.',
      questions: [
        { q: 'いつ 山へ 行きましたか。', options: ['先週の 土曜日', '今週の 日曜日', '来月', 'きのう'], answer: 0, vi: 'Đi vào thứ Bảy tuần trước.' },
        { q: '山の 上で 何を しましたか。', options: ['しゃしんを とりました', 'おべんとうを 食べました', 'ねました', 'およぎました'], answer: 1, vi: 'Ăn cơm hộp trên núi.' }
      ]
    },
    {
      id: 'r7', type: 'thông báo lớp học',
      jp: 'あしたの 日本語の じゅぎょうは 九時からです。しゅくだいを わすれないで ください。じしょを つかっても いいです。けいたい電話は つかっては いけません。',
      vi: 'Giờ học tiếng Nhật ngày mai bắt đầu từ 9 giờ. Đừng quên bài tập. Có thể dùng từ điển. Không được dùng điện thoại di động.',
      questions: [
        { q: 'じゅぎょうで つかっても いい ものは 何ですか。', options: ['けいたい電話', 'じしょ', 'パソコン', 'テレビ'], answer: 1, vi: 'Được dùng từ điển.' },
        { q: 'じゅぎょうは 何時からですか。', options: ['八時', '九時', '十時', '十一時'], answer: 1, vi: 'Bắt đầu từ 9 giờ.' }
      ]
    },
    {
      id: 'r8', type: 'sinh hoạt hằng ngày',
      jp: 'わたしは 毎日 じてんしゃで 会社へ 行きます。会社まで 二十分ぐらい かかります。雨の 日は バスで 行きます。仕事は 九時から 五時までです。',
      vi: 'Hằng ngày tôi đi làm bằng xe đạp. Đến công ty mất khoảng 20 phút. Ngày mưa tôi đi bằng xe buýt. Công việc từ 9 giờ đến 5 giờ.',
      questions: [
        { q: '雨の 日は どうやって 会社へ 行きますか。', options: ['じてんしゃで', 'バスで', 'あるいて', 'でんしゃで'], answer: 1, vi: 'Ngày mưa đi bằng xe buýt.' },
        { q: '仕事は 何時までですか。', options: ['五時まで', '六時まで', '九時まで', '四時まで'], answer: 0, vi: 'Làm đến 5 giờ.' }
      ]
    }
  ],

  /* ---------- 聴解: 即時応答 (nghe câu, chọn câu đáp) ---------- */
  responses: [
    { jp: 'おはようございます。', options: ['おはようございます。', 'おやすみなさい。', 'いただきます。'], answer: 0, vi: 'Chào buổi sáng → chào lại.' },
    { jp: 'ありがとうございました。', options: ['すみません。', 'どういたしまして。', 'はじめまして。'], answer: 1, vi: 'Cảm ơn → không có gì.' },
    { jp: 'すみません、今 何時ですか。', options: ['三時半です。', 'こうえんです。', '千円です。'], answer: 0, vi: 'Hỏi giờ → trả lời giờ.' },
    { jp: 'いってきます。', options: ['おかえりなさい。', 'いってらっしゃい。', 'ただいま。'], answer: 1, vi: 'Con đi đây → đi cẩn thận nhé.' },
    { jp: 'はじめまして。どうぞ よろしく。', options: ['こちらこそ よろしく おねがいします。', 'ごちそうさまでした。', 'また あした。'], answer: 0, vi: 'Chào lần đầu → tôi cũng vậy.' },
    { jp: 'いっしょに ひるごはんを 食べませんか。', options: ['いいですね、食べましょう。', 'はい、そうです。', 'いいえ、ちがいます。'], answer: 0, vi: 'Rủ ăn trưa → đồng ý.' },
    { jp: 'この かばんは いくらですか。', options: ['三千円です。', '三時です。', '三人です。'], answer: 0, vi: 'Hỏi giá → trả lời tiền.' },
    { jp: 'お名前は 何ですか。', options: ['田中です。', '日本人です。', '学生です。'], answer: 0, vi: 'Hỏi tên → trả lời tên.' },
    { jp: '日本語が 上手ですね。', options: ['いいえ、まだまだです。', 'はい、どうぞ。', 'いってらっしゃい。'], answer: 0, vi: 'Được khen → khiêm tốn.' },
    { jp: 'ここで たばこを すっても いいですか。', options: ['すみません、ここでは だめです。', 'はい、おねがいします。', 'いいえ、けっこうです。'], answer: 0, vi: 'Xin phép → từ chối lịch sự.' },
    { jp: 'ただいま。', options: ['おかえりなさい。', 'いってきます。', 'おやすみなさい。'], answer: 0, vi: 'Tôi về rồi → mừng bạn về.' },
    { jp: 'しゅうまつ 何を しますか。', options: ['友だちと えいがを 見ます。', 'とても たかいです。', 'はい、わかりました。'], answer: 0, vi: 'Hỏi kế hoạch → trả lời việc làm.' },
    { jp: 'お元気ですか。', options: ['はい、元気です。', 'いいえ、これです。', 'どうぞ よろしく。'], answer: 0, vi: 'Hỏi thăm → trả lời khỏe.' },
    { jp: 'すみません、駅は どこですか。', options: ['あそこです。', '八時です。', 'とても おいしいです。'], answer: 0, vi: 'Hỏi đường → chỉ vị trí.' },
    { jp: 'この 本を かりても いいですか。', options: ['はい、どうぞ。', 'いいえ、ちがいます。', 'こちらこそ。'], answer: 0, vi: 'Xin mượn → cho phép.' },
    { jp: 'コーヒーは いかがですか。', options: ['ありがとうございます、いただきます。', 'いってらっしゃい。', 'はじめまして。'], answer: 0, vi: 'Mời cà phê → nhận lời.' }
  ],

  /* ---------- Quy tắc đọc kana: trường âm · âm ngắt · âm ghép · trợ từ ---------- */
  kanaRules: [
    { jp: 'きって', options: ['kite', 'kitte', 'kitté', 'kide'], answer: 1, vi: 'っ nhỏ (sokuon) = gấp đôi phụ âm đứng sau.' },
    { jp: 'がっこう', options: ['gakou', 'gakkou', 'gatkou', 'gakkuo'], answer: 1, vi: 'っ + か → kk; こう là trường âm o.' },
    { jp: 'ざっし', options: ['zashi', 'zasshi', 'zatshi', 'zashshi'], answer: 1, vi: 'っ + し → sshi.' },
    { jp: 'きっぷ', options: ['kipu', 'kippu', 'kitpu', 'kibu'], answer: 1, vi: 'っ + ぷ → ppu.' },
    { jp: 'おかあさん', options: ['okasan', 'okaasan', 'okausan', 'okahasan'], answer: 1, vi: 'Trường âm hàng あ: kéo dài bằng あ.' },
    { jp: 'おおきい', options: ['okii', 'ookii', 'oukii', 'ookai'], answer: 1, vi: 'Trường âm お viết bằng お (ngoại lệ, không phải う).' },
    { jp: 'せんせい', options: ['sensei', 'sensii', 'senseii', 'sense'], answer: 0, vi: 'Trường âm hàng え thường viết bằng い.' },
    { jp: 'コーヒー', options: ['kohi', 'koohii', 'kouhii', 'kohii'], answer: 1, vi: 'Katakana kéo dài bằng dấu ー.' },
    { jp: 'ケーキ', options: ['keki', 'keeki', 'keiki', 'kekii'], answer: 1, vi: 'ー kéo dài nguyên âm đứng trước.' },
    { jp: 'きょう', options: ['kiyou', 'kyou', 'kiyo', 'kyo'], answer: 1, vi: 'き + ょ nhỏ = 1 âm tiết kyo, thêm う thành trường âm.' },
    { jp: 'しゅくだい', options: ['shiyukudai', 'shukudai', 'syukudai', 'shukdai'], answer: 1, vi: 'し + ゅ nhỏ = shu.' },
    { jp: 'ちゃわん', options: ['chiyawan', 'chawan', 'tyawan', 'chiawan'], answer: 1, vi: 'ち + ゃ nhỏ = cha.' },
    { jp: 'じゅぎょう', options: ['jugyou', 'jyugiyou', 'juugyo', 'jigyou'], answer: 0, vi: 'じ + ゅ = ju; ぎ + ょ = gyo.' },
    { q: 'Trong câu「わたしは がくせいです」, trợ từ「は」đọc là gì?', jp: 'わたしは がくせいです', options: ['ha', 'wa', 'ba', 'a'], answer: 1, vi: 'は làm trợ từ chủ đề thì đọc là "wa".' },
    { q: 'Trong câu「ほんを よみます」, trợ từ「を」đọc là gì?', jp: 'ほんを よみます', options: ['wo', 'o', 'ho', 'yo'], answer: 1, vi: 'を làm trợ từ tân ngữ đọc là "o".' },
    { q: 'Trong câu「がっこうへ いきます」, trợ từ「へ」đọc là gì?', jp: 'がっこうへ いきます', options: ['he', 'e', 'ke', 'be'], answer: 1, vi: 'へ làm trợ từ chỉ hướng đọc là "e".' },
    { jp: 'ふうとう', options: ['futou', 'fuutou', 'huto', 'fuuto'], answer: 1, vi: 'Cả hai âm đều là trường âm う.' },
    { jp: 'にほんご', options: ['nihongo', 'nihonngo', 'nihoungo', 'nifongo'], answer: 0, vi: 'ん chỉ là 1 âm mũi, không thêm nguyên âm.' }
  ],

  /* ---------- 聴解: ポイント理解 (nghe đoạn, trả lời câu hỏi) ---------- */
  points: [
    { jp: 'わたしは 毎朝 六時に おきて、七時に 朝ごはんを 食べます。', q: '何時に 朝ごはんを 食べますか。', options: ['六時', '七時', '八時', '九時'], answer: 1, vi: 'Ăn sáng lúc 7 giờ.' },
    { jp: 'きのう スーパーで たまごと 牛乳を 買いました。パンは 買いませんでした。', q: '何を 買いましたか。', options: ['パンと たまご', 'たまごと 牛乳', '牛乳と パン', '何も 買いませんでした'], answer: 1, vi: 'Mua trứng và sữa.' },
    { jp: 'あしたは 雨が ふるでしょう。かさを もって いって ください。', q: 'あしたの 天気は どうですか。', options: ['はれ', 'くもり', '雨', 'ゆき'], answer: 2, vi: 'Ngày mai trời mưa.' },
    { jp: 'わたしの へやには テレビが ありません。パソコンが あります。', q: 'へやに 何が ありますか。', options: ['テレビ', 'パソコン', 'ラジオ', '何も ありません'], answer: 1, vi: 'Trong phòng có máy tính.' },
    { jp: '駅までは バスで 十五分ぐらい かかります。', q: '駅まで どのぐらい かかりますか。', options: ['五分ぐらい', '十分ぐらい', '十五分ぐらい', '五十分ぐらい'], answer: 2, vi: 'Mất khoảng 15 phút.' },
    { jp: '田中さんは 兄が 二人 いますが、姉は いません。', q: '田中さんは 兄が 何人 いますか。', options: ['一人', '二人', '三人', 'いません'], answer: 1, vi: 'Có 2 anh trai.' },
    { jp: 'テストは 金曜日では ありません。木曜日です。', q: 'テストは いつですか。', options: ['水曜日', '木曜日', '金曜日', '土曜日'], answer: 1, vi: 'Kiểm tra vào thứ Năm.' },
    { jp: 'わたしは 犬が 好きですが、猫は あまり 好きでは ありません。', q: '何が 好きですか。', options: ['犬', '猫', '犬と 猫', 'どちらも 好きでは ありません'], answer: 0, vi: 'Thích chó.' }
  ]
};
