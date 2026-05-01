const chains = new Map();

/**
 * Serialize async writers per key (single-process offline mode).
 * @param {string} key
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withWriteLock(key, fn) {
  const prev = chains.get(key) || Promise.resolve();
  const result = prev.then(() => fn());
  chains.set(key, result.catch(() => {}));
  return result;
}
