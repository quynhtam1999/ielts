# Paraphrase Studio: học paraphrase & collocation IELTS theo chủ đề

> File này Claude Code tự đọc khi bắt đầu hội thoại. Giữ ngắn gọn, cập nhật khi dự án thay đổi.

## Người dùng & cách làm việc
- Dr. Quỳnh Tâm (bác sĩ sản phụ khoa), **mới học code**. Trả lời bằng **tiếng Việt**, đơn giản, từng bước.
- Mục tiêu: học **paraphrase + collocation** cho **IELTS Academic** (Anh–Anh), phục vụ Writing + Speaking.
- **Git: commit và push thẳng lên `main`** (người dùng đã cho phép, không cần nhánh phụ/PR).
- Repo: **`quynhtam1999/ielts`** (tên cũ `ielts-writing`, GitHub tự chuyển hướng).
- Người dùng muốn app **đơn giản**: **KHÔNG trắc nghiệm** (chọn đáp án), chỉ bài **tự điền**. Đã bỏ theo yêu cầu: Luyện tập (trắc nghiệm), Writing, Speaking, Sổ từ vựng, Ôn thẻ, Tiến độ. Đừng thêm lại nếu chưa được hỏi.

## Nội dung học
- **5 kỹ thuật paraphrase** (`#learn`): lên/xuống cấp độ; gọi theo vai trò; đổi từ loại; đổi cấu trúc; chuỗi tham chiếu. Cảnh báo: đồng nghĩa không thay thế hoàn toàn, giữ nguyên từ khoá (public transport, traffic).
- **32 chủ đề** (`js/data/topics.js`): 20 chủ đề IELTS + 12 nhóm collocation theo chức năng (`group: 'skill'`: quan điểm, nguyên nhân – kết quả, xu hướng/Task 1…).
  - 16 chủ đề đầu có **8 từ khoá** tự soạn: `[từ, nghĩa, "cách gọi khác | …", "collocation ~ | …" (~ = từ khoá), ghi chú?]`.
  - `units: 'I15 A32'` = các Unit sách *English Collocations in Use* (I = Intermediate, A = Advanced) gắn vào chủ đề. Đủ 120/120 Unit, không trùng.
- **1.700 collocation** từ bộ Anki của người dùng (`anki/*.txt`, xuất từ Anki dạng *Notes in Plain Text*) → `python3 anki/build.py` tạo `js/data/collocations.js` (**không sửa tay**). Mỗi dòng: `[unit, collocation, nghĩa, câu ví dụ có <b>chỗ cần điền</b>, nghĩa câu, biến thể "a · b"]`. File "(Revision)" là tập con, bỏ qua.

## Chạy & triển khai
- Không cần cài đặt: **bấm đúp `index.html`** (Chrome/Edge). Dữ liệu lưu `localStorage` khoá `paraphrase-studio-v1`.
- **Website: https://quynhtam1999.github.io/ielts/** (GitHub Pages, nhánh `main`, thư mục `/ (root)`). Push lên `main` → website tự cập nhật sau 1–2 phút.
- `.nojekyll`; mọi đường dẫn **tương đối** (`css/…`, `js/…`), không bắt đầu bằng `/`.
- Repo & website **công khai**: file `anki/*.txt` cũng xem được công khai.

## Kiến trúc
- **HTML/CSS/JS thuần**, không framework, không build, **không ES modules** (vì `file://`). Mọi thứ gắn vào `window.App`; **thứ tự `<script>` trong `index.html` quan trọng**.
- Router hash: `#trang/a/b` → `App.views[trang].render(el, ['a','b'])` (`js/app.js`).
- Giao diện **dark premium** (kính mờ, gradient tím–xanh, vàng), font Inter, responsive (900px menu ☰, 640px điện thoại). Màu ở `:root` trong `css/style.css`.

```
index.html             khung + menu (Trang chủ, Chủ đề, Học kỹ thuật, Săn tham chiếu) + nạp script
css/style.css          toàn bộ giao diện
js/ui.js               tạo App + tiện ích (esc, toast, shuffle, ngày)
js/storage.js          App.store: state = { activity, topics, colloc, hunts, lastTopic }, streak, recordColloc
js/data/techniques.js  lý thuyết 5 kỹ thuật, cảnh báo, cách học
js/data/topics.js      32 chủ đề (từ khoá tự soạn + units)
js/data/collocations.js  TẠO TỰ ĐỘNG từ anki/ (App.data.units, App.data.collocs)
js/views/home.js       streak, thống kê, "Học tiếp" chủ đề gần nhất, nhiệm vụ ngày (5 từ khoá + 20 câu collocation)
js/views/topics.js     toàn bộ trang Chủ đề (bảng dưới)
js/views/learn.js      #learn/<tech>: lý thuyết
js/views/hunt.js       #hunt: dán đoạn văn, tô 4 chuỗi tham chiếu, lưu
anki/build.py          chuyển file Anki .txt → js/data/collocations.js
```

| Hash | Chức năng |
|---|---|
| `#topics` | lưới chủ đề (2 nhóm), thanh tiến độ |
| `#topics/<id>` | chọn cách học: 📝 Từ khoá / 🧩 Điền collocation / 📖 Danh sách |
| `#topics/<id>/terms/<n>` | tự điền ① cách gọi khác ② collocation → Kiểm tra: so khớp theo từ gốc (stem, bỏ từ chức năng, chấp nhận viết gọn ≥ ½ cụm hoặc 1 vế của "A and B"); ✓ trúng / nét đứt thiếu / vàng = ngoài đáp án. Collocation trong sách chứa từ khoá = **điểm cộng** (mỗi cụm người dùng viết tính 1 lần). `terms/done` = tổng kết. Lưu `state.topics[id][term] = {pct, date}` |
| `#topics/<id>/colloc` | 10 câu: nghĩa VN + câu ví dụ có ô trống → gõ đúng nguyên văn (không phân biệt hoa thường); ưu tiên câu sai → chưa gặp → đã thuộc lâu nhất; 🔊 đọc câu (speechSynthesis en-GB). Lưu `state.colloc[collocation] = {ok, bad, last, lastOk}` |
| `#topics/<id>/list` | danh sách theo Unit, ô tìm kiếm, ✓/✕ theo lần làm gần nhất |

## Quy ước
- Giao diện & comment: tiếng Việt. Nội dung tiếng Anh: Anh–Anh (BrE).
- Chữ người dùng nhập → luôn qua `App.ui.esc()`. Dữ liệu trong `js/data/` là tin cậy (được có HTML; `build.py` chỉ giữ thẻ `<b>`).
- Thêm nội dung: sửa `js/data/topics.js`, hoặc sửa/thêm file Anki rồi chạy `python3 anki/build.py`.
- Kiểm thử: Playwright mở `file://…/index.html`, đi qua mọi hash, không có `pageerror`, màn hình 390px không cuộn ngang.

## Hướng phát triển (chỉ làm khi được yêu cầu)
Thêm từ khoá cho các chủ đề chỉ có collocation; nhận xét bằng AI (Claude API).
