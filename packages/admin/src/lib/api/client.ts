async function fetcher<T>(url: string, body?: object): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return await res.json();
  } catch {
    return null;
  }
}

export const api = {
  database: {
    stats: () => fetcher("/api/database?action=stats"),
    action: (action: string) => fetcher("/api/database?action=action", { action }),
  },
  cache: {
    stats: () => fetcher("/api/cache?action=stats"),
    action: (action: string, key?: string) => fetcher("/api/cache/action", { action, key }),
  },
  deploy: {
    status: () => fetcher("/api/deploy/status"),
    services: () => fetcher("/api/deploy/services"),
    action: (action: string) => fetcher("/api/deploy/action", { action }),
  },
  tests: {
    run: () => fetcher("/api/tests/run"),
    health: () => fetcher("/api/tests/health"),
  },
};
