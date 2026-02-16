interface MessageProps {
  message: string;
  type?: "info" | "success" | "error" | "warning";
}

const styles = {
  info: { bg: "#3b82f610", border: "#3b82f630", color: "#3b82f6" },
  success: { bg: "#22c55e10", border: "#22c55e30", color: "#22c55e" },
  error: { bg: "#ef444410", border: "#ef444430", color: "#ef4444" },
  warning: { bg: "#f59e0b10", border: "#f59e0b30", color: "#f59e0b" },
};

export function Message({ message, type = "info" }: MessageProps) {
  if (!message) return null;
  const s = styles[type];
  return (
    <section
      className="card"
      style={{ padding: "16px", backgroundColor: s.bg, border: `1px solid ${s.border}` }}
    >
      <div style={{ fontSize: "13px", color: s.color }}>{message}</div>
    </section>
  );
}
