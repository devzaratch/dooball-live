/**
 * Automated Stream Health Checker
 * Checks if HLS .m3u8 stream endpoints are reachable and healthy
 */
export async function checkStreamHealth(url: string, timeoutMs = 3000): Promise<{ healthy: boolean; status: number; latency: number }> {
    const startTime = Date.now();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DoBallLaos-HealthCheck/1.0',
            },
        });

        clearTimeout(timeoutId);
        const latency = Date.now() - startTime;

        return {
            healthy: response.ok || response.status === 200 || response.status === 206,
            status: response.status,
            latency,
        };
    } catch {
        return {
            healthy: false,
            status: 0,
            latency: Date.now() - startTime,
        };
    }
}
