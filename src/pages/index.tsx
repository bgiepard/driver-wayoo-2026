import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import type { RequestData } from "@/models";
import { optionLabels, getRouteDisplay } from "@/models";

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
        .map(([k]) => optionLabels[k as keyof typeof optionLabels] || k);
      return active.length > 0 ? active.join(", ") : "Brak";
    } catch {
      return "Brak";
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
        <div className="bg-white rounded-lg p-12 text-center">
          <h1 className="text-2xl font-semibold mb-4">Panel Kierowcy Wayoo</h1>
          <p className="text-gray-500">Zaloguj sie, aby zobaczyc dostepne zlecenia.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="py-8 px-4 max-w-[1250px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Dostepne zlecenia</h1>
        <p className="text-gray-500">
          Witaj, {session.user?.name}! Ponizej znajdziesz zlecenia na ktore mozesz zlozyc oferte.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center text-gray-500">
          Brak dostepnych zlecen. Zlozyles juz oferty na wszystkie aktywne zlecenia lub nie ma nowych.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {getRouteDisplay(request.route)}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {request.date} o {request.time}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {request.adults} doroslych{request.children > 0 && `, ${request.children} dzieci`}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Opcje: {parseOptions(request.options)}
                  </p>
                </div>
                {selectedRequest !== request.id ? (
                  <button
                    onClick={() => setSelectedRequest(request.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
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
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Anuluj
                  </button>
                )}
              </div>

              {selectedRequest === request.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-3">Zloz oferte</h3>
                  {error && (
                    <p className="text-red-600 text-sm mb-3">{error}</p>
                  )}
                  <div className="flex flex-col gap-3">
                    <input
                      type="number"
                      placeholder="Cena (PLN)"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="border border-gray-200 rounded-lg p-3 text-sm focus:border-green-500"
                      min="0"
                      step="0.01"
                    />
                    <textarea
                      placeholder="Wiadomosc (opcjonalnie)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="border border-gray-200 rounded-lg p-3 text-sm focus:border-green-500 resize-none"
                      rows={3}
                    />
                    <button
                      onClick={() => handleSubmitOffer(request.id)}
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      {submitting ? "Wysylanie..." : "Wyslij oferte"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
