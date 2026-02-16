interface User {
  id: string;
  created_at: string;
  telegram_id: string;
}

export function RecentUsers({ users }: { users: User[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {users.map((user) => (
        <div
          key={user.id}
          style={{
            padding: "8px",
            backgroundColor: "var(--bg-soft)",
            borderRadius: "6px",
            fontSize: "13px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>ID: {user.id.slice(0, 8)}...</span>
          <span style={{ color: "var(--text-muted)" }}>
            {new Date(user.created_at).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  );
}
