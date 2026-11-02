# Paraphrase Studio: học paraphrase & collocation IELTS theo chủ đề

> File này Claude Code tự đọc khi bắt đầu hội thoại. Giữ ngắn gọn, cập nhật khi dự án thay đổi.

## Người dùng & cách làm việc
- Dr. Quỳnh Tâm (bác sĩ sản phụ khoa), **mới học code**. Trả lời bằng **tiếng Việt**, đơn giản, từng bước.
- Mục tiêu: học **paraphrase + collocation** cho **IELTS Academic** (Anh–Anh), phục vụ Writing + Speaking.
- **Git: commit và push thẳng lên `main`** (người dùng đã cho phép, không cần nhánh phụ/PR).
- Repo: **`quynhtam1999/ielts`** (tên cũ `ielts-writing`, GitHub tự chuyển hướng).
- Người dùng muốn app **đơn giản**:
  - **KHÔNG trắc nghiệm**, **KHÔNG chấm điểm tự động**: chỉ tự viết → **hiện đáp án** → người học tự so, tự bấm "Đã nhớ / Cần ôn".
  - Đã bỏ theo yêu cầu: Luyện tập (trắc nghiệm), Writing, Speaking, Sổ từ vựng, Ôn thẻ, Tiến độ, 🧩 Điền collocation vào câu, 📖 Danh sách collocation, chấm điểm %. Đừng thêm lại nếu chưa được hỏi.
  - Giao diện **sang trọng, tối giản, gradient cao cấp**.

## Nội dung học
- **5 kỹ thuật paraphrase** (`#learn`): lên/xuống cấp độ; gọi theo vai trò; đổi từ loại; đổi cấu trúc; chuỗi tham chiếu.
- **32 chủ đề, 573 từ khoá** (`js/data/topics.js`): 20 chủ đề IELTS + 12 nhóm collocation theo chức năng (`group: "skill"`).
  - Mỗi từ khoá: `[từ, nghĩa, "cách gọi khác | …", "collocation | …", ghi chú?]`.
  - Dấu **`~` = từ khoá bỏ mạo từ đầu**: từ "the countryside" → `"protect the ~"` = protect the countryside, `"unspoilt ~"` = unspoilt countryside. Cụm không có `~` hiện nguyên văn (dùng khi cần số ít: "a fulfilling job" cho từ "jobs").
  - Soạn từ bộ Anki *English Collocations in Use* của người dùng (`anki/*.txt`, xuất "Notes in Plain Text"); khoảng 1.480/1.700 cụm trong sách đã nằm trong từ khoá. Phần còn lại chủ yếu là trạng từ nhấn mạnh (highly unlikely…) và cụm động từ không gắn danh từ.
  - `units: "I15 A32"` = Unit sách đã dùng cho chủ đề (I = Intermediate, A = Advanced), đủ 120/120 Unit. Xem nhanh: `python3 anki/list.py I15 A32`.

## Chạy & triển khai
- Không cần cài đặt: **bấm đúp `index.html`** (Chrome/Edge). Dữ liệu lưu `localStorage` khoá `paraphrase-studio-v1`.
- **Website: https://quynhtam1999.github.io/ielts/** (GitHub Pages, nhánh `main`, thư mục `/ (root)`). Push lên `main` → website tự cập nhật sau 1–2 phút.
- `.nojekyll`; mọi đường dẫn **tương đối** (`css/…`, `js/…`), không bắt đầu bằng `/`.
- Repo & website **công khai**: file `anki/*.txt` cũng xem được công khai.

## Kiến trúc
- **HTML/CSS/JS thuần**, không framework, không build, **không ES modules** (vì `file://`). Mọi thứ gắn vào `window.App`; **thứ tự `<script>` trong `index.html` quan trọng**.
- Router hash: `#trang/a/b` → `App.views[trang].render(el, ['a','b'])` (`js/app.js`).
- Giao diện tối sang trọng: nền đen sâu + quầng sáng rất nhẹ, gradient tím → hồng → vàng champagne chỉ cho điểm nhấn, **1 font có chân duy nhất: Merriweather** (dễ đọc, đủ dấu tiếng Việt; biến `--font`), nút bo tròn, ít viền. Responsive (900px menu ☰, 640px điện thoại). Màu ở `:root` trong `css/style.css`.

```
index.html             khung + menu (Trang chủ, Chủ đề, Tìm kiếm, Học kỹ thuật, Săn tham chiếu) + nạp script
css/style.css          toàn bộ giao diện
js/ui.js               tạo App + tiện ích (esc, toast, ngày)
js/storage.js          App.store: state = { activity, topics, hunts, lastTopic }, streak
js/data/techniques.js  lý thuyết 5 kỹ thuật, cảnh báo, cách học
js/data/topics.js      32 chủ đề, 573 từ khoá
js/views/home.js       streak, thống kê, "Học tiếp", nhiệm vụ ngày (10 từ mới + ôn 5 từ "cần ôn")
js/views/topics.js     trang Chủ đề (bảng dưới); bare()/fillColl() xử lý dấu ~
js/views/search.js     #search: tìm trong mọi từ khoá (bỏ dấu tiếng Việt, ưu tiên khớp nguyên cụm)
js/views/learn.js      #learn/<tech>: lý thuyết
js/views/hunt.js       #hunt: dán đoạn văn, tô 4 chuỗi tham chiếu, lưu
anki/list.py           xem collocation trong file Anki theo Unit (để soạn thêm từ khoá)
```

| Hash | Chức năng |
|---|---|
| `#topics` | lưới chủ đề (2 nhóm) + ô tìm kiếm |
| `#topics/<id>` | danh sách từ khoá (chấm: xanh đã nhớ · vàng cần ôn · vòng đã xem · xám chưa làm), nút Làm tiếp / Ôn từ cần ôn |
| `#topics/<id>/terms/<n>` | tự viết ① cách gọi khác ② collocation → **Xem đáp án** (bấm cụm để nghe, en-GB) → ✓ Đã nhớ / ↺ Cần ôn → sang từ tiếp. Lưu `state.topics[id][từ] = { ok: true/false/null, date }` (dữ liệu cũ `{pct}`: ≥ 60% = đã nhớ). Hoạt động: từ mới → `topics`, từ đã làm → `review` |
| `#search/<q>` | tìm theo từ khoá, nghĩa, cách gọi khác, collocation; bấm kết quả để luyện |

## Quy ước
- Giao diện & comment: tiếng Việt. Nội dung tiếng Anh: Anh–Anh (BrE: -ise, -our, programme, offence, judgement…).
- Chữ người dùng nhập → luôn qua `App.ui.esc()`. Dữ liệu trong `js/data/` là tin cậy.
- Thêm nội dung: sửa `js/data/topics.js` (chép 1 khối có sẵn). Nhớ quy ước `~` ở trên.
- Kiểm thử: Playwright mở `file://…/index.html`, đi qua mọi hash, không có `pageerror`, màn hình 390px không cuộn ngang.

## Hướng phát triển (chỉ làm khi được yêu cầu)
Nhận xét bằng AI (Claude API); thêm ví dụ câu cho từng collocation.
