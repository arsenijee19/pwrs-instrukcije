"use client";
import { useEffect } from "react";
import { UI, type Lang } from "@/lib/i18n";

/** Postavlja <html lang> prema jeziku trenutne stranice. */
export function HtmlLang({ lang }: { lang: Lang }) {
  useEffect(() => { document.documentElement.lang = UI[lang].htmlLang; }, [lang]);
  return null;
}
