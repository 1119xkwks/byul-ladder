import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Byul Ladder",
  description: "A simple ladder game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
