import { createContext, useContext, useEffect, useRef, ReactNode, useState } from "react";
import { useSession } from "next-auth/react";
import { getPusherClient, type OfferAcceptedEvent, type OfferPaidEvent } from "@/lib/pusher-client";
import { useNotifications } from "./NotificationsContext";
import type { Channel } from "pusher-js";

interface PusherContextType {
  isConnected: boolean;
}

const PusherContext = createContext<PusherContextType | null>(null);

export function PusherProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { addLocalNotification, refreshNotifications } = useNotifications();
  const channelRef = useRef<Channel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const driverId = (session?.user as any)?.id;

  useEffect(() => {
    if (status !== "authenticated" || !driverId) {
      // Wyczysc subskrypcje gdy uzytkownik sie wyloguje
      if (channelRef.current) {
        const pusher = getPusherClient();
        pusher.unsubscribe(`driver-${driverId}`);
        channelRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const pusher = getPusherClient();

    // Subskrybuj kanal kierowcy
    const channel = pusher.subscribe(`driver-${driverId}`);
    channelRef.current = channel;

    // Event: oferta zaakceptowana
    channel.bind("offer-accepted", (data: OfferAcceptedEvent) => {
      console.log("[Pusher] Otrzymano event offer-accepted:", data);

      // Dodaj lokalnie (bez zapisu do bazy - juz zapisane przez nadawce)
      addLocalNotification({
        type: "offer_accepted",
        title: "Oferta zaakceptowana!",
        message: data.message || "Twoja oferta zostala zaakceptowana przez klienta.",
        link: "/my-offers",
      });

      // Odswierz powiadomienia z bazy (zsynchronizuje prawdziwe ID)
      setTimeout(() => refreshNotifications(), 500);
    });

    // Event: przejazd oplacony
    channel.bind("offer-paid", (data: OfferPaidEvent) => {
      console.log("[Pusher] Otrzymano event offer-paid:", data);

      // Dodaj lokalnie (bez zapisu do bazy - juz zapisane przez nadawce)
      addLocalNotification({
        type: "info",
        title: "Przejazd oplacony!",
        message: data.message || "Klient oplacil przejazd. Mozesz przystapic do realizacji.",
        link: "/my-offers",
      });

      // Odswierz powiadomienia z bazy (zsynchronizuje prawdziwe ID)
      setTimeout(() => refreshNotifications(), 500);
    });

    // Status polaczenia
    channel.bind("pusher:subscription_succeeded", () => {
      console.log("[Pusher] Polaczono z kanalem driver-" + driverId);
      setIsConnected(true);
    });

    channel.bind("pusher:subscription_error", (error: any) => {
      console.error("[Pusher] Blad subskrypcji:", error);
      setIsConnected(false);
    });

    // Cleanup
    return () => {
      console.log("[Pusher] Odlaczanie od kanalu driver-" + driverId);
      pusher.unsubscribe(`driver-${driverId}`);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [status, driverId, addLocalNotification, refreshNotifications]);

  return (
    <PusherContext.Provider value={{ isConnected }}>
      {children}
    </PusherContext.Provider>
  );
}

export function usePusher() {
  const context = useContext(PusherContext);
  if (!context) {
    throw new Error("usePusher must be used within PusherProvider");
  }
  return context;
}
