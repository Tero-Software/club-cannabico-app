"use client";

import {
  createContext,
  useContext,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  type ReactNode,
} from "react";

const TICK_MS = 100;
const TICK_FACTOR = 0.08;
const CAP = 0.9;
const FINISH_MS = 250;

type ProgressContextValue = {
  visible: boolean;
  progress: number;
  start: () => void;
};

const ProgressBarContext = createContext<ProgressContextValue | null>(null);

function useProgressBarContext() {
  const ctx = useContext(ProgressBarContext);
  if (ctx === null) {
    throw new Error("Usar `ProgressBarProvider` antes del progress bar.");
  }
  return ctx;
}

function useProgressInternal(): ProgressContextValue {
  const [loading, setLoading] = useOptimistic(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const progressRef = useRef(0);

  useEffect(() => {
    if (loading) {
      progressRef.current = 0.08;
      setProgress(0.08);
      setVisible(true);
      const id = setInterval(() => {
        const cur = progressRef.current;
        if (cur >= CAP) return;
        const next = cur + (CAP - cur) * TICK_FACTOR;
        progressRef.current = next;
        setProgress(next);
      }, TICK_MS);
      return () => clearInterval(id);
    }
    if (!visible) return;
    progressRef.current = 1;
    setProgress(1);
    const hideId = setTimeout(() => {
      setVisible(false);
    }, FINISH_MS);
    return () => clearTimeout(hideId);
  }, [loading, visible]);

  return {
    visible,
    progress,
    start: () => setLoading(true),
  };
}

export function ProgressBarProvider({ children }: { children: ReactNode }) {
  const value = useProgressInternal();
  return (
    <ProgressBarContext.Provider value={value}>
      {children}
    </ProgressBarContext.Provider>
  );
}

export function ProgressBar() {
  const { visible, progress } = useProgressBarContext();
  return (
    <div
      id="nprogress-rasta"
      aria-hidden
      style={{
        opacity: visible ? 1 : 0,
        ["--rasta-progress" as string]: String(progress),
      }}
    />
  );
}

export function useProgress() {
  const { start } = useProgressBarContext();
  return start;
}
