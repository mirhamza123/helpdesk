import type { Metadata, Viewport } from "next";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = { title: { default: "Helpdesk", template: "%s · Helpdesk" }, description: "Support ticketing and helpdesk" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}<ToastProvider /></body></html>;
}
