import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams?.action;

  if (action === "stats") {
    // Get database stats
    const [tablesResult, usersResult, convResult] = await Promise.all([
      supabase
        .from("information_schema.tables")
        .select("table_name, table_type")
        .eq("table_schema", "public"),
      supabase.from("profiles").select("count", { count: "exact" }),
      supabase.from("conversations").select("count", { count: "exact" }),
    ]);

    const tables = tablesResult.data?.length || 0;
    const users = usersResult.count || 0;
    const conversations = convResult.count || 0;

    return NextResponse.json({
      totalTables: tables,
      totalUsers: users,
      totalConversations: conversations,
      connected: true,
    });
  }

  if (action === "recent-users") {
    const { data } = await supabase
      .from("profiles")
      .select("id, created_at, telegram_id")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json(data || []);
  }

  if (action === "recent-conversations") {
    const { data } = await supabase
      .from("conversations")
      .select("id, created_at, user_id, intent_type, status")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json(data || []);
  }

  return NextResponse.json({ error: "Invalid action" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      case "view-schema":
        const { data } = await supabase
          .from("information_schema.tables")
          .select("table_name")
          .eq("table_schema", "public");

        return NextResponse.json({
          success: true,
          message: "Schema viewed successfully",
          data: { tables: data?.length || 0 },
        });

      case "export-data":
        const [users, conversations] = await Promise.all([
          supabase.from("profiles").select("*"),
          supabase.from("conversations").select("*"),
        ]);

        return NextResponse.json({
          success: true,
          message: `Exported ${users.data?.length || 0} users and ${conversations.data?.length || 0} conversations`,
          data: { users: users.data, conversations: conversations.data },
        });

      case "clear-logs":
        await supabase
          .from("conversations")
          .delete()
          .lt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        return NextResponse.json({
          success: true,
          message: "Cleared old conversation logs",
        });

      default:
        return NextResponse.json({
          success: false,
          message: `Unknown action: ${action}`,
        });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `Action failed: ${error}`,
    });
  }
}
