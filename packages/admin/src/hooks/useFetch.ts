import { useState, useEffect } from "react";

export function useFetch<T>(url: string, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, deps);

  return {
    data,
    loading,
    error,
    refetch: () =>
      fetch(url)
        .then((r) => r.json())
        .then(setData),
  };
}
