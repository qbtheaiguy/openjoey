"use client";

import {
  BarChart3,
  Users,
  History,
  Settings,
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { name: "Users", icon: Users, href: "/users" },
  { name: "Referrals", icon: BarChart3, href: "/referrals" },
  { name: "Skill Logs", icon: History, href: "/logs" },
  { name: "Subscriptions", icon: CreditCard, href: "/subscriptions" },
  { name: "Tier Policies", icon: ShieldCheck, href: "/policies" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "var(--sidebar-w)",
        backgroundColor: "var(--bg)",
        borderRight: "1px solid var(--border-soft)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        flexShrink: 0,
      }}
    >
      <div style={{ marginBottom: "40px", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "32px" }}>🦞</span>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 800 }}>OpenJoey</h1>
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Admin Hub
          </p>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "var(--radius)",
                fontSize: "14px",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--accent)" : "var(--text-muted)",
                backgroundColor: isActive ? "var(--accent-soft)" : "transparent",
                transition: "all 0.2s",
              }}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          marginTop: "auto",
          padding: "16px",
          borderRadius: "var(--radius)",
          backgroundColor: "var(--bg-soft)",
          border: "1px solid var(--border-soft)",
        }}
      >
        <p style={{ fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Data source</p>
        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Supabase only. No mock data.</p>
      </div>
    </aside>
  );
}
