"use client";

import { Menu, X } from "lucide-react";
import {
  BarChart3,
  Users,
  History,
  Settings,
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Activity,
  Server,
  FileText,
  TrendingUp,
  Database,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const MENU_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { name: "System Monitoring", icon: Activity, href: "/monitoring" },
  { name: "V1 Services", icon: Server, href: "/v1-services" },
  { name: "Gateway Logs", icon: FileText, href: "/gateway-logs" },
  { name: "V1 Analytics", icon: TrendingUp, href: "/v1-analytics" },
  { name: "Dev Tools", icon: Terminal, href: "/dev-tools" },
  { name: "Users", icon: Users, href: "/users" },
  { name: "Referrals", icon: BarChart3, href: "/referrals" },
  { name: "Skill Logs", icon: History, href: "/logs" },
  { name: "Subscriptions", icon: CreditCard, href: "/subscriptions" },
  { name: "Tier Policies", icon: ShieldCheck, href: "/policies" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export default function ResponsiveSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        style={{
          width: isCollapsed ? "60px" : "var(--sidebar-w)",
          backgroundColor: "var(--bg)",
          borderRight: "1px solid var(--border-soft)",
          padding: isCollapsed ? "12px" : "24px",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          flexShrink: 0,
          transition: "width 0.3s ease, padding 0.3s ease",
          overflow: "hidden",
        }}
        className="desktop-sidebar"
      >
        {/* Desktop Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            position: "absolute",
            top: "24px",
            right: "-12px",
            width: "24px",
            height: "24px",
            backgroundColor: "var(--accent)",
            border: "2px solid var(--bg)",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
          className="desktop-toggle"
        >
          <Menu size={12} color="white" />
        </button>

        {/* Logo */}
        <div
          style={{
            marginBottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            justifyContent: isCollapsed ? "center" : "flex-start",
          }}
        >
          <span style={{ fontSize: isCollapsed ? "20px" : "32px" }}>🦞</span>
          {!isCollapsed && (
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
          )}
        </div>

        {/* Navigation */}
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
                  gap: isCollapsed ? "0" : "12px",
                  padding: isCollapsed ? "8px" : "12px 16px",
                  borderRadius: "var(--radius)",
                  fontSize: "14px",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                  backgroundColor: isActive ? "var(--accent-soft)" : "transparent",
                  transition: "all 0.2s",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  position: "relative",
                }}
                title={isCollapsed ? item.name : ""}
              >
                <Icon size={18} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
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
            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Supabase only. No mock data.
            </p>
          </div>
        )}
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        style={{
          position: "fixed",
          top: "16px",
          left: "16px",
          zIndex: 1000,
          padding: "8px",
          backgroundColor: "var(--bg)",
          border: "1px solid var(--border-soft)",
          borderRadius: "var(--radius)",
          cursor: "pointer",
          display: "none",
        }}
        className="mobile-menu-button"
      >
        <Menu size={20} color="var(--text)" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
            display: "none",
          }}
          className="mobile-overlay"
        />
      )}

      {/* Mobile Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "280px",
          backgroundColor: "var(--bg)",
          borderRight: "1px solid var(--border-soft)",
          transform: isMobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease",
          zIndex: 1000,
          display: "none",
          padding: "24px",
          flexDirection: "column",
        }}
        className="mobile-sidebar"
      >
        <div
          style={{
            marginBottom: "40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "32px" }}>🦞</span>
          <button
            onClick={() => setIsMobileOpen(false)}
            style={{
              padding: "4px",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <X size={20} color="var(--text)" />
          </button>
        </div>

        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "4px" }}>OpenJoey</h1>
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "24px",
            }}
          >
            Admin Hub
          </p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
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
          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Supabase only. No mock data.
          </p>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-menu-button {
            display: block !important;
          }
          .mobile-overlay {
            display: block !important;
          }
          .mobile-sidebar {
            display: flex !important;
          }
        }

        @media (min-width: 769px) {
          .desktop-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
