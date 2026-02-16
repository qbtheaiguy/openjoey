import { LucideIcon } from "lucide-react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: "default" | "danger" | "warning" | "success";
  size?: "sm" | "md";
  loading?: boolean;
}

export function Button({
  children,
  onClick,
  icon: Icon,
  variant = "default",
  size = "md",
  loading,
}: ButtonProps) {
  const variantStyles = {
    default: {},
    danger: { backgroundColor: "#ef444420", color: "#ef4444" },
    warning: { backgroundColor: "#f59e0b20", color: "#f59e0b" },
    success: { backgroundColor: "#22c55e20", color: "#22c55e" },
  };

  const sizeStyles = {
    sm: { padding: "4px 8px", fontSize: "11px" },
    md: { padding: "8px 16px", fontSize: "14px" },
  };

  return (
    <button
      className="glass"
      style={{
        border: "none",
        borderRadius: "6px",
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        opacity: loading ? 0.6 : 1,
        ...variantStyles[variant],
        ...sizeStyles[size],
      }}
      onClick={onClick}
      disabled={loading}
    >
      {Icon && <Icon size={size === "sm" ? 12 : 14} />}
      {children}
    </button>
  );
}
