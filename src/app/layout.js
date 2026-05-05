import { Geist } from "next/font/google";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Exploratory — Healthcare Supply Chain",
  description:
    "Smart warehousing platform for healthcare supply chain management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="h-full">
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
