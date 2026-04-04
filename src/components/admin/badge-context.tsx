"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface BadgeCounts {
  pending: number;
  confirmedToday: number;
  unpaidToday: number;
}

const BadgeContext = createContext<BadgeCounts>({ pending: 0, confirmedToday: 0, unpaidToday: 0 });

export function BadgeProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<BadgeCounts>({ pending: 0, confirmedToday: 0, unpaidToday: 0 });

  useEffect(() => {
    fetch("/api/admin/badge-counts")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setCounts(data); })
      .catch(() => {});
  }, []);

  return <BadgeContext.Provider value={counts}>{children}</BadgeContext.Provider>;
}

export function useBadgeCounts() {
  return useContext(BadgeContext);
}
