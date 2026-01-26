import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { OfferData, RequestData } from "@/lib/airtable";

interface OfferWithRequest extends OfferData {
  request?: RequestData;
}

export default function MyOffers() {
  const { data: session, status } = useSession();
  const [offers, setOffers] = useState<OfferWithRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchOffers();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchOffers = async () => {
    try {
      const res = await fetch("/api/offers");
      const offersData: OfferData[] = await res.json();

      // Fetch request details for each offer
      const offersWithRequests = await Promise.all(
        offersData.map(async (offer) => {
          try {
            const reqRes = await fetch(`/api/requests?id=${offer.requestId}`);
            if (reqRes.ok) {
              const request = await reqRes.json();
              return { ...offer, request };
            }
          } catch {
            // ignore
          }
          return offer;
        })
      );

      setOffers(offersWithRequests);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1:
        return "Oczekuje";
      case 2:
        return "Zaakceptowana";
      case 3:
        return "Odrzucona";
      default:
        return "Nieznany";
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return "text-yellow-600";
      case 2:
        return "text-green-600";
      case 3:
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="p-4 max-w-[1250px] mx-auto">
        <p>Ladowanie...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="p-4 max-w-[1250px] mx-auto">
        <section className="border border-gray-300 p-8 text-center">
          <p>Zaloguj sie, aby zobaczyc swoje oferty.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="p-4 max-w-[1250px] mx-auto">
      <section className="mb-4">
        <h1 className="text-2xl mb-4">Moje oferty</h1>
        <p className="text-gray-600 mb-4">
          Lista zlozonych przez Ciebie ofert.
        </p>
      </section>

      {offers.length === 0 ? (
        <section className="border border-gray-300 p-8 text-center">
          <p>Nie masz jeszcze zadnych zlozonych ofert.</p>
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          {offers.map((offer) => (
            <div key={offer.id} className="border border-gray-300 p-4">
              <div className="flex justify-between items-start">
                <div>
                  {offer.request ? (
                    <>
                      <p className="font-bold text-lg">
                        {offer.request.from} -{">"} {offer.request.to}
                      </p>
                      <p className="text-gray-600">
                        Data: {offer.request.date} o {offer.request.time}
                      </p>
                      <p className="text-gray-600">
                        Pasazerowie: {offer.request.adults} doroslych
                        {offer.request.children > 0 && `, ${offer.request.children} dzieci`}
                      </p>
                    </>
                  ) : (
                    <p className="font-bold text-lg">Zlecenie #{offer.requestId}</p>
                  )}
                  <p className="mt-2">
                    <span className="font-bold">Twoja cena:</span> {offer.price} PLN
                  </p>
                  {offer.message && (
                    <p className="text-gray-600">
                      <span className="font-bold">Wiadomosc:</span> {offer.message}
                    </p>
                  )}
                  <p className={`font-bold mt-2 ${getStatusColor(offer.status)}`}>
                    Status: {getStatusText(offer.status)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
