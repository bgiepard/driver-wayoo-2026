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

  const inputClass = "border border-gray-200 rounded-lg p-3 text-sm focus:border-green-500";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-medium">
            {isRegister ? "Rejestracja kierowcy" : "Logowanie kierowcy"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg p-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 mb-4"
        >
          <GoogleIcon />
          {isGoogleLoading ? "Przekierowywanie..." : "Kontynuuj z Google"}
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-gray-500">lub</span>
          </div>
        </div>

        <form
          onSubmit={isRegister ? handleRegister : handleLogin}
          className="flex flex-col gap-4"
        >
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Imie i nazwisko"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                required
              />
              <input
                type="tel"
                placeholder="Numer telefonu"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
          <input
            type="password"
            placeholder="Haslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-3 text-sm font-medium transition-colors"
          >
            {isRegister ? "Zarejestruj" : "Zaloguj"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={switchMode} className="text-sm text-gray-500 hover:text-gray-700">
            {isRegister
              ? "Masz juz konto? Zaloguj sie"
              : "Nie masz konta? Zarejestruj sie"}
          </button>
        </div>
      </div>
    </div>
  );
}
