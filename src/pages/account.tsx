import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Account() {
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
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 text-sm">Zaloguj się, aby zobaczyć swoje konto.</p>
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
    <div className="max-w-[600px] mx-auto">
      {/* Nagłówek */}
      <div className="mb-8">
        <p className="text-sm font-medium text-gray-500 mb-1">Ustawienia</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Moje konto</h1>
      </div>

      {/* Avatar + imię */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-6 mb-4 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/15 flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-brand-400">{initials}</span>
        </div>
        <div>
          <p className="text-lg font-semibold text-white">{session.user?.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{session.user?.email}</p>
          <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs font-medium text-brand-400">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
            Aktywny kierowca
          </span>
        </div>
      </div>

      {/* Dane */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dane konta</h2>
        </div>
        <div className="divide-y divide-white/[0.04]">
          <Row label="Imię i nazwisko" value={session.user?.name ?? "—"} />
          <Row label="Adres e-mail" value={session.user?.email ?? "—"} />
          <Row label="Rola" value="Kierowca" />
        </div>
      </div>

      {/* Wyloguj */}
      {!confirmSignOut ? (
        <button
          onClick={() => setConfirmSignOut(true)}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl border border-error-500/20 bg-error-500/5 hover:bg-error-500/10 transition-colors text-left group"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-error-500/10 text-error-400 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-error-400">Wyloguj się</p>
            <p className="text-xs text-gray-600 mt-0.5">Zakończy bieżącą sesję</p>
          </div>
        </button>
      ) : (
        <div className="rounded-2xl border border-error-500/30 bg-error-500/8 px-5 py-4">
          <p className="text-sm font-semibold text-white mb-1">Na pewno chcesz się wylogować?</p>
          <p className="text-xs text-gray-500 mb-4">Zostaniesz przekierowany na stronę główną.</p>
          <div className="flex gap-3">
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-xl bg-error-500 hover:bg-error-600 text-white text-sm font-semibold transition-colors"
            >
              Tak, wyloguj
            </button>
            <button
              onClick={() => setConfirmSignOut(false)}
              className="px-4 py-2 rounded-xl border border-white/[0.08] text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-white text-right truncate">{value}</span>
    </div>
  );
}
