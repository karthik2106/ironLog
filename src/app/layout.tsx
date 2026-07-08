import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AppProvider } from "@/features/auth/app-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "IronLog",
  description: "A premium Push Pull Legs workout tracker with routine editing and progress analytics.",
  applicationName: "IronLog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AppProvider>{children}</AppProvider>
        <Toaster
          theme="dark"
          toastOptions={{
            classNames: {
              toast: "border border-border bg-card text-foreground",
              actionButton: "bg-accent text-accent-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}
