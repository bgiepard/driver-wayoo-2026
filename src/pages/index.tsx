import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { RequestData } from "@/lib/airtable";

export default function Home() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) {
      fetchRequests();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests");
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOffer = async (requestId: string) => {
    if (!price) {
      setError("Podaj cene");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          price: parseFloat(price),
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Blad podczas skladania oferty");
        return;
      }

      setSelectedRequest(null);
      setPrice("");
      setMessage("");
      fetchRequests();
    } catch {
      setError("Blad podczas skladania oferty");
    } finally {
      setSubmitting(false);
    }
  };

  const parseOptions = (optionsStr: string) => {
    try {
      const opts = JSON.parse(optionsStr);
      const active = Object.entries(opts)
        .filter(([, v]) => v)
        .map(([k]) => k);
      return active.length > 0 ? active.join(", ") : "Brak";
    } catch {
      return "Brak";
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
          <h1 className="text-2xl mb-4">Panel Kierowcy Wayoo</h1>
          <p className="mb-4">Zaloguj sie, aby zobaczyc dostepne zlecenia.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="p-4 max-w-[1250px] mx-auto">
      <section className="mb-4">
        <h1 className="text-2xl mb-4">Dostepne zlecenia</h1>
        <p className="text-gray-600 mb-4">
          Witaj, {session.user?.name}! Zloz oferte na wybrane zlecenie.
        </p>
      </section>

      {requests.length === 0 ? (
        <section className="border border-gray-300 p-8 text-center">
          <p>Brak dostepnych zlecen.</p>
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          {requests.map((request) => (
            <div key={request.id} className="border border-gray-300 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">
                    {request.from} -{">"} {request.to}
                  </p>
                  <p className="text-gray-600">
                    Data: {request.date} o {request.time}
                  </p>
                  <p className="text-gray-600">
                    Pasazerowie: {request.adults} doroslych
                    {request.children > 0 && `, ${request.children} dzieci`}
                  </p>
                  <p className="text-gray-600">
                    Opcje: {parseOptions(request.options)}
                  </p>
                </div>
                {selectedRequest !== request.id ? (
                  <button
                    onClick={() => setSelectedRequest(request.id)}
                    className="border border-green-600 bg-green-600 text-white px-4 py-2"
                  >
                    Zloz oferte
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedRequest(null);
                      setPrice("");
                      setMessage("");
                      setError("");
                    }}
                    className="border border-gray-400 px-4 py-2"
                  >
                    Anuluj
                  </button>
                )}
              </div>

              {selectedRequest === request.id && (
                <div className="mt-4 p-4 border border-gray-200 bg-gray-50">
                  <h3 className="font-bold mb-2">Zloz oferte</h3>
                  {error && (
                    <p className="text-red-600 mb-2">{error}</p>
                  )}
                  <div className="flex flex-col gap-2">
                    <input
                      type="number"
                      placeholder="Cena (PLN)"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="border border-gray-300 p-2"
                      min="0"
                      step="0.01"
                    />
                    <textarea
                      placeholder="Wiadomosc (opcjonalnie)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="border border-gray-300 p-2"
                      rows={3}
                    />
                    <button
                      onClick={() => handleSubmitOffer(request.id)}
                      disabled={submitting}
                      className="border border-green-600 bg-green-600 text-white px-4 py-2 disabled:opacity-50"
                    >
                      {submitting ? "Wysylanie..." : "Wyslij oferte"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
