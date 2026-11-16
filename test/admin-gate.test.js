'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const adminAllowed = require('../src/main/admin-gate');

test('Admin tat mac dinh va khong the bat trong ban dong goi', () => {
  assert.equal(adminAllowed(false, {}), false);
  assert.equal(adminAllowed(false, { PIXEL_GARDEN_ADMIN: '0' }), false);
  assert.equal(adminAllowed(false, { PIXEL_GARDEN_ADMIN: '1' }), true);
  assert.equal(adminAllowed(true, { PIXEL_GARDEN_ADMIN: '1' }), false);
});
