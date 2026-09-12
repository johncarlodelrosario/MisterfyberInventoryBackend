// Simple in-memory cache
const cacheStore = new Map();
export const cache = {
    get: (key) => {
        const item = cacheStore.get(key);
        if (!item)
            return null;
        // Check if expired
        if (item.expiry && Date.now() > item.expiry) {
            cacheStore.delete(key);
            return null;
        }
        return item.value;
    },
    set: (key, value, duration = 300) => {
        cacheStore.set(key, {
            value,
            expiry: Date.now() + duration * 1000,
        });
    },
    del: (key) => {
        // Delete all keys that start with the given key
        for (const [cacheKey] of cacheStore) {
            if (cacheKey.startsWith(key)) {
                cacheStore.delete(cacheKey);
            }
        }
    },
    clear: () => {
        cacheStore.clear();
    },
};
export const cacheMiddleware = (duration = 300) => {
    return (req, res, next) => {
        // Skip caching for non-GET requests
        if (req.method !== "GET") {
            return next();
        }
        const key = `__express__${req.originalUrl || req.url}`;
        const cachedResponse = cache.get(key);
        if (cachedResponse) {
            console.log(`Cache hit for: ${key}`);
            return res.json(cachedResponse);
        }
        console.log(`Cache miss for: ${key}`);
        // Store original send function
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            // Only cache successful responses
            if (res.statusCode === 200) {
                cache.set(key, body, duration);
                console.log(`Cached response for: ${key}`);
            }
            return originalJson(body);
        };
        next();
    };
};
