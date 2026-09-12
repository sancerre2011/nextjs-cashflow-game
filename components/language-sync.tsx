"use client";

import { useEffect } from "react";

const LANGUAGE_STORAGE_KEY = "cashflow-game-language-v1";
const LANGUAGE_EVENT_NAME = "cashflow-language-change";

const getStoredLanguage = () => {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "de" ? "de" : "en";
};

export function LanguageSync() {
  useEffect(() => {
    const applyLanguage = () => {
      document.documentElement.lang = getStoredLanguage();
    };

    applyLanguage();
    window.addEventListener(LANGUAGE_EVENT_NAME, applyLanguage);

    return () => {
      window.removeEventListener(LANGUAGE_EVENT_NAME, applyLanguage);
    };
  }, []);

  return null;
}
