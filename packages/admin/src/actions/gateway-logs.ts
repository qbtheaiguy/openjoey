// Types for gateway logs
export interface GatewayLog {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  component: string;
  message: string;
  details?: any;
}

// Fetch gateway logs from Hetzner server via SSH
export async function getGatewayLogs(options: {
  level?: string;
  search?: string;
  limit?: number;
}): Promise<GatewayLog[]> {
  const { level = "all", search = "", limit = 100 } = options;

  // Skip SSH during build
  if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
    return [];
  }

  try {
    // Use SSH to fetch logs from Hetzner server
    const { execSync } = require("child_process");
    const host = "116.203.215.213";

    let command = `ssh -i ~/.ssh/hetzner-openjoey-new root@${host} "tail -n ${limit} /var/log/openjoey.log"`;

    if (level !== "all") {
      command = `ssh -i ~/.ssh/hetzner-openjoey-new root@${host} "grep -i '${level}' /var/log/openjoey.log | tail -n ${limit}"`;
    }

    if (search) {
      command = `ssh -i ~/.ssh/hetzner-openjoey-new root@${host} "grep -i '${search}' /var/log/openjoey.log | tail -n ${limit}"`;
    }

    const output = execSync(command, {
      encoding: "utf8",
      timeout: 15000, // 15 second timeout
    });

    // Parse log lines
    const logLines = output.split("\n").filter((line: string) => line.trim());

    return logLines.map((line: string): GatewayLog => {
      // Parse log format: [2026-02-15T06:54:13.443Z] [gateway] message
      const timestampMatch = line.match(/\[([^\]]+)\]/);
      const componentMatch = line.match(/\[([^\]]+)\]/g);
      const levelMatch = line.toLowerCase().match(/\b(debug|info|warn|error)\b/i);

      const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
      const component =
        componentMatch && componentMatch[1] ? componentMatch[1].replace(/[\[\]]/g, "") : "gateway";
      const detectedLevel = levelMatch ? levelMatch[1].toLowerCase() : "info";

      // Extract message after timestamp and component
      let message = line;
      if (timestampMatch) {
        message = message.replace(timestampMatch[0], "").trim();
      }
      if (componentMatch) {
        componentMatch.forEach((match) => {
          message = message.replace(match, "").trim();
        });
      }

      return {
        timestamp,
        level: detectedLevel as GatewayLog["level"],
        component,
        message: message || "No message",
        details: null,
      };
    });
  } catch (error) {
    console.error("Error fetching gateway logs:", error);

    // Return empty array if fetch fails - no mock data
    return [];
  }
}
