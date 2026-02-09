export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "32px",
        animation: "pulse 1.5s infinite ease-in-out",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div
          style={{
            width: "300px",
            height: "40px",
            backgroundColor: "var(--border-soft)",
            borderRadius: "var(--radius)",
          }}
        ></div>
        <div
          style={{
            width: "150px",
            height: "40px",
            backgroundColor: "var(--border-soft)",
            borderRadius: "var(--radius)",
          }}
        ></div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: "140px",
              backgroundColor: "var(--border-soft)",
              borderRadius: "var(--radius-lg)",
            }}
          ></div>
        ))}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        <div
          style={{
            height: "500px",
            backgroundColor: "var(--border-soft)",
            borderRadius: "var(--radius-lg)",
          }}
        ></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              height: "150px",
              backgroundColor: "var(--border-soft)",
              borderRadius: "var(--radius-lg)",
            }}
          ></div>
          <div
            style={{
              height: "300px",
              backgroundColor: "var(--border-soft)",
              borderRadius: "var(--radius-lg)",
            }}
          ></div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `,
        }}
      />
    </div>
  );
}
