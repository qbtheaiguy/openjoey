"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

interface MobileSidebarProps {
  children: React.ReactNode;
}

export default function MobileSidebar({ children }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          top: "16px",
          left: "16px",
          zIndex: 1000,
          display: "none",
          padding: "8px",
          backgroundColor: "var(--bg)",
          border: "1px solid var(--border-soft)",
          borderRadius: "var(--radius)",
          cursor: "pointer",
        }}
        className="mobile-menu-button"
      >
        <Menu size={20} color="var(--text)" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
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
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease",
          zIndex: 1000,
          display: "none",
        }}
        className="mobile-sidebar"
      >
        <div
          style={{
            padding: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "24px" }}>🦞</span>
          <button
            onClick={() => setIsOpen(false)}
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
        {children}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-button {
            display: block !important;
          }
          .mobile-overlay {
            display: block !important;
          }
          .mobile-sidebar {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
