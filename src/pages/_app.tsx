import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Script from "next/script";
import { Geist } from "next/font/google";
import { SessionProvider, useSession } from "next-auth/react";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { PusherProvider } from "@/context/PusherContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useRouter } from "next/router";

const geist = Geist({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

function AppContent({ Component, pageProps }: { Component: AppProps["Component"]; pageProps: Record<string, unknown> }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Strona glowna bez layoutu gdy niezalogowany
  const isLanding = router.pathname === "/" && !session && status !== "loading";

  if (isLanding) {
    return <Component {...pageProps} />;
  }

  return (
    <DashboardLayout>
      <Component {...pageProps} />
    </DashboardLayout>
  );
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=pl`}
        strategy="beforeInteractive"
      />
      <div className={geist.className}>
        <NotificationsProvider>
          <PusherProvider>
            <AppContent Component={Component} pageProps={pageProps} />
          </PusherProvider>
        </NotificationsProvider>
      </div>
    </SessionProvider>
  );
}
