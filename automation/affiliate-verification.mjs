import fs from 'node:fs/promises';

const REGISTRY = new URL('../data/affiliate-verification.json', import.meta.url);

export function normalizeAffiliateRecord(record = {}) {
  return {
    productId: String(record.productId ?? '').trim(),
    productName: String(record.productName ?? '').trim(),
    sourceProductUrl: String(record.sourceProductUrl ?? '').trim(),
    affiliateUrl: String(record.affiliateUrl ?? '').trim(),
    commissionPercent: record.commissionPercent == null ? null : Number(record.commissionPercent),
    verifiedAt: record.verifiedAt ?? null,
    source: String(record.source ?? '').trim(),
  };
}

export function verifyAffiliateRecord(record = {}) {
  const normalized = normalizeAffiliateRecord(record);
  const validCommission = Number.isFinite(normalized.commissionPercent);
  const verified = Boolean(
    normalized.productId &&
    normalized.sourceProductUrl &&
    normalized.affiliateUrl &&
    validCommission &&
    normalized.verifiedAt &&
    normalized.source,
  );

  return {
    verified,
    record: normalized,
    reasons: [
      !normalized.productId && 'Product ID is missing.',
      !normalized.sourceProductUrl && 'Source product URL is missing.',
      !normalized.affiliateUrl && 'Affiliate URL is missing.',
      !validCommission && 'Authoritative commission percentage is missing.',
      !normalized.verifiedAt && 'Verification timestamp is missing.',
      !normalized.source && 'Verification source is missing.',
    ].filter(Boolean),
  };
}

export async function loadAffiliateRegistry() {
  try {
    const raw = await fs.readFile(REGISTRY, 'utf8');
    const data = JSON.parse(raw);
    const records = Array.isArray(data.records)
      ? data.records
      : Array.isArray(data.products)
        ? data.products
        : [];
    return records.map(normalizeAffiliateRecord);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function findVerifiedAffiliate(productId, sourceProductUrl) {
  const records = await loadAffiliateRegistry();
  const match = records.find(record =>
    record.productId === String(productId) &&
    record.sourceProductUrl === String(sourceProductUrl),
  );
  if (!match) return { verified: false, record: null, reasons: ['No exact product-level Affiliate record found.'] };
  return verifyAffiliateRecord(match);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  loadAffiliateRegistry()
    .then(records => console.log(JSON.stringify({ count: records.length, records }, null, 2)))
    .catch(error => {
      console.error(`Affiliate registry error: ${error.message}`);
      process.exitCode = 1;
    });
}
