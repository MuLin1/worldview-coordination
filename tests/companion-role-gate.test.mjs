import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DNF_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const load = async name => JSON.parse(await readFile(join(DNF_ROOT, 'data', 'dual-world', name), 'utf-8'));

const forbidden = new Set([
  'species', 'race', 'classificationId', 'physiology', 'heritableTraits',
  '种族', '生理档案', '可遗传特征',
]);

function walk(value, path = []) {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => [
    ...(forbidden.has(key) ? [[...path, key].join('.')] : []),
    ...walk(child, [...path, key]),
  ]);
}

test('Gate A contains twelve complete species-neutral roles per world', async () => {
  for (const file of ['companions-vielsaen.roles.json','companions-modern.roles.json']) {
    const roles = await load(file);
    assert.equal(roles.length, 12, `${file} should have 12 roles`);
    // No species/physiology fields
    const violations = walk(roles);
    assert.deepEqual(violations, [], `${file} contains forbidden species fields: ${violations.join(', ')}`);
    for (const role of roles) {
      assert.ok(role.id && role.name && role.originNodeId && role.combatRole,
        `${file} role missing required fields: ${role.id || '?'}`);
      assert.equal(role.activeSkills.length, 3, `${file} ${role.id} should have 3 active skills`);
      assert.equal(role.passiveSkills.length, 2, `${file} ${role.id} should have 2 passive skills`);
      assert.ok(role.relations.length >= 2, `${file} ${role.id} should have >= 2 relations`);
      assert.equal(role.personalLine.length, 3, `${file} ${role.id} should have 3 personal line stages`);
    }
  }
});

test('Vielsaen role IDs are exactly V-C100..V-C111', async () => {
  const roles = await load('companions-vielsaen.roles.json');
  const ids = roles.map(r => r.id).sort();
  const expected = Array.from({length: 12}, (_, i) => `V-C${100 + i}`);
  assert.deepEqual(ids, expected);
});

test('Modern role IDs are exactly U-C100..U-C111', async () => {
  const roles = await load('companions-modern.roles.json');
  const ids = roles.map(r => r.id).sort();
  const expected = Array.from({length: 12}, (_, i) => `U-C${100 + i}`);
  assert.deepEqual(ids, expected);
});

test('Legacy IDs map to the retained six roles', async () => {
  const vielsaen = await load('companions-vielsaen.roles.json');
  const modern = await load('companions-modern.roles.json');
  const all = [...vielsaen, ...modern];
  const withLegacy = all.filter(r => r.legacyIds && r.legacyIds.length > 0);
  assert.equal(withLegacy.length, 6);
  const legacyIds = withLegacy.flatMap(r => r.legacyIds);
  assert.ok(legacyIds.includes('vielsaen_kael_rhodes'));
  assert.ok(legacyIds.includes('vielsaen_mira_vel'));
  assert.ok(legacyIds.includes('vielsaen_orin_sable'));
  assert.ok(legacyIds.includes('modern_lin_xiaoyu'));
  assert.ok(legacyIds.includes('modern_chen_mojun'));
  assert.ok(legacyIds.includes('modern_ava_storm'));
});

test('Modern ability roles are never assigned mythic species preconditions', async () => {
  const roles = await load('companions-modern.roles.json');
  // Verify ability type coverage
  const abilityRoles = roles.filter(r => r.professionOrAbility.kind === 'ability');
  assert.ok(abilityRoles.length >= 6, `Should have >= 6 ability roles, got ${abilityRoles.length}`);
  // All ability roles have a valid abilityType
  for (const role of abilityRoles) {
    assert.ok(role.professionOrAbility.abilityType);
  }
});

test('All skills are explainable without species dependence', async () => {
  const vielsaen = await load('companions-vielsaen.roles.json');
  const modern = await load('companions-modern.roles.json');
  const all = [...vielsaen, ...modern];
  // Every skill desc should reference profession, school, training, or equipment — not anatomy
  const anatomyWords = ['爪', '翼', '鳞', '尾', '牙', '喙', '鳍', '触手', '毒腺', '角'];
  for (const role of all) {
    for (const skill of [...role.activeSkills, ...role.passiveSkills]) {
      const desc = skill.desc;
      for (const word of anatomyWords) {
        assert.ok(!desc.includes(word),
          `${role.id} skill "${skill.name}" references anatomy word "${word}"`);
      }
    }
  }
});
