// Types for V1 service health
export interface V1ServiceHealth {
  name: string;
  port: number;
  host: string;
  status: "healthy" | "warning" | "critical" | "unknown";
  responseTime: number;
  lastCheck: string;
  error?: string;
}

// Fetch V1 service health from Hetzner via SSH
export async function getV1ServiceHealth(): Promise<V1ServiceHealth[]> {
  // Skip SSH during build
  if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
    return [];
  }

  const services = [
    { name: "indicator_engine", port: 3001 },
    { name: "signal_engine", port: 3002 },
    { name: "conversation_engine", port: 3003 },
    { name: "sentiment_service", port: 3004 },
    { name: "radar_service", port: 3005 },
    { name: "portfolio_service", port: 3006 },
    { name: "whale_service", port: 3007 },
    { name: "alert_service", port: 3008 },
  ];

  const host = "116.203.215.213"; // Hetzner server

  try {
    // Use SSH to execute curl commands on Hetzner server
    const healthChecks = await Promise.allSettled(
      services.map(async (service) => {
        const startTime = Date.now();

        try {
          // Execute health check via SSH
          const { execSync } = require("child_process");
          const command = `ssh -i ~/.ssh/hetzner-openjoey-new root@${host} "curl -s --max-time 5 http://localhost:${service.port}/health"`;

          const output = execSync(command, {
            encoding: "utf8",
            timeout: 10000, // 10 second timeout
          });

          const responseTime = Date.now() - startTime;
          const data = JSON.parse(output);

          if (data.status === "healthy") {
            return {
              ...service,
              host,
              status: "healthy" as const,
              responseTime,
              lastCheck: new Date().toISOString(),
            };
          } else {
            return {
              ...service,
              host,
              status: "warning" as const,
              responseTime,
              lastCheck: new Date().toISOString(),
              error: `Service reports: ${data.status}`,
            };
          }
        } catch (error) {
          const responseTime = Date.now() - startTime;
          return {
            ...service,
            host,
            status: "critical" as const,
            responseTime,
            lastCheck: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Connection failed",
          };
        }
      }),
    );

    const results: V1ServiceHealth[] = [];
    healthChecks.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        results.push(result.value);
      }
    });
    return results;
  } catch (error) {
    console.error("Error checking V1 services:", error);
    throw new Error("Failed to connect to Hetzner server");
  }
}
