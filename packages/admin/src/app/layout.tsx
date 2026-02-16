import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "OpenJoey Admin Dashboard",
  description: "Monitor usage and revenue for OpenJoey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="layout-wrapper" style={{ display: "flex", minHeight: "100vh" }}>
          <ResponsiveSidebar />
          <main
            style={{
              flex: 1,
              padding: "40px",
              maxWidth: "1400px",
              margin: "0 auto",
              width: "100%",
            }}
            className="main-content"
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
