import { useState, useCallback } from "react";

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi<T>(url: string, options?: UseApiOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const execute = useCallback(
    async (body?: object) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(url, {
          method: body ? "POST" : "GET",
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Request failed");
        setData(json);
        options?.onSuccess?.(json);
        return json;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error";
        setError(msg);
        options?.onError?.(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url, options],
  );

  return { data, loading, error, execute };
}
