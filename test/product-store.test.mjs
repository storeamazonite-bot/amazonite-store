import test from 'node:test';
import assert from 'node:assert/strict';
import { createProduct, deleteProduct, getProductCatalog, updateProduct } from '../lib/product-store.mjs';

test('product catalog uses safe JSON fallback by default', async () => {
  const previous = process.env.PRODUCT_STORAGE_PROVIDER;
  delete process.env.PRODUCT_STORAGE_PROVIDER;
  const catalog = await getProductCatalog();
  assert.ok(Array.isArray(catalog.products));
  assert.equal(catalog.products[0]?.id, 'AE-001');
  if (previous === undefined) delete process.env.PRODUCT_STORAGE_PROVIDER;
  else process.env.PRODUCT_STORAGE_PROVIDER = previous;
});

test('persistent writes require configured Google Sheets storage', async () => {
  const previousProvider = process.env.PRODUCT_STORAGE_PROVIDER;
  const previousId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const previousJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  process.env.PRODUCT_STORAGE_PROVIDER = 'json';
  delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  await assert.rejects(() => createProduct({ id: 'TEST', name: 'Test' }), error => error.code === 'PRODUCT_STORAGE_NOT_CONFIGURED');
  await assert.rejects(() => updateProduct('TEST', { name: 'Test' }), error => error.code === 'PRODUCT_STORAGE_NOT_CONFIGURED');
  await assert.rejects(() => deleteProduct('TEST'), error => error.code === 'PRODUCT_STORAGE_NOT_CONFIGURED');
  if (previousProvider === undefined) delete process.env.PRODUCT_STORAGE_PROVIDER; else process.env.PRODUCT_STORAGE_PROVIDER = previousProvider;
  if (previousId === undefined) delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID; else process.env.GOOGLE_SHEETS_SPREADSHEET_ID = previousId;
  if (previousJson === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON; else process.env.GOOGLE_SERVICE_ACCOUNT_JSON = previousJson;
});

test('selected Google Sheets storage fails closed when credentials are missing', async () => {
  const previousProvider = process.env.PRODUCT_STORAGE_PROVIDER;
  const previousId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const previousJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  process.env.PRODUCT_STORAGE_PROVIDER = 'google_sheets';
  delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  await assert.rejects(() => getProductCatalog(), error => error.code === 'PRODUCT_STORAGE_NOT_CONFIGURED');
  if (previousProvider === undefined) delete process.env.PRODUCT_STORAGE_PROVIDER; else process.env.PRODUCT_STORAGE_PROVIDER = previousProvider;
  if (previousId === undefined) delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID; else process.env.GOOGLE_SHEETS_SPREADSHEET_ID = previousId;
  if (previousJson === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON; else process.env.GOOGLE_SERVICE_ACCOUNT_JSON = previousJson;
});
