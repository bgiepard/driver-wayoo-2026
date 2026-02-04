import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";

export default function Account() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return <p className="text-gray-500">Ladowanie...</p>;
  }

  if (!session) {
    return (
      <div className="bg-white rounded-lg p-12 text-center text-gray-500">
        Zaloguj sie, aby zobaczyc swoje konto.
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <>
      <h1 className="text-2xl font-semibold mb-6">Moje konto</h1>

      <div className="bg-white rounded-lg p-6 mb-4">
        <h2 className="text-lg font-medium mb-4">Dane kierowcy</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-gray-500">Imie</span>
            <span className="font-medium">{session.user?.name}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-gray-500">Email</span>
            <span>{session.user?.email}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="bg-white rounded-lg p-4 text-red-600 hover:bg-red-50 transition-colors w-full text-left font-medium"
      >
        Wyloguj sie
      </button>
    </>
  );
}
