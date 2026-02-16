"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function FilterSelect({
  label,
  value,
  options,
  paramName,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  paramName?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = paramName || label?.toLowerCase() || "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value === "all") {
      params.delete(name);
    } else {
      params.set(name, e.target.value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <label style={{ fontSize: "13px", color: "var(--text-muted)" }}>{label}:</label>
      <select
        defaultValue={value}
        onChange={handleChange}
        style={{
          padding: "6px 12px",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border-soft)",
          backgroundColor: "var(--bg)",
          fontSize: "13px",
          cursor: "pointer",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.value === "all" ? opt.label : opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
