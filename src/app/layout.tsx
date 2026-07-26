import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { FilesProvider } from "@/context/FilesContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AppLayout from "@/components/AppLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Archivos Multired",
  description: "Gestiona tus archivos de forma segura en múltiples ubicaciones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors">
        <ThemeProvider>
          <AuthProvider>
            <FilesProvider>
              <AppLayout>{children}</AppLayout>
            </FilesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
