import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import LoginModal from "./LoginModal";

export default function Header() {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex justify-between items-center py-4 px-4 max-w-[1250px] mx-auto">
        <Link href="/" className="text-xl font-semibold text-green-600">
          wayoo kierowca
        </Link>

        <nav className="flex gap-6 items-center text-sm">
          {session ? (
            <>
              <Link href="/" className="text-gray-600 hover:text-green-600">
                Zlecenia
              </Link>
              <Link href="/my-offers" className="text-gray-600 hover:text-green-600">
                Moje oferty
              </Link>
              <Link href="/account" className="text-gray-600 hover:text-green-600">
                Konto
              </Link>
            </>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-gray-600 hover:text-green-600"
            >
              Zaloguj sie
            </button>
          )}
        </nav>
      </div>
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  );
}
