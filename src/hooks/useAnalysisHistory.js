import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "coughsense.history";
const MAX_ITEMS = 10;

function readHistory() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useAnalysisHistory() {
  const [history, setHistory] = useState(() => readHistory());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage write errors (private mode or storage limits).
    }
  }, [history]);

  const addEntry = useCallback((payload) => {
    const isObject = typeof payload === "object" && payload !== null;
    const resultText = isObject ? payload.resultText : payload;
    const resultKey = isObject ? payload.resultKey : null;

    const entry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      result: resultText || "",
      resultKey: Number.isInteger(resultKey) ? resultKey : null,
    };

    setHistory((prev) => [entry, ...prev].slice(0, MAX_ITEMS));
  }, []);

  return { history, addEntry };
}
