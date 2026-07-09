import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ImageProvider } from "@/context/ImageContext";
// import Sidebar from "@/components/Sidebar"; // This is no longer needed here

// Import the new client component
import LayoutWrapper from "@/components/LayoutWrapper";

export const metadata: Metadata = {
  title: "SocialAdify",
  description: "Manage your social ads efficiently and gain AI-powered insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className={`${GeistSans.className} antialiased`}>
        <AuthProvider>
          <ImageProvider>
            {/* Wrap the children with the LayoutWrapper */}
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </ImageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}