// Nội dung lý thuyết: 5 kỹ thuật paraphrase, cảnh báo và cách học.
// Muốn sửa lời giải thích, chỉ cần sửa chữ trong file này.
App.data.techniques = [
  {
    id: 'level',
    no: 1,
    name: 'Lên hoặc xuống cấp độ',
    short: 'Tổng quát ↔ Cụ thể',
    idea: 'Thay một nhóm từ cụ thể bằng một từ bao quát hơn, hoặc ngược lại, triển khai một từ chung thành các ví dụ cụ thể.',
    table: {
      head: ['Cụ thể', 'Tổng quát hơn'],
      rows: [
        ['homes, shops, schools, offices', 'facilities, buildings'],
        ['school buses, metro lines', 'public transport'],
        ['noise, smoke, dust', 'pollution, disturbance'],
      ],
    },
    extra: 'Và ngược lại: <b>area</b> (chung) → <b>zone</b> (khu theo quy hoạch) → <b>residential area / business district</b> (cụ thể).',
    tip: 'Trong Task 2, mở bài thường dùng từ tổng quát, thân bài đi xuống từ cụ thể và ví dụ. Đi theo hướng này, bạn tự nhiên tránh được lặp từ.',
  },
  {
    id: 'role',
    no: 2,
    name: 'Gọi theo chức năng hoặc vai trò',
    short: 'Nó đóng vai trò gì?',
    idea: 'Đây là kỹ thuật đáng học nhất. Thay vì hỏi “từ đồng nghĩa là gì?”, hãy hỏi “trong câu này, nó đóng vai trò gì?”',
    table: {
      head: ['Từ gốc', 'Gọi theo vai trò / chức năng'],
      rows: [
        ['place', 'destination (nơi người ta đi đến)'],
        ['people', 'residents (người sống ở đó), commuters (người đi lại hằng ngày), working parents, pedestrians'],
        ['shops / schools / offices', 'retail / education / business (gọi theo ngành)'],
        ['doctors', 'healthcare professionals, practitioners, paediatricians, obstetricians'],
      ],
    },
    extra: 'Cùng là “people”, nhưng trong câu về giao thông họ là <b>commuters</b>, trong câu về tiếng ồn họ là <b>residents</b>, trong câu về vỉa hè họ là <b>pedestrians</b>.',
    tip: 'Trước khi đổi một danh từ chỉ người hoặc nơi chốn, hãy tự hỏi: người/nơi này đang làm gì trong câu?',
  },
  {
    id: 'form',
    no: 3,
    name: 'Đổi từ loại',
    short: 'Tính từ ↔ Động từ ↔ Danh từ',
    idea: 'Giữ nguyên gốc từ nhưng đổi từ loại, rồi xây lại câu quanh từ loại mới.',
    table: {
      head: ['Từ gốc', 'Biến thể'],
      rows: [
        ['separate (adj/v)', 'separating (V-ing) → separation (n) → separately (adv)'],
        ['zone (n)', 'zoning (n, việc phân khu)'],
        ['convenient (adj)', 'convenience (n) → inconvenience (n) → conveniently (adv)'],
        ['pollute (v)', 'pollution (n) → polluted (adj) → pollutant (n)'],
      ],
    },
    extra: 'Đổi sang danh từ (danh từ hoá) giúp câu mang văn phong học thuật: <i>“Cities are growing rapidly”</i> → <i>“<b>Rapid urban growth</b>…”</i>',
    tip: 'Khi đổi từ loại, cả câu phải đổi theo. Đừng chỉ thay một từ rồi để ngữ pháp bị gãy.',
  },
  {
    id: 'structure',
    no: 4,
    name: 'Đổi cấu trúc câu',
    short: 'Đổi chủ thể, chủ động ↔ bị động',
    idea: 'Giữ ý, nhưng đổi cách câu được tổ chức: ai là chủ ngữ, tác động lên cái gì, mệnh đề hay cụm danh từ.',
    table: {
      head: ['Đề bài', 'Cách viết lại'],
      rows: [
        ['Planners have placed homes… in separate areas.', 'Planners have divided <b>land</b> into separate zones for housing… <br><span class="muted small">(chủ thể tác động lên đất thay vì lên công trình)</span>'],
        ['Many people think that…', 'It is widely believed that… <span class="muted small">(cấu trúc bị động It is + V3)</span>'],
        ['Because cities are growing rapidly, traffic is getting worse.', 'Rapid urban growth has led to worsening traffic. <span class="muted small">(mệnh đề → cụm danh từ + led to)</span>'],
      ],
    },
    extra: 'Các mẫu hay dùng: chủ động ↔ bị động; mệnh đề → cụm danh từ; <i>because</i> → <i>lead to / result in</i>; <i>There is/are</i>; câu chẻ <i>What… is…</i> (rất hợp với Speaking).',
    tip: 'Kết hợp đổi cấu trúc với kỹ thuật 1–3 thì mới thực sự hiệu quả. Chỉ chuyển sang bị động mà giữ nguyên các từ khác thì vẫn rất giống đề.',
  },
  {
    id: 'reference',
    no: 5,
    name: 'Dùng chuỗi tham chiếu',
    short: 'Reference chain',
    idea: 'Khi nhắc lại cùng một thứ nhiều lần trong bài, hãy luân phiên các cách gọi khác nhau.',
    table: {
      head: ['Lần nhắc', 'Cách gọi'],
      rows: [
        ['Lần 1', 'zoning'],
        ['Lần 2', 'this approach'],
        ['Lần 3', 'this arrangement'],
        ['Lần 4', 'separating these facilities'],
      ],
    },
    extra: 'Cách này vừa tránh lặp từ, vừa ghi điểm <b>Coherence & Cohesion</b>.',
    tip: 'Các từ hay dùng: this approach / policy / trend / problem / development / arrangement / measure; such + danh từ; the former / the latter.',
  },
];

App.data.warnings = [
  'Từ đồng nghĩa hiếm khi thay thế hoàn toàn được nhau. <b>District</b> hợp với khu kinh doanh (<i>business district</i>), nhưng không ai nói <i>school district</i> với nghĩa “khu trường học” (ở Mỹ đó là đơn vị hành chính giáo dục).',
  'Không cần paraphrase mọi từ. Những từ khoá như <b>public transport</b> hay <b>traffic</b> cứ giữ nguyên. Cố đổi sẽ dễ ra cụm gượng ép, giám khảo trừ điểm LR.',
];

App.data.studyTips = [
  { title: 'Học theo cụm chủ đề', body: 'Không học theo danh sách đồng nghĩa. Với mỗi từ quan trọng, hãy nghĩ đủ 4 hướng: Tổng quát / Cụ thể / Theo vai trò / Biến thể từ loại, kèm collocation.', link: '#topics', linkText: 'Mở Chủ đề' },
  { title: 'Đọc và “săn” chuỗi tham chiếu', body: 'Khi đọc bài mẫu hay báo (mục Cities của The Guardian rất hợp với chủ đề quy hoạch), hãy gạch chân mọi cách tác giả gọi cùng một sự vật.', link: '#hunt', linkText: 'Mở công cụ Săn tham chiếu' },
  { title: 'Kiểm tra collocation trước khi dùng', body: 'Tra Oxford Learner’s Dictionaries hoặc từ điển collocation (như ozdic.com) để chắc từ mới đi với từ nào.', link: 'https://www.oxfordlearnersdictionaries.com/', linkText: 'Oxford Learner’s Dictionaries' },
];
