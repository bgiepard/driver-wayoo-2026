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
  const subscribedDriverIdRef = useRef<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Przechowuj funkcje w refach aby uniknac problemow z zaleznosciami
  const addLocalNotificationRef = useRef(addLocalNotification);
  const refreshNotificationsRef = useRef(refreshNotifications);

  // Aktualizuj refy gdy funkcje sie zmienia
  useEffect(() => {
    addLocalNotificationRef.current = addLocalNotification;
    refreshNotificationsRef.current = refreshNotifications;
  }, [addLocalNotification, refreshNotifications]);

  const driverId = (session?.user as any)?.id;

  useEffect(() => {
    // Wyczysc poprzednia subskrypcje jesli driverId sie zmienil
    if (subscribedDriverIdRef.current && subscribedDriverIdRef.current !== driverId) {
      const pusher = getPusherClient();
      pusher.unsubscribe(`driver-${subscribedDriverIdRef.current}`);
      channelRef.current = null;
      subscribedDriverIdRef.current = null;
      setIsConnected(false);
    }

    if (status !== "authenticated" || !driverId) {
      return;
    }

    // Juz subskrybowany na ten kanal
    if (subscribedDriverIdRef.current === driverId) {
      return;
    }

    const pusher = getPusherClient();

    console.log("[Pusher] Subskrybuje kanal driver-" + driverId);

    // Subskrybuj kanal kierowcy
    const channel = pusher.subscribe(`driver-${driverId}`);
    channelRef.current = channel;
    subscribedDriverIdRef.current = driverId;

    // Event: oferta zaakceptowana
    channel.bind("offer-accepted", (data: OfferAcceptedEvent) => {
      console.log("[Pusher] Otrzymano event offer-accepted:", data);

      // Dodaj lokalnie (bez zapisu do bazy - juz zapisane przez nadawce)
      addLocalNotificationRef.current({
        type: "offer_accepted",
        title: "Oferta zaakceptowana!",
        message: data.message || "Twoja oferta zostala zaakceptowana przez klienta.",
        link: "/my-offers",
      });

      // Odswierz powiadomienia z bazy (zsynchronizuje prawdziwe ID)
      setTimeout(() => refreshNotificationsRef.current(), 500);
    });

    // Event: przejazd oplacony
    channel.bind("offer-paid", (data: OfferPaidEvent) => {
      console.log("[Pusher] Otrzymano event offer-paid:", data);

      // Dodaj lokalnie (bez zapisu do bazy - juz zapisane przez nadawce)
      addLocalNotificationRef.current({
        type: "info",
        title: "Przejazd oplacony!",
        message: data.message || "Klient oplacil przejazd. Mozesz przystapic do realizacji.",
        link: "/my-offers",
      });

      // Odswierz powiadomienia z bazy (zsynchronizuje prawdziwe ID)
      setTimeout(() => refreshNotificationsRef.current(), 500);
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
      if (subscribedDriverIdRef.current) {
        console.log("[Pusher] Odlaczanie od kanalu driver-" + subscribedDriverIdRef.current);
        pusher.unsubscribe(`driver-${subscribedDriverIdRef.current}`);
        channelRef.current = null;
        subscribedDriverIdRef.current = null;
        setIsConnected(false);
      }
    };
  }, [status, driverId]); // Tylko status i driverId - funkcje sa w refach

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
