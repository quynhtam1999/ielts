# Chuyển file Anki (.txt xuất từ Anki: Notes in Plain Text) thành js/data/collocations.js
# Chạy lại khi thay đổi file Anki:   python3 anki/build.py
# Chỉ dùng 2 file chính (Intermediate + Advanced); file "(Revision)" là tập con nên bỏ qua.
import csv, html, json, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
FILES = [('I', 'IELTS 8.0 (EN)__Collocation - Intermediate.txt'),
         ('A', 'IELTS 8.0 (EN)__Collocation - Advanced.txt')]


def clean(s, keep_bold=False):
    """Bỏ mọi thẻ HTML (trừ <b> nếu cần), chuẩn hoá khoảng trắng."""
    s = re.sub(r'<br\s*/?>', ' ', s)
    if keep_bold:
        s = re.sub(r'<(?!/?b>)[^>]+>', '', s)
        parts = re.split(r'(</?b>)', s)
        s = ''.join(p if p in ('<b>', '</b>') else html.escape(html.unescape(p), quote=False) for p in parts)
    else:
        s = html.unescape(re.sub(r'<[^>]+>', '', s))
    return re.sub(r'\s+', ' ', s).strip()


rows, units = [], {}
for book, name in FILES:
    with open(os.path.join(ROOT, name), encoding='utf-8') as f:
        lines = (l for l in f if not l.startswith('#'))
        for r in csv.reader(lines, delimiter='\t'):
            # Cột: 0 collocation, 1 nghĩa, 4 ví dụ (có <b>), 5 nghĩa ví dụ, 12 Unit, 14 biến thể
            m = re.match(r'Unit (\d+):\s*(.+)', r[12])
            uid = f'{book}{int(m.group(1))}'
            units[uid] = m.group(2).strip()
            rows.append([uid, clean(r[0]), clean(r[1]), clean(r[4], True), clean(r[5]),
                         ' · '.join(x.strip() for x in clean(r[14]).split('·') if x.strip())])

out = os.path.join(ROOT, '..', 'js', 'data', 'collocations.js')
with open(out, 'w', encoding='utf-8') as f:
    f.write('// TỰ ĐỘNG TẠO bởi anki/build.py từ bộ Anki "English Collocations in Use" (Intermediate + Advanced).\n')
    f.write('// Không sửa tay: sửa file Anki rồi chạy lại  python3 anki/build.py\n')
    f.write('// Mỗi dòng: [unit, collocation, nghĩa, câu ví dụ (<b> = chỗ cần điền), nghĩa câu ví dụ, biến thể]\n')
    f.write('App.data.units = ' + json.dumps(units, ensure_ascii=False) + ';\n')
    f.write('App.data.collocs = [\n')
    for r in rows:
        f.write(json.dumps(r, ensure_ascii=False) + ',\n')
    f.write('];\n')
print(len(rows), 'collocations,', len(units), 'units ->', os.path.relpath(out))
