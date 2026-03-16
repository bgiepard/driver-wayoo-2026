import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right truncate">{value}</span>
    </div>
  );
}

export default function AccountView() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-12 text-center">
        <p className="text-sm text-gray-500">Zaloguj się, aby zobaczyć swoje konto.</p>
      </div>
    );
  }

  const initials = session.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "K";

  return (
    <div className="max-w-[600px] mx-auto space-y-6">

      {/* Nagłówek */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Ustawienia</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Moje konto</h1>
      </div>

      {/* Profil */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm px-6 py-5 flex items-center gap-5">
        <div className="w-14 h-14 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-brand-600">{initials}</span>
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">{session.user?.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{session.user?.email}</p>
          <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-brand-50 border border-brand-100 text-xs font-medium text-brand-700">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            Aktywny kierowca
          </span>
        </div>
      </div>

      {/* Dane konta */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Dane konta</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <Row label="Imię i nazwisko" value={session.user?.name ?? "—"} />
          <Row label="Adres e-mail" value={session.user?.email ?? "—"} />
          <Row label="Rola" value="Kierowca" />
        </div>
      </div>

      {/* Wylogowanie */}
      {!confirmSignOut ? (
        <button
          onClick={() => setConfirmSignOut(true)}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-left"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-100 text-red-500 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-600">Wyloguj się</p>
            <p className="text-xs text-gray-500 mt-0.5">Zakończy bieżącą sesję</p>
          </div>
        </button>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 mb-1">Na pewno chcesz się wylogować?</p>
          <p className="text-xs text-gray-500 mb-4">Zostaniesz przekierowany na stronę główną.</p>
          <div className="flex gap-3">
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
            >
              Tak, wyloguj
            </button>
            <button
              onClick={() => setConfirmSignOut(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
