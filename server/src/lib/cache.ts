/**
 * Tiny in-memory cache with TTL.
 * Use for hot read paths that change infrequently:
 *   - package list (landing page)
 *   - project list (landing page)
 *   - active promo
 *   - global settings
 *
 * NOT for:
 *   - per-user data
 *   - per-order data (changes too often)
 *   - anything that needs to be transactionally consistent
 *
 * In production with multiple instances, replace with Redis.
 * For single-instance dev/prod this is fine.
 */

interface Entry<T> {
    value: T;
    expiresAt: number;
}

const store = new Map<string, Entry<any>>();
// In-flight loaders per key: concurrent misses share a single DB call
// instead of thundering-herding the loader.
const inflight = new Map<string, Promise<any>>();

// Periodic cleanup (every 1 minute) so stale entries don't accumulate.
let cleanupTimer: NodeJS.Timeout | null = null;
function ensureCleanup() {
    if (cleanupTimer) return;
    cleanupTimer = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store.entries()) {
            if (entry.expiresAt <= now) store.delete(key);
        }
    }, 60_000);
    cleanupTimer.unref?.();
}

export async function cached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    ensureCleanup();
    const now = Date.now();
    const existing = store.get(key);
    if (existing && existing.expiresAt > now) {
        return existing.value as T;
    }

    // Deduplicate concurrent misses for the same key.
    const pending = inflight.get(key);
    if (pending) {
        return pending as Promise<T>;
    }

    const promise = (async () => {
        try {
            const value = await loader();
            store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
            return value;
        } finally {
            inflight.delete(key);
        }
    })();

    inflight.set(key, promise);
    return promise;
}

/** Invalidate a single key or a key prefix. */
export function invalidate(keyOrPrefix: string): void {
    if (store.has(keyOrPrefix)) {
        store.delete(keyOrPrefix);
        return;
    }
    // Treat as prefix
    for (const key of store.keys()) {
        if (key.startsWith(keyOrPrefix)) store.delete(key);
    }
}

/** Clear everything (useful in tests). */
export function clearAll(): void {
    store.clear();
}
