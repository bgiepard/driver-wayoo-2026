import { signIn } from "next-auth/react";
import { useState } from "react";

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

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setPhone("");
    setError("");
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

      // Auto login after registration
      await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white border border-gray-300 p-6 w-80">
        <div className="flex justify-between items-center mb-4">
          <h2>{isRegister ? "Rejestracja kierowcy" : "Logowanie kierowcy"}</h2>
          <button onClick={onClose}>X</button>
        </div>

        {error && (
          <div className="mb-4 p-2 border border-red-300 text-red-600 text-sm">
            {error}
          </div>
        )}

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
                className="border border-gray-300 p-2"
                required
              />
              <input
                type="tel"
                placeholder="Numer telefonu"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border border-gray-300 p-2"
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 p-2"
            required
          />
          <input
            type="password"
            placeholder="Haslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 p-2"
            required
          />
          <button type="submit" className="border border-gray-300 p-2 bg-green-600 text-white">
            {isRegister ? "Zarejestruj" : "Zaloguj"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <button onClick={switchMode} className="underline cursor-pointer">
            {isRegister
              ? "Masz juz konto? Zaloguj sie"
              : "Nie masz konta? Zarejestruj sie"}
          </button>
        </div>
      </div>
    </div>
  );
}
