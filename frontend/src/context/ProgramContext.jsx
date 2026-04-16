import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as api from "../services/api";

const ProgramContext = createContext(null);

const STORAGE_KEY = "selectedProgramId";

export function ProgramProvider({ children }) {
  const [programs, setPrograms] = useState([]);
  const [programId, setProgramIdState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.getPrograms();
      setPrograms(list);
      const stored = Number(localStorage.getItem(STORAGE_KEY) || 0);
      const next = list.find((p) => p.id === stored)?.id ?? list[0]?.id ?? null;
      setProgramIdState(next);
      if (next) localStorage.setItem(STORAGE_KEY, String(next));
    } catch (e) {
      setError(e.message || "Failed to load programs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPrograms();
  }, [refreshPrograms]);

  const setProgramId = (id) => {
    localStorage.setItem(STORAGE_KEY, String(id));
    setProgramIdState(id);
  };

  return (
    <ProgramContext.Provider value={{ programs, programId, setProgramId, loading, error, refreshPrograms }}>
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgram() {
  const ctx = useContext(ProgramContext);
  if (!ctx) throw new Error("useProgram must be used within ProgramProvider");
  return ctx;
}
