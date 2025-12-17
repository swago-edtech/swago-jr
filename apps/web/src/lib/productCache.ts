// In-memory cache for products (shared across the app)
const productCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

export function invalidateProductCache(identifier: string) {
  console.log(`🔍 Cache invalidation called with: "${identifier}" (type: ${typeof identifier})`);
  
  if (!identifier || identifier === '') {
    console.log('⚠️ Cache invalidation skipped: Empty identifier');
    return;
  }
  
  const existed = productCache.has(identifier);
  const deleted = productCache.delete(identifier);
  
  console.log(`🗑️ Cache invalidation for "${identifier}": ${deleted ? 'DELETED' : 'KEY NOT FOUND'} (existed before: ${existed})`);
  console.log(`📊 Cache size after deletion: ${productCache.size} entries`);
}

export function getProductCache() {
  return productCache;
}

export function getCacheTTL() {
  return CACHE_TTL;
}
