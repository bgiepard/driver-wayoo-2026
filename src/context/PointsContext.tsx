import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface PointsContextType {
  points: number | null;
  refreshPoints: () => Promise<void>;
}

const PointsContext = createContext<PointsContextType | null>(null);

export function PointsProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [points, setPoints] = useState<number | null>(null);

  const refreshPoints = useCallback(async () => {
    try {
      const res = await fetch("/api/drivers/points");
      if (res.ok) {
        const data = await res.json();
        setPoints(data.points);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session) {
      refreshPoints();
    } else if (status === "unauthenticated") {
      setPoints(null);
    }
  }, [status, session, refreshPoints]);

  return (
    <PointsContext.Provider value={{ points, refreshPoints }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const context = useContext(PointsContext);
  if (!context) throw new Error("usePoints must be used within PointsProvider");
  return context;
}
