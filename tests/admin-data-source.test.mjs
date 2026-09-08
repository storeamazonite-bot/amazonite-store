import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

test('admin overview does not use browser storage as the product source of truth', async () => {
  const page = await fs.readFile(new URL('../admin/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(page, /amazonite_products_v1/);
  assert.match(page, /\.\.\/api\/owner\/products/);
  assert.match(page, /credentials:\s*['"]same-origin['"]/);
});
