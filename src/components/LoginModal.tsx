import { signIn } from "next-auth/react";
import { useState } from "react";
import { GoogleIcon } from "./icons";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setPhone("");
    setError("");
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError("");
    await signIn("google", { callbackUrl: "/" });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Nieprawidlowy email lub haslo");
    } else {
      resetForm();
      onClose();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      await signIn("credentials", { email, password, redirect: false });
      resetForm();
      onClose();
    } catch {
      setError("Blad podczas rejestracji");
    }
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[400px] mx-4 rounded-2xl border border-white/[0.08] bg-gray-900 shadow-2xl">
        {/* Naglowek */}
        <div className="flex items-center justify-between px-6 pt-6 pb-1">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {isRegister ? "Utworz konto" : "Zaloguj sie"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isRegister ? "Dolacz jako kierowca Wayoo" : "Witaj z powrotem"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 pt-5">
          {/* Blad */}
          {error && (
            <div className="mb-4 flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-error-500/10 border border-error-500/20">
              <svg className="w-4 h-4 text-error-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span className="text-sm text-error-400">{error}</span>
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-medium text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40"
          >
            <GoogleIcon />
            {isGoogleLoading ? "Przekierowywanie..." : "Kontynuuj z Google"}
          </button>

          {/* Separator */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-900 px-3 text-xs text-gray-600">lub</span>
            </div>
          </div>

          {/* Formularz */}
          <form
            onSubmit={isRegister ? handleRegister : handleLogin}
            className="flex flex-col gap-3"
          >
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Imie i nazwisko</label>
                  <input
                    type="text"
                    placeholder="Jan Kowalski"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Telefon</label>
                  <input
                    type="tel"
                    placeholder="+48 000 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-colors"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="jan@firma.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Haslo</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              className="mt-1 w-full rounded-xl bg-brand-500 hover:bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-colors"
            >
              {isRegister ? "Utworz konto" : "Zaloguj sie"}
            </button>
          </form>

          {/* Przelacznik trybu */}
          <div className="mt-5 text-center">
            <button
              onClick={switchMode}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              {isRegister
                ? "Masz juz konto? "
                : "Nie masz konta? "}
              <span className="text-brand-400 font-medium">
                {isRegister ? "Zaloguj sie" : "Zarejestruj sie"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
