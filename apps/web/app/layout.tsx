import type { Metadata } from "next";
import { GameNavigation } from "../features/navigation/GameNavigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Walk Back Home",
  description: "A local-first playable memory reconstruction MVP."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <GameNavigation />
        {children}
      </body>
    </html>
  );
}
