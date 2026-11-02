# Paraphrase Studio: IELTS paraphrase trainer

> File này Claude Code tự đọc khi bắt đầu hội thoại. Giữ ngắn gọn, cập nhật khi dự án thay đổi.

## Người dùng & cách làm việc
- Dr. Quỳnh Tâm (bác sĩ sản phụ khoa), **mới học code**. Trả lời bằng **tiếng Việt**, đơn giản, từng bước.
- Mục tiêu: luyện **paraphrase** cho **IELTS Academic**, phục vụ **Writing + Speaking**.
- **Git: commit và push thẳng lên `main`** (người dùng đã cho phép, không cần nhánh phụ/PR).

## Nội dung học cốt lõi
1. **Lên/xuống cấp độ**: homes, shops… ↔ facilities; area → zone → residential area.
2. **Gọi theo vai trò** (quan trọng nhất): people → residents/commuters/pedestrians; shops → retail.
3. **Đổi từ loại**: separate → separation; zone → zoning; convenient → inconvenience.
4. **Đổi cấu trúc**: đổi chủ thể, chủ động ↔ bị động, mệnh đề → cụm danh từ.
5. **Chuỗi tham chiếu**: zoning → this approach → this arrangement → separating these facilities.

Cảnh báo: đồng nghĩa không thay thế hoàn toàn (school district ≠ khu trường học); giữ nguyên từ khoá (public transport, traffic).
Cách học: sổ từ 4 cột (Tổng quát / Cụ thể / Theo vai trò / Biến thể từ loại), săn chuỗi tham chiếu, mỗi ngày 1 đề viết 3 mở bài, kiểm tra collocation.

## Chạy & triển khai
- Không cần cài đặt: **bấm đúp `index.html`** (Chrome/Edge). Dữ liệu lưu trong `localStorage` (khoá `paraphrase-studio-v1`). Sao lưu: trang Tiến độ → Xuất dữ liệu.
- **Website: https://quynhtam1999.github.io/ielts/** (GitHub Pages, deploy từ nhánh `main`, thư mục `/ (root)`). Repo đổi tên `ielts-writing` → `ielts` để có đường dẫn `/ielts`. Push lên `main` là website tự cập nhật sau 1–2 phút.
- `.nojekyll` để GitHub Pages phục vụ file tĩnh nguyên trạng. Mọi đường dẫn trong code phải là **tương đối** (`css/…`, `js/…`), không bắt đầu bằng `/`.
- Dữ liệu trên website và khi mở file trên máy là **hai nơi riêng**; chuyển bằng Xuất/Nhập dữ liệu.

## Kiến trúc
- **HTML/CSS/JS thuần**, không framework, không build. **Không dùng ES modules** (vì `file://` chặn). Mọi thứ gắn vào `window.App`; **thứ tự `<script>` trong `index.html` quan trọng**.
- Router hash: `#trang/tham-so` → `App.views[trang].render(el, args)` (`js/app.js`).
- Giao diện: **dark premium** (nền tối, kính mờ, gradient tím–xanh, điểm nhấn vàng), font Inter, responsive (breakpoint 900px menu ☰, 640px điện thoại). Màu chỉnh ở biến `:root` trong `css/style.css`.

```
index.html             khung + menu + nạp script
css/style.css          toàn bộ giao diện
js/ui.js               tạo App + tiện ích (esc, toast, shuffle, ngày)
js/storage.js          App.store: lưu/đọc, streak, ôn thẻ Leitner [0,1,2,4,7,15,30,60] ngày, xuất/nhập JSON
js/analyzer.js         App.analyzer: so bài với đề (cụm 3 từ chép đề, % từ lấy lại, từ lặp)
js/data/techniques.js  lý thuyết 5 kỹ thuật, cảnh báo, cách học
js/data/wordbank.js    sổ từ mẫu (chép vào localStorage lần đầu)
js/data/drills.js      câu luyện: mcq / type / ref ({{+đúng}} {{-nhiễu}}); tech: level|role|form|structure|reference|caution
js/data/prompts.js     đề Writing Task 2 (keep = từ khoá được giữ, samples = mở bài mẫu) + Speaking Part 1/2/3
js/views/*.js          mỗi file một trang (bảng dưới)
```

| Hash | Chức năng |
|---|---|
| `#home` | streak, thống kê, nhiệm vụ ngày (10 câu luyện, 1 đề viết, 1 câu nói, ôn thẻ) |
| `#learn/<tech>` | lý thuyết + cảnh báo + cách học |
| `#drills/<tech>` | 10 câu/lượt; `all`, `mistakes`, `caution` |
| `#writing/<id>` | 3 mở bài + chọn kỹ thuật + phân tích + bài mẫu; `custom` tự nhập đề; `history` |
| `#speaking/<id>` | đọc câu hỏi (speechSynthesis), ghi âm (MediaRecorder), giọng nói → chữ (Web Speech API, Chrome/Edge), phân tích |
| `#bank` | sổ từ 4 cột + collocation, thêm/sửa/xoá, lọc chủ đề |
| `#review` | thẻ ôn ngắt quãng |
| `#hunt` | dán đoạn văn, tô 4 chuỗi tham chiếu, lưu |
| `#data` | % đúng theo kỹ thuật, lịch 28 ngày, xuất/nhập/xoá dữ liệu |

## Quy ước
- Giao diện & comment: tiếng Việt. Nội dung tiếng Anh: Anh–Anh (BrE).
- Chữ người dùng nhập → luôn qua `App.ui.esc()`. Dữ liệu trong `js/data/` là tin cậy (được có HTML).
- Thêm nội dung chỉ cần sửa `js/data/*`.
- Kiểm thử: Playwright mở `file://…/index.html`, đi qua mọi hash, không có `pageerror`, kiểm tra màn hình 390px không cuộn ngang.

## Hướng phát triển
Nhận xét bằng AI (Claude API, cần API key); thêm Task 1; thêm chủ đề từ vựng; chế độ thi thử có giờ.
