import { createContext, useContext, useEffect, useRef, ReactNode, useState } from "react";
import { useSession } from "next-auth/react";
import { getPusherClient, type OfferPaidEvent } from "@/lib/pusher-client";
import { useNotifications } from "./NotificationsContext";

interface PusherContextType {
  isConnected: boolean;
}

const PusherContext = createContext<PusherContextType | null>(null);

export function PusherProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { addLocalNotification } = useNotifications();
  const subscribedChannelRef = useRef<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const addLocalNotificationRef = useRef(addLocalNotification);

  useEffect(() => {
    addLocalNotificationRef.current = addLocalNotification;
  }, [addLocalNotification]);

  const driverId = (session?.user as any)?.id;

  useEffect(() => {
    if (status !== "authenticated" || !driverId) {
      if (subscribedChannelRef.current) {
        const pusher = getPusherClient();
        if (pusher) {
          pusher.unsubscribe(subscribedChannelRef.current);
        }
        subscribedChannelRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const channelName = `driver-${driverId}`;

    if (subscribedChannelRef.current === channelName) return;

    if (subscribedChannelRef.current) {
      const pusher = getPusherClient();
      if (pusher) {
        pusher.unsubscribe(subscribedChannelRef.current);
      }
    }

    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(channelName);
    subscribedChannelRef.current = channelName;

    channel.bind("offer-paid", (data: OfferPaidEvent) => {
      addLocalNotificationRef.current({
        type: "info",
        title: "Przejazd oplacony!",
        message: data.message || "Klient oplacil przejazd. Mozesz przystapic do realizacji.",
        link: "/moje-oferty",
      });
    });

    channel.bind("pusher:subscription_succeeded", () => {
      setIsConnected(true);
    });

    return () => {
      if (subscribedChannelRef.current) {
        pusher.unsubscribe(subscribedChannelRef.current);
        subscribedChannelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [status, driverId]);

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
