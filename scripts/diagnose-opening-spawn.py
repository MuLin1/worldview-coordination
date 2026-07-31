from pathlib import Path

BUILD = Path('dist/V20260728/build.html')
TERMS = [
    'summarySpawnName',
    'onSpawnSelected',
    'mountWorldMap',
    'selectedSpawn',
    '上海',
    '出生点',
    'spawnNode',
    'initialLocation',
]

lines = BUILD.read_text(encoding='utf-8').splitlines()
print(f'build_lines={len(lines)}')
for term in TERMS:
    print(f'\n===== {term} =====')
    hits = [index for index, line in enumerate(lines) if term in line]
    print(f'hits={len(hits)}')
    for index in hits:
        start = max(0, index - 12)
        end = min(len(lines), index + 21)
        print(f'\n--- lines {start + 1}-{end} ---')
        for line_number in range(start, end):
            print(f'{line_number + 1}: {lines[line_number]}')
