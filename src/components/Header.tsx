import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import LoginModal from "./LoginModal";

export default function Header() {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <header className="flex justify-between items-center p-4 border-b border-gray-300 max-w-[1250px] mx-auto">
      <Link href="/" className="font-bold text-green-600">wayoo kierowca</Link>
      <div className="flex gap-4 items-center">
        {session ? (
          <>
            <Link href="/">Zlecenia</Link>
            <Link href="/my-offers">Moje oferty</Link>
            <Link href="/account">Konto</Link>
          </>
        ) : (
          <button onClick={() => setIsModalOpen(true)} className="cursor-pointer">
            Zaloguj sie
          </button>
        )}
      </div>
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  );
}
