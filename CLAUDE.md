# Paraphrase Studio: học paraphrase & collocation IELTS theo chủ đề

> Claude Code tự đọc file này. Giữ ngắn gọn, chỉ ghi đúng tình hình hiện tại.

## Người dùng & cách làm việc
- Dr. Quỳnh Tâm (bác sĩ sản phụ khoa), **mới học code**: trả lời **tiếng Việt**, đơn giản, từng bước.
- Mục tiêu: **paraphrase + collocation** cho **IELTS Academic** (Anh–Anh), Writing + Speaking.
- **Commit và push thẳng lên `main`** (không nhánh phụ, không PR). Repo `quynhtam1999/ielts`.
- App **đơn giản**: tự viết → **Xem đáp án** → tự bấm "Đã nhớ / Cần ôn". **Không trắc nghiệm, không chấm điểm.**
- Đã bỏ, **đừng thêm lại nếu chưa được hỏi**: trắc nghiệm, chấm điểm %, Writing, Speaking, Sổ từ vựng, Ôn thẻ, Tiến độ, bài tập/danh sách collocation riêng, Săn tham chiếu.

## Website & chạy
- **https://quynhtam1999.github.io/ielts/** (GitHub Pages, `main`, thư mục gốc). Push → tự cập nhật sau 1–2 phút.
- Trên máy: bấm đúp `index.html`. Dữ liệu học ở `localStorage`, khoá `paraphrase-studio-v1`.
- Đường dẫn luôn **tương đối** (`css/…`, `js/…`); có `.nojekyll`. Repo công khai (kể cả `anki/*.txt`).

## Giao diện
- **Nền tối, tối giản, đơn sắc hồng rose**; **không gradient, không bóng đổ, không emoji**.
- Màu ở `:root` (`css/style.css`): nền `#141013`, chữ `#f5e8ec`, nhấn `--rose #e98aa9`, chữ trên nút hồng `--on-rose`.
- **1 font có chân: Merriweather** (`--font`). Cỡ chữ gốc 18px (`html { font-size: 112.5% }`), điện thoại 17px.
- Biểu tượng nét mảnh: `App.icon('leaf')` (`js/icons.js`, bộ Lucide). Favicon: `favicon.svg`.
- Responsive: 900px (menu ☰), 640px (điện thoại).

## Nội dung
- **5 kỹ thuật paraphrase** (`js/data/techniques.js`, trang `#learn`).
- **32 chủ đề, 573 từ khoá** (`js/data/topics.js`): 20 chủ đề IELTS + 12 nhóm collocation theo chức năng (`group: "skill"`).
  - Từ khoá: `[từ, nghĩa, "cách gọi khác | …", "collocation | …", ghi chú?]`; chủ đề có `icon: "<tên Lucide>"`.
  - **`~` = từ khoá bỏ mạo từ đầu**: "the countryside" → `"protect the ~"` = protect the countryside. Cụm không có `~` hiện nguyên văn.
  - Nguồn: bộ Anki *English Collocations in Use* (`anki/*.txt`). `units: "I15 A32"` = Unit đã dùng (đủ 120/120). Xem: `python3 anki/list.py I15`.

## Kiến trúc
HTML/CSS/JS thuần, không build, **không ES modules** (chạy được qua `file://`). Mọi thứ gắn vào `window.App`; **thứ tự `<script>` trong `index.html` quan trọng**. Router: `#trang/a/b` → `App.views[trang].render(el, ['a','b'])`.

```
index.html          khung, menu (Trang chủ · Chủ đề · Tìm kiếm · Học kỹ thuật), nạp script
css/style.css       toàn bộ giao diện
js/ui.js            tạo App + tiện ích (esc, toast, ngày)
js/icons.js         biểu tượng
js/storage.js       App.store: { activity, topics, lastTopic }, streak
js/data/            techniques.js, topics.js
js/views/home.js    thống kê, Học tiếp, nhiệm vụ ngày (10 từ mới + ôn 5 từ cần ôn)
js/views/topics.js  #topics, #topics/<id>, #topics/<id>/terms/<n>; bare()/fillColl() xử lý ~
js/views/search.js  #search/<q>: tìm từ khoá, nghĩa, cách gọi khác, collocation (gõ không dấu được)
js/views/learn.js   #learn/<kỹ thuật>, #learn/warnings, #learn/tips
js/app.js           router
anki/list.py        xem collocation trong file Anki theo Unit
```

- Một từ khoá: tự viết ① cách gọi khác ② collocation → Xem đáp án (bấm cụm để nghe, en-GB) → Đã nhớ / Cần ôn → từ tiếp.
- Lưu: `state.topics[id][từ] = { ok: true | false | null, date }` (`null` = mới xem đáp án; dữ liệu cũ `{pct}` ≥ 60 = đã nhớ). Hoạt động ngày: từ mới → `topics`, từ đã làm → `review`.
- Chấm trạng thái: hồng đậm = đã nhớ · hồng nhạt = cần ôn · vòng = đã xem · mờ = chưa làm.

## Quy ước
- Giao diện & comment tiếng Việt; nội dung tiếng Anh theo **Anh–Anh** (-ise, -our, programme, judgement…).
- Chữ người dùng nhập → luôn qua `App.ui.esc()`.
- Kiểm thử: Playwright mở `file://…/index.html`, đi qua mọi trang: không `pageerror`, màn 390px không cuộn ngang.

## Có thể làm sau (chỉ khi được yêu cầu)
Nhận xét bằng AI (Claude API); thêm câu ví dụ cho collocation.
