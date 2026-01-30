import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { OfferWithRequest } from "@/models";

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

const getStatusStyle = (status: number) => {
  switch (status) {
    case 1:
      return "bg-yellow-100 text-yellow-700";
    case 2:
      return "bg-green-100 text-green-700";
    case 3:
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

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
      const data = await res.json();
      setOffers(data);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="py-8 px-4 max-w-[1250px] mx-auto">
        <p className="text-gray-500">Ladowanie...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="py-8 px-4 max-w-[1250px] mx-auto">
        <div className="bg-white rounded-lg p-12 text-center text-gray-500">
          Zaloguj sie, aby zobaczyc swoje oferty.
        </div>
      </main>
    );
  }

  // Grupuj oferty po statusie
  const pendingOffers = offers.filter((o) => o.status === 1);
  const acceptedOffers = offers.filter((o) => o.status === 2);
  const rejectedOffers = offers.filter((o) => o.status === 3);

  return (
    <main className="py-8 px-4 max-w-[1250px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Moje oferty</h1>
        <p className="text-gray-500">
          Lista zlecen na ktore zlozyles oferte. Tutaj zobaczysz status swoich ofert.
        </p>
      </div>

      {offers.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">Nie masz jeszcze zadnych zlozonych ofert.</p>
          <Link
            href="/"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Przejdz do dostepnych zlecen →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Zaakceptowane oferty */}
          {acceptedOffers.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-green-700 mb-3">
                Zaakceptowane ({acceptedOffers.length})
              </h2>
              <div className="flex flex-col gap-3">
                {acceptedOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            </div>
          )}

          {/* Oczekujące oferty */}
          {pendingOffers.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-yellow-700 mb-3">
                Oczekujace ({pendingOffers.length})
              </h2>
              <div className="flex flex-col gap-3">
                {pendingOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            </div>
          )}

          {/* Odrzucone oferty */}
          {rejectedOffers.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-red-700 mb-3">
                Odrzucone ({rejectedOffers.length})
              </h2>
              <div className="flex flex-col gap-3">
                {rejectedOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function OfferCard({ offer }: { offer: OfferWithRequest }) {
  return (
    <div className="bg-white rounded-lg p-5">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {offer.request ? (
            <>
              <p className="text-lg font-semibold text-gray-900">
                {offer.request.from} → {offer.request.to}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {offer.request.date} o {offer.request.time}
              </p>
              <p className="text-gray-500 text-sm">
                {offer.request.adults} doroslych
                {offer.request.children > 0 && `, ${offer.request.children} dzieci`}
              </p>
              {offer.request.status !== "published" && (
                <p className="text-xs text-gray-400 mt-1">
                  Status zlecenia: {offer.request.status}
                </p>
              )}
            </>
          ) : (
            <p className="text-lg font-semibold text-gray-900">
              Zlecenie #{offer.requestId.slice(-6)}
            </p>
          )}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm">
              <span className="text-gray-500">Twoja cena:</span>{" "}
              <span className="font-semibold">{offer.price} PLN</span>
            </p>
            {offer.message && (
              <p className="text-sm text-gray-500 mt-1">
                Wiadomosc: {offer.message}
              </p>
            )}
          </div>
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusStyle(
            offer.status
          )}`}
        >
          {getStatusText(offer.status)}
        </span>
      </div>
    </div>
  );
}
