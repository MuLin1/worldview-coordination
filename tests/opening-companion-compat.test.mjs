import test from 'node:test';
import assert from 'node:assert/strict';

import { REPLACEMENT_BONDS } from '../dist/V20260728/five-world-config.js';

test('replacement companions expose every field consumed by the opening UI', () => {
  for (const companion of REPLACEMENT_BONDS) {
    assert.equal(typeof companion.name, 'string');
    assert.ok(companion.name);
    assert.equal(typeof companion.species, 'string', companion.name);
    assert.ok(companion.species, companion.name);
    assert.equal(typeof companion.profession, 'string', companion.name);
    assert.ok(companion.profession, companion.name);
    assert.equal(typeof companion.role, 'string', companion.name);
    assert.ok(companion.role, companion.name);
    assert.equal(typeof companion.origin, 'string', companion.name);
    assert.ok(companion.origin, companion.name);
    assert.equal(typeof companion.faction, 'string', companion.name);
    assert.ok(companion.faction, companion.name);
    assert.equal(Number.isFinite(companion.level), true, companion.name);
  }
});
