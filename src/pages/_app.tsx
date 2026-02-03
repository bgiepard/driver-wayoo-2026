import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { NotificationsProvider } from "@/context/NotificationsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <NotificationsProvider>
        <Header />
        <Component {...pageProps} />
        <Footer />
      </NotificationsProvider>
    </SessionProvider>
  );
}
