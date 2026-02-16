"use client";

import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Clock,
  TrendingUp,
  UserPlus,
  Download,
  CheckSquare,
  Square,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  RefreshCw,
  CreditCard,
  Zap,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useEffect } from "react";
import {
  getUsers,
  getUserStats,
  updateUserStatus,
  updateUserTier,
  bulkUpdateUserStatus,
  type UserRow,
  type UserStats,
  type UserFilters,
} from "@/actions/users";

// Status colors for ALL real status values from Supabase
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  active: { bg: "#dcfce7", text: "#166534", border: "#bbf7d0" },
  free: { bg: "#f3f4f6", text: "#4b5563", border: "#e5e7eb" },
  trial: { bg: "#f0fdf4", text: "#15803d", border: "#86efac" },
  premium: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  trader: { bg: "#fed7aa", text: "#9a3412", border: "#fdba74" },
  annual: { bg: "#c7d2fe", text: "#3730a3", border: "#a5b4fc" },
  expired: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },
  cancelled: { bg: "#e5e7eb", text: "#374151", border: "#d1d5db" },
  suspended: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  banned: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },
  pending: { bg: "#eff6ff", text: "#1e40af", border: "#dbeafe" },
};

// Tier colors for ALL real tier values from Supabase
const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  free: { bg: "#f3f4f6", text: "#4b5563" },
  trial: { bg: "#f0fdf4", text: "#15803d" },
  trader: { bg: "#fed7aa", text: "#9a3412" },
  premium: { bg: "#fecaca", text: "#991b1b" },
  annual: { bg: "#c7d2fe", text: "#3730a3" },
  basic: { bg: "#dbeafe", text: "#1e40af" },
  pro: { bg: "#ddd6fe", text: "#5b21b6" },
  enterprise: { bg: "#fce7f3", text: "#be185d" },
};

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Parse URL params
  const filters: UserFilters = {
    query: searchParams?.get("query") || undefined,
    status: (searchParams?.get("status") as UserFilters["status"]) || "all",
    tier: (searchParams?.get("tier") as UserFilters["tier"]) || "all",
    sortBy: (searchParams?.get("sortBy") as UserFilters["sortBy"]) || "created_at",
    sortOrder: (searchParams?.get("sortOrder") as UserFilters["sortOrder"]) || "desc",
    page: parseInt(searchParams?.get("page") || "1", 10),
    limit: parseInt(searchParams?.get("limit") || "50", 10),
  };

  const [data, setData] = useState<{
    users: UserRow[];
    total: number;
    page: number;
    totalPages: number;
  } | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [usersData, statsData] = await Promise.all([getUsers(filters), getUserStats()]);
      setData(usersData);
      setStats(statsData);
      setIsLoading(false);
    }
    fetchData();
  }, [JSON.stringify(filters)]);

  // Update URL with filters
  const updateFilter = (key: keyof UserFilters, value: string | number | undefined) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (value === undefined || value === "all" || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    // Reset to page 1 when filters change
    if (key !== "page") {
      params.delete("page");
    }
    router.push(`/users?${params.toString()}`);
  };

  // Toggle sort
  const toggleSort = (column: UserFilters["sortBy"]) => {
    if (filters.sortBy === column) {
      updateFilter("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc");
    } else {
      updateFilter("sortBy", column);
      updateFilter("sortOrder", "desc");
    }
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedUsers.size === (data?.users.length || 0)) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(data?.users.map((u) => u.id) || []));
    }
  };

  const toggleSelectUser = (userId: string) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUsers(newSet);
  };

  // Bulk actions
  const handleBulkStatusUpdate = async (status: UserRow["status"]) => {
    if (selectedUsers.size === 0) return;
    await bulkUpdateUserStatus(Array.from(selectedUsers), status);
    setSelectedUsers(new Set());
    // Refresh data
    const newData = await getUsers(filters);
    setData(newData);
  };

  // Clear all filters
  const clearFilters = () => {
    router.push("/users");
  };

  const hasActiveFilters = filters.query || filters.status !== "all" || filters.tier !== "all";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <header
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h2
            style={{
              fontSize: "28px",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Users size={28} />
            User Management
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Manage users, tiers, and permissions • {stats?.total.toLocaleString() || 0} total users
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="glass"
            style={{
              padding: "10px 16px",
              borderRadius: "var(--radius)",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "none",
              cursor: "pointer",
              color: "var(--text)",
            }}
            onClick={() => alert("Export functionality - generates CSV of filtered users")}
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          <StatCard
            title="Total Users"
            value={stats.total.toLocaleString()}
            subtitle={`+${stats.newThisWeek} this week`}
            icon={Users}
            color="#3b82f6"
          />
          <StatCard
            title="Active Today"
            value={stats.activeToday.toLocaleString()}
            subtitle={`${((stats.activeToday / stats.total) * 100).toFixed(1)}% of total`}
            icon={TrendingUp}
            color="#22c55e"
          />
          <StatCard
            title="Pro & Enterprise"
            value={((stats.byTier.pro ?? 0) + (stats.byTier.enterprise ?? 0)).toLocaleString()}
            subtitle={`${stats.byTier.free ?? 0} free users`}
            icon={ShieldCheck}
            color="#8b5cf6"
          />
          <StatCard
            title="Suspended"
            value={stats.suspended.toLocaleString()}
            subtitle="Requires attention"
            icon={ShieldAlert}
            color="#f59e0b"
          />
        </section>
      )}

      {/* Tier Breakdown */}
      {stats && (
        <section className="card" style={{ padding: "20px" }}>
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "16px",
              color: "var(--text-muted)",
            }}
          >
            Users by Tier
          </h3>
          <div style={{ display: "flex", gap: "12px" }}>
            {Object.entries(stats.byTier).map(([tier, count]) => {
              const colors = TIER_COLORS[tier as keyof typeof TIER_COLORS];
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div
                  key={tier}
                  style={{
                    flex: 1,
                    padding: "16px",
                    backgroundColor: colors.bg,
                    borderRadius: "var(--radius)",
                    cursor: "pointer",
                  }}
                  onClick={() => updateFilter("tier", tier)}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        color: colors.text,
                      }}
                    >
                      {tier}
                    </span>
                    <span style={{ fontSize: "18px", fontWeight: 700, color: colors.text }}>
                      {count}
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "4px",
                      backgroundColor: "rgba(0,0,0,0.1)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${percentage}%`,
                        height: "100%",
                        backgroundColor: colors.text,
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Filters & Search */}
      <section className="card" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Search and Quick Filters */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "280px", position: "relative" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Search by username, display name, or Telegram ID..."
                value={filters.query || ""}
                onChange={(e) => updateFilter("query", e.target.value || undefined)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 40px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border-soft)",
                  backgroundColor: "var(--bg)",
                  fontSize: "14px",
                }}
              />
              {filters.query && (
                <button
                  onClick={() => updateFilter("query", undefined)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <X size={16} color="var(--text-muted)" />
                </button>
              )}
            </div>

            <select
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
              style={{
                padding: "10px 16px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border-soft)",
                backgroundColor: "var(--bg)",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
              <option value="pending">Pending</option>
            </select>

            <select
              value={filters.limit}
              onChange={(e) => updateFilter("limit", parseInt(e.target.value, 10))}
              style={{
                padding: "10px 16px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border-soft)",
                backgroundColor: "var(--bg)",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  padding: "10px 16px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border-soft)",
                  backgroundColor: "var(--bg-soft)",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <RefreshCw size={16} />
                Clear
              </button>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                backgroundColor: "#eff6ff",
                borderRadius: "var(--radius)",
                border: "1px solid #dbeafe",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e40af" }}>
                {selectedUsers.size} users selected
              </span>
              <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                <button
                  onClick={() => handleBulkStatusUpdate("active")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius)",
                    border: "none",
                    backgroundColor: "#22c55e",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate("suspended")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius)",
                    border: "none",
                    backgroundColor: "#f59e0b",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Suspend
                </button>
                <button
                  onClick={() => setSelectedUsers(new Set())}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border-soft)",
                    backgroundColor: "white",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Users Table */}
      <section className="card" style={{ overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
            <RefreshCw
              size={32}
              style={{ marginBottom: "16px", animation: "spin 1s linear infinite" }}
            />
            <p>Loading users...</p>
          </div>
        ) : !data || data.users.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
            <Users size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
            <p style={{ fontSize: "16px", marginBottom: "8px" }}>No users found</p>
            <p>
              {hasActiveFilters
                ? "Try adjusting your filters"
                : "Users will appear here once they sign up"}
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>
                      <button
                        onClick={toggleSelectAll}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                      >
                        {selectedUsers.size === data.users.length ? (
                          <CheckSquare size={18} />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </th>
                    <SortableHeader
                      label="User"
                      sortKey="display_name"
                      currentSort={filters.sortBy}
                      currentOrder={filters.sortOrder}
                      onSort={toggleSort}
                    />
                    <SortableHeader
                      label="Tier"
                      sortKey="tier"
                      currentSort={filters.sortBy}
                      currentOrder={filters.sortOrder}
                      onSort={toggleSort}
                    />
                    <SortableHeader
                      label="Status"
                      sortKey="status"
                      currentSort={filters.sortBy}
                      currentOrder={filters.sortOrder}
                      onSort={toggleSort}
                    />
                    <SortableHeader
                      label="Tier"
                      sortKey="tier"
                      currentSort={filters.sortBy}
                      currentOrder={filters.sortOrder}
                      onSort={toggleSort}
                    />
                    <th style={{ width: "60px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user) => {
                    const statusColors = STATUS_COLORS[user.status];
                    const tierColors = TIER_COLORS[user.tier];
                    const isSelected = selectedUsers.has(user.id);

                    return (
                      <tr
                        key={user.id}
                        style={{ backgroundColor: isSelected ? "#eff6ff" : undefined }}
                      >
                        <td>
                          <button
                            onClick={() => toggleSelectUser(user.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "4px",
                            }}
                          >
                            {isSelected ? (
                              <CheckSquare size={18} color="#3b82f6" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                backgroundColor: "var(--bg-soft)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--text-muted)",
                              }}
                            >
                              {(user.display_name ||
                                user.telegram_username ||
                                "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "14px" }}>
                                {user.display_name ||
                                  user.telegram_username ||
                                  `User ${user.telegram_id}`}
                              </div>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "var(--text-muted)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <span>ID: {user.telegram_id}</span>
                                {user.telegram_username && <span>@{user.telegram_username}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              backgroundColor: tierColors.bg,
                              color: tierColors.text,
                            }}
                          >
                            {user.tier}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: 600,
                              textTransform: "capitalize",
                              backgroundColor: statusColors.bg,
                              color: statusColors.text,
                              border: `1px solid ${statusColors.border}`,
                            }}
                          >
                            {user.status === "active" && <ShieldCheck size={12} />}
                            {user.status === "suspended" && <ShieldAlert size={12} />}
                            {user.status === "banned" && <Shield size={12} />}
                            {user.status}
                          </span>
                        </td>
                        <td
                          style={{
                            fontSize: "13px",
                            color: "var(--text-muted)",
                            fontFamily: "monospace",
                          }}
                        >
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "8px",
                              borderRadius: "var(--radius)",
                            }}
                            onClick={() => alert(`View details for user ${user.id}`)}
                          >
                            <MoreHorizontal size={18} color="var(--text-muted)" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderTop: "1px solid var(--border-soft)",
              }}
            >
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                Showing {(data.page - 1) * (filters.limit || 50) + 1} -{" "}
                {Math.min(data.page * (filters.limit || 50), data.total)} of{" "}
                {data.total.toLocaleString()} users
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  disabled={data.page <= 1}
                  onClick={() => updateFilter("page", data.page - 1)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border-soft)",
                    backgroundColor: data.page <= 1 ? "var(--bg-soft)" : "var(--bg)",
                    cursor: data.page <= 1 ? "not-allowed" : "pointer",
                    opacity: data.page <= 1 ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <div style={{ display: "flex", gap: "4px" }}>
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === data.page;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => updateFilter("page", pageNum)}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "var(--radius)",
                          border: "1px solid var(--border-soft)",
                          backgroundColor: isActive ? "var(--accent)" : "var(--bg)",
                          color: isActive ? "white" : "var(--text)",
                          fontWeight: isActive ? 700 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {data.totalPages > 5 && (
                    <span style={{ alignSelf: "center", color: "var(--text-muted)" }}>...</span>
                  )}
                </div>
                <button
                  disabled={data.page >= data.totalPages}
                  onClick={() => updateFilter("page", data.page + 1)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border-soft)",
                    backgroundColor: data.page >= data.totalPages ? "var(--bg-soft)" : "var(--bg)",
                    cursor: data.page >= data.totalPages ? "not-allowed" : "pointer",
                    opacity: data.page >= data.totalPages ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ size: number; color?: string }>;
  color: string;
}) {
  return (
    <div
      className="card"
      style={{ padding: "20px", display: "flex", alignItems: "flex-start", gap: "16px" }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          backgroundColor: color + "20",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={24} color={color} />
      </div>
      <div>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>{title}</p>
        <div style={{ fontSize: "24px", fontWeight: 700, color, marginBottom: "4px" }}>{value}</div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{subtitle}</p>
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string;
  sortKey: UserFilters["sortBy"];
  currentSort?: UserFilters["sortBy"];
  currentOrder?: UserFilters["sortOrder"];
  onSort: (key: UserFilters["sortBy"]) => void;
}) {
  const isActive = currentSort === sortKey;
  const Icon = isActive ? (currentOrder === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {label}
        <Icon size={14} color={isActive ? "var(--accent)" : "var(--text-muted)"} />
      </div>
    </th>
  );
}
