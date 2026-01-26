import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";

export default function Account() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
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
          <p>Zaloguj sie, aby zobaczyc swoje konto.</p>
        </section>
      </main>
    );
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <main className="p-4 max-w-[1250px] mx-auto">
      <section className="mb-4">
        <h1 className="text-2xl mb-4">Moje konto</h1>
      </section>

      <section className="border border-gray-300 p-4 mb-4">
        <h2 className="font-bold mb-4">Dane kierowcy</h2>
        <p>
          <span className="text-gray-600">Imie:</span> {session.user?.name}
        </p>
        <p>
          <span className="text-gray-600">Email:</span> {session.user?.email}
        </p>
      </section>

      <section className="border border-gray-300 p-4">
        <button
          onClick={handleSignOut}
          className="border border-red-600 text-red-600 px-4 py-2"
        >
          Wyloguj sie
        </button>
      </section>
    </main>
  );
}
