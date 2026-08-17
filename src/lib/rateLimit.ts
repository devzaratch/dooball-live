interface RateLimitStore {
    [ip: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

/**
 * In-Memory Rate Limiter for API endpoints
 * @param ip Client IP address
 * @param limit Max requests allowed within window
 * @param windowMs Time window in milliseconds (default 60 seconds)
 * @returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(ip: string, limit = 60, windowMs = 60000) {
    const now = Date.now();
    const clientData = store[ip] || { count: 0, resetTime: now + windowMs };

    if (now > clientData.resetTime) {
        clientData.count = 1;
        clientData.resetTime = now + windowMs;
    } else {
        clientData.count += 1;
    }

    store[ip] = clientData;

    const allowed = clientData.count <= limit;
    const remaining = Math.max(0, limit - clientData.count);

    // Periodically clean expired IPs from memory store
    if (Object.keys(store).length > 1000) {
        for (const k in store) {
            if (now > store[k].resetTime) {
                delete store[k];
            }
        }
    }

    return {
        allowed,
        remaining,
        resetTime: clientData.resetTime,
    };
}
