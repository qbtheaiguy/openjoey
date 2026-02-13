/**
 * Lightweight Supabase client for the Admin Dashboard.
 * Live data only — no mock data. Uses service role for read access.
 */

export class OpenJoeyAdminDB {
  private url: string;
  private key: string;
  private headers: Record<string, string>;

  constructor() {
    this.url = process.env.SUPABASE_URL || "";
    this.key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    this.headers = {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
  }

  /** Fetch rows. Use query for filters, e.g. "order=created_at.desc&limit=10" */
  async get<T>(table: string, query: string = ""): Promise<T[]> {
    const res = await fetch(`${this.url}/rest/v1/${table}?${query}`, {
      headers: this.headers,
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase GET ${table}: ${res.status} ${text}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  /** Get total row count for a table (PostgREST: Prefer count=exact, then Content-Range). */
  async count(table: string, query: string = ""): Promise<number> {
    const res = await fetch(`${this.url}/rest/v1/${table}?${query}&select=id`, {
      headers: {
        ...this.headers,
        Prefer: "count=exact",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase COUNT ${table}: ${res.status} ${text}`);
    }
    const range = res.headers.get("content-range");
    if (!range) {
      return 0;
    }
    const match = range.match(/\/(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
    const res = await fetch(`${this.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase RPC ${fn}: ${res.status} ${text}`);
    }
    return res.json();
  }

  /** Update rows matching the query with the given data */
  async patch<T>(table: string, data: Record<string, unknown>, query: string): Promise<T[]> {
    const res = await fetch(`${this.url}/rest/v1/${table}?${query}`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify(data),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase PATCH ${table}: ${res.status} ${text}`);
    }
    const result = await res.json();
    return Array.isArray(result) ? result : [];
  }
}

let _db: OpenJoeyAdminDB | null = null;

export function getAdminDB(): OpenJoeyAdminDB | null {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  if (!_db) {
    _db = new OpenJoeyAdminDB();
  }
  return _db;
}
