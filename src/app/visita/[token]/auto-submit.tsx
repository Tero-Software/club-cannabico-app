"use client";

import { useEffect, useRef } from "react";

export function AutoSubmit() {
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;
    const form = document.querySelector<HTMLFormElement>("form");
    form?.requestSubmit();
  }, []);

  return null;
}
