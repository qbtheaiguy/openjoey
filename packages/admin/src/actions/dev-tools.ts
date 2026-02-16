import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

// Environment status check
export interface EnvironmentStatus {
  hetzner: "online" | "offline" | "unknown";
  supabase: "connected" | "disconnected" | "unknown";
  kimiApi: "active" | "inactive" | "unknown";
  coingeckoApi: "healthy" | "unhealthy" | "unknown";
}

// Quick debug actions
export interface DebugAction {
  name: string;
  description: string;
  action: () => Promise<{ success: boolean; message: string }>;
}

// Check environment status
export async function getEnvironmentStatus(): Promise<EnvironmentStatus> {
  const status: EnvironmentStatus = {
    hetzner: "unknown",
    supabase: "unknown",
    kimiApi: "unknown",
    coingeckoApi: "unknown",
  };

  // Skip SSH checks during build
  if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
    return status;
  }

  try {
    // Check Hetzner server
    try {
      execSync("ssh -i ~/.ssh/hetzner-openjoey-new root@116.203.215.213 'echo \"server is up\"'", {
        timeout: 5000,
      });
      status.hetzner = "online";
    } catch {
      status.hetzner = "offline";
    }

    // Check Supabase
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from("users").select("id").limit(1);
        status.supabase = "connected";
      } else {
        status.supabase = "disconnected";
      }
    } catch {
      status.supabase = "disconnected";
    }

    // Check Kimi API
    try {
      const response = await fetch("https://api.moonshot.ai/v1/models", {
        headers: {
          Authorization: `Bearer ${process.env.MOONSHOT_API_KEY}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      status.kimiApi = response.ok ? "active" : "inactive";
    } catch {
      status.kimiApi = "inactive";
    }

    // Check CoinGecko API
    try {
      const response = await fetch("https://api.coingecko.com/api/v3/ping", {
        signal: AbortSignal.timeout(5000),
      });
      status.coingeckoApi = response.ok ? "healthy" : "unhealthy";
    } catch {
      status.coingeckoApi = "unhealthy";
    }
  } catch (error) {
    console.error("Error checking environment status:", error);
    throw new Error("Failed to connect to Hetzner server");
  }

  return status;
}

// Get available debug actions
export async function getDebugActions(): Promise<DebugAction[]> {
  return [
    {
      name: "Clear All Caches",
      description: "Clear Redis and application caches",
      action: async () => {
        // Skip SSH during build
        if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
          return { success: false, message: "SSH actions disabled during build" };
        }

        try {
          execSync("ssh -i ~/.ssh/hetzner-openjoey-new root@116.203.215.213 'redis-cli FLUSHALL'", {
            timeout: 10000,
          });
          return { success: true, message: "All caches cleared successfully" };
        } catch (error) {
          return { success: false, message: `Failed to clear caches: ${error}` };
        }
      },
    },
    {
      name: "Restart V1 Services",
      description: "Restart all V1 services on Hetzner",
      action: async () => {
        // Skip SSH during build
        if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
          return { success: false, message: "SSH actions disabled during build" };
        }

        try {
          execSync(
            "ssh -i ~/.ssh/hetzner-openjoey-new root@116.203.215.213 'systemctl restart openjoey-gateway'",
            {
              timeout: 15000,
            },
          );
          return { success: true, message: "Services restarted successfully" };
        } catch (error) {
          return { success: false, message: `Failed to restart services: ${error}` };
        }
      },
    },
    {
      name: "Run Health Check",
      description: "Run comprehensive health check on all systems",
      action: async () => {
        try {
          const status = await getEnvironmentStatus();
          const healthyCount = Object.values(status).filter(
            (s) => s === "online" || s === "connected" || s === "active" || s === "healthy",
          ).length;

          return {
            success: true,
            message: `Health check complete: ${healthyCount}/4 systems healthy`,
          };
        } catch (error) {
          return { success: false, message: `Health check failed: ${error}` };
        }
      },
    },
    {
      name: "Check Service Logs",
      description: "Check recent service logs for errors",
      action: async () => {
        try {
          const output = execSync(
            "ssh -i ~/.ssh/hetzner-openjoey-new root@116.203.215.213 'tail -20 /var/log/openjoey.log | grep -i error'",
            { encoding: "utf8", timeout: 10000 },
          );

          const errorCount = output.split("\n").filter((line: string) => line.trim()).length;
          return {
            success: true,
            message: `Found ${errorCount} errors in recent logs`,
          };
        } catch (error) {
          return { success: false, message: `Failed to check logs: ${error}` };
        }
      },
    },
  ];
}
