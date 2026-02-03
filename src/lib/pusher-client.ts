import PusherClient from "pusher-js";

// Singleton Pusher client instance
let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherClient && typeof window !== "undefined") {
    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return pusherClient!;
}

// Typy eventow
export interface OfferAcceptedEvent {
  offerId: string;
  requestId: string;
  message: string;
}

export interface OfferPaidEvent {
  offerId: string;
  requestId: string;
  message: string;
}
