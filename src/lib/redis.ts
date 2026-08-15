import { Redis } from "@upstash/redis";

/** Resolve Upstash Redis REST credentials from env (shared by inventory + RSVP). */
export function resolveRedisCredentials(): { url: string; token: string } | null {
  const env = process.env;

  const knownPairs: Array<[string | undefined, string | undefined]> = [
    [env.KV_REST_API_URL, env.KV_REST_API_TOKEN],
    [env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN],
    [env.REDIS_REST_API_URL, env.REDIS_REST_API_TOKEN],
  ];
  for (const [url, token] of knownPairs) {
    if (url?.startsWith("https://") && token) return { url, token };
  }

  for (const [key, value] of Object.entries(env)) {
    if (typeof value !== "string" || !value.startsWith("https://")) continue;
    if (!/upstash\.io/.test(value) && !/REST_API_URL$|REDIS_REST_URL$/.test(key)) continue;

    const tokenKey = key
      .replace(/REST_API_URL$/, "REST_API_TOKEN")
      .replace(/REDIS_REST_URL$/, "REDIS_REST_TOKEN")
      .replace(/_URL$/, "_TOKEN");
    const token = env[tokenKey];
    if (token) return { url: value, token };
  }

  return null;
}

export function getRedis(): Redis | null {
  const creds = resolveRedisCredentials();
  if (!creds) return null;
  return new Redis({ url: creds.url, token: creds.token });
}

export function canUseFileStorage(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.VERCEL;
}
