import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Neural Marionette - Personalized AI Assistant",
  description:
    "A personalized AI assistant that learns your personality through interactive questionnaires and adapts every response to match your unique traits.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.svg", sizes: "16x16", type: "image/svg+xml" },
      { url: "/favicon-64x64.svg", sizes: "64x64", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.svg", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-zinc-950">{children}</div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#18181b",
                color: "#f4f4f5",
                border: "1px solid #3f3f46",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
