import { SessionProviderWrapper } from "@/components/providers/session-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OpenSID - Sistem Informasi Desa",
  description: "Sistem Informasi Desa yang modern dan mudah digunakan untuk membantu administrasi desa",
  keywords: ["OpenSID", "Sistem Informasi Desa", "Administrasi Desa", "Pemerintahan Desa"],
  authors: [{ name: "OpenSID Team" }],
  creator: "OpenSID",
  publisher: "OpenSID",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <div id="root">{children}</div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}