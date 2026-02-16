interface CardProps {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function Card({ children, title, icon, className = "" }: CardProps) {
  return (
    <section className={`card ${className}`} style={{ padding: "24px" }}>
      {(title || icon) && (
        <h3
          style={{
            fontSize: "18px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {icon}
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

interface StatCardProps {
  value: string | number;
  label: string;
  color?: string;
}

export function StatCard({ value, label, color }: StatCardProps) {
  return (
    <div className="card" style={{ padding: "20px", textAlign: "center" }}>
      <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px", color }}>{value}</div>
      <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}
