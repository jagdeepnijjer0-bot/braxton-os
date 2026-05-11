import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";

export const metadata: Metadata = {
  title: "Braxton OS",
  description: "Business operating system for modern teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex">
        <Sidebar />
        <div className="flex-1" style={{ marginLeft: "240px" }}>
          <TopBar />
          <main className="p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
