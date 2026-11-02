# Xem nhanh collocation trong bộ Anki "English Collocations in Use" theo Unit (để soạn thêm từ khoá).
#   python3 anki/list.py I15 A32      → liệt kê collocation + nghĩa + biến thể của Unit 15 (Intermediate) và 32 (Advanced)
#   python3 anki/list.py              → liệt kê tên tất cả các Unit
# Chỉ đọc 2 file chính (Intermediate + Advanced); file "(Revision)" là tập con nên bỏ qua.
# Gợi ý Unit của mỗi chủ đề: xem trường units trong js/data/topics.js
import csv, html, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
FILES = [('I', 'IELTS 8.0 (EN)__Collocation - Intermediate.txt'),
         ('A', 'IELTS 8.0 (EN)__Collocation - Advanced.txt')]


def clean(s):
    s = html.unescape(re.sub(r'<[^>]+>', '', re.sub(r'<br\s*/?>', ' ', s)))
    return re.sub(r'\s+', ' ', s).strip()


units = {}
for book, name in FILES:
    with open(os.path.join(ROOT, name), encoding='utf-8') as f:
        for r in csv.reader((l for l in f if not l.startswith('#')), delimiter='\t'):
            # Cột: 0 collocation, 1 nghĩa, 12 "Unit n: tên", 14 biến thể
            m = re.match(r'Unit (\d+):\s*(.+)', r[12])
            uid = f'{book}{int(m.group(1))}'
            units.setdefault(uid, [m.group(2).strip(), []])[1].append((clean(r[0]), clean(r[1]), clean(r[14])))

want = [a.upper() for a in sys.argv[1:]]
if not want:
    for uid, (name, rows) in units.items():
        print(f'{uid:5} {name} ({len(rows)})')
for uid in want:
    if uid not in units:
        print(f'Không có Unit {uid}')
        continue
    name, rows = units[uid]
    print(f'\n== {uid}: {name} ({len(rows)})')
    for c, vi, var in rows:
        print(f'- {c} = {vi}' + (f'   [{var}]' if var else ''))
