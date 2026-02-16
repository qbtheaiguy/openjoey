import { LucideIcon } from "lucide-react";

interface HeaderProps {
  title: string;
  icon?: LucideIcon;
  description?: string;
}

export function Header({ title, icon: Icon, description }: HeaderProps) {
  return (
    <header>
      <h2
        style={{
          fontSize: "32px",
          marginBottom: "4px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {Icon && <Icon size={32} />}
        {title}
      </h2>
      {description && <p style={{ color: "var(--text-muted)" }}>{description}</p>}
    </header>
  );
}
