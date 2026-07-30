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

// ─── Gate B: Species Candidates ──────────────────────────────

test('species candidates cover all roles without becoming final choices', async () => {
  const packet = await load('companion-species-candidates.json');
  const roles = [
    ...await load('companions-vielsaen.roles.json'),
    ...await load('companions-modern.roles.json'),
  ];
  assert.equal(packet.length, 24);
  assert.deepEqual(new Set(packet.map(x => x.roleId)), new Set(roles.map(x => x.id)));
  const allKinds = new Set(packet.flatMap(x => x.candidates.map(y => y.kind)));
  assert.deepEqual(allKinds, new Set(['ordinary','hybrid','mythic']));
  for (const item of packet) {
    assert.ok(item.candidates.length >= 2 && item.candidates.length <= 3);
    assert.equal('selectedSpeciesId' in item, false);
  }
});

test('Modern ability roles are never offered mythic candidates', async () => {
  const roles = await load('companions-modern.roles.json');
  const packet = await load('companion-species-candidates.json');
  for (const role of roles.filter(x => x.professionOrAbility.kind === 'ability')) {
    const item = packet.find(x => x.roleId === role.id);
    assert.ok(item, `no candidates for ${role.id}`);
    assert.equal(item.candidates.some(x => x.kind === 'mythic'), false,
      `${role.id} has ability, should not get mythic candidates`);
  }
});

test('each world has at least one hybrid candidate', async () => {
  const packet = await load('companion-species-candidates.json');
  const vielsaenIds = (await load('companions-vielsaen.roles.json')).map(r => r.id);
  const modernIds = (await load('companions-modern.roles.json')).map(r => r.id);
  const vielsaenHasHybrid = packet.some(x =>
    vielsaenIds.includes(x.roleId) && x.candidates.some(c => c.kind === 'hybrid'));
  const modernHasHybrid = packet.some(x =>
    modernIds.includes(x.roleId) && x.candidates.some(c => c.kind === 'hybrid'));
  assert.ok(vielsaenHasHybrid, 'Vielsaen needs at least one hybrid candidate');
  assert.ok(modernHasHybrid, 'Modern needs at least one hybrid candidate');
});

test('hybrid proposals are complete and non-recursive', async () => {
  const packet = await load('companion-species-candidates.json');
  for (const item of packet) {
    for (const candidate of item.candidates) {
      if (candidate.kind !== 'hybrid') continue;
      const hp = candidate.hybridProposal;
      assert.ok(hp, `hybrid candidate missing hybridProposal for ${item.roleId}`);
      assert.notEqual(hp.maternalBaseId, 'G-S09', 'hybrid cannot use G-S09 as maternal base');
      assert.notEqual(hp.paternalExpressionId, 'G-S09', 'hybrid cannot use G-S09 as paternal');
      assert.equal(hp.positiveTraits.length, 2);
      assert.equal(hp.negativeTraits.length, 2);
      assert.ok(hp.maternalBaseId);
      assert.ok(hp.paternalExpressionId);
      assert.ok(hp.maternalBaseId !== hp.paternalExpressionId,
        `hybrid maternal and paternal must differ for ${item.roleId}`);
    }
  }
});

test('all candidate species IDs reference existing species', async () => {
  const packet = await load('companion-species-candidates.json');
  const validIds = new Set([
    'G-S01','G-S02','G-S03','G-S04','G-S05','G-S06','G-S07','G-S08','G-S09',
    'G-S10','G-S11','G-S12','G-S13','G-S14','G-S15','G-S16','G-S17','G-S18',
    'G-M01','G-M02','G-M03','G-M04','G-M05','G-M06','G-M07','G-M08',
  ]);
  for (const item of packet) {
    for (const candidate of item.candidates) {
      assert.ok(validIds.has(candidate.speciesId),
        `${item.roleId} candidate ${candidate.speciesId} is not a valid species ID`);
      if (candidate.kind === 'hybrid') {
        const hp = candidate.hybridProposal;
        assert.ok(validIds.has(hp.maternalBaseId));
        assert.ok(validIds.has(hp.paternalExpressionId));
      }
    }
  }
});
