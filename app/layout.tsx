import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shadcn GraphQL Auth",
  description: "Demo auth flow with mocked GraphQL backend",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="relative mx-auto flex max-w-5xl flex-col px-4 py-10">
          {children}
        </div>
      </body>
    </html>
  );
}
