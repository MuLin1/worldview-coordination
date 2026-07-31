from pathlib import Path

BUILD = Path('dist/V20260728/build.html')

old_effective = '''                function getEffectiveModernSpawn() {
                    if (!isModernWorldview.value) return null;
                    if (isModernSpecialOrigin.value || selectedOpening.value === MODERN_HIGH_SCHOOL_OPENING_ID) {
                        return normalizeModernSpawnSelection(MODERN_SHILAN_SPAWN);
                    }
                    return normalizeModernSpawnSelection(selectedModernSpawn.value);
                }

                function applyModernSpawnSelection(rawSpawn) {
                    if (isModernSpecialOrigin.value || selectedOpening.value === MODERN_HIGH_SCHOOL_OPENING_ID) {
                        return trySetModernSpawnSelection(MODERN_SHILAN_SPAWN, { silent: true, source: '城市公立学校特殊开局' });
                    }
                    return trySetModernSpawnSelection(rawSpawn, { source: '地图' });
                }
'''

new_effective = '''                function getEffectiveModernSpawn() {
                    if (!isModernWorldview.value) return null;
                    const selectedSpawn = normalizeModernSpawnSelection(selectedModernSpawn.value);
                    if (selectedSpawn) return selectedSpawn;
                    if (isModernSpecialOrigin.value || selectedOpening.value === MODERN_HIGH_SCHOOL_OPENING_ID) {
                        return normalizeModernSpawnSelection(MODERN_SHILAN_SPAWN);
                    }
                    return null;
                }

                function applyModernSpawnSelection(rawSpawn) {
                    return trySetModernSpawnSelection(rawSpawn, { source: '地图' });
                }
'''

text = BUILD.read_text(encoding='utf-8')
count = text.count(old_effective)
if count != 1:
    raise SystemExit(f'expected exactly one modern spawn override block, found {count}')
BUILD.write_text(text.replace(old_effective, new_effective), encoding='utf-8')
print('updated modern map selection precedence')
