import Pusher from "pusher";

// Pusher server instance (do wysyłania eventów)
export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Typy eventów
export type PusherEventType = "new-offer" | "offer-accepted" | "offer-rejected";

export interface NewOfferEvent {
  offerId: string;
  requestId: string;
  driverId: string;
  driverName?: string;
  price: number;
  message: string;
  routeOrigin?: string;
  routeDestination?: string;
}

// Funkcje pomocnicze do wysyłania eventów
export async function notifyNewOffer(requestId: string, data: NewOfferEvent) {
  await pusher.trigger(`request-${requestId}`, "new-offer", data);
}
