"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  currentLocale?: string;
};

export function LanguageSwitcher({ currentLocale }: Props) {
  const [current, setCurrent] = useState<string>(currentLocale ?? "fr");

  useEffect(() => {
    if (currentLocale) {
      setCurrent(currentLocale);
      return;
    }
    try {
      const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/);
      if (match && match[1]) {
        setCurrent(decodeURIComponent(match[1]));
      }
    } catch {
      // noop
    }
  }, [currentLocale]);

  const setLocale = useCallback((locale: string) => {
    try {
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
      window.location.reload();
    } catch {
      // noop
    }
  }, []);

  const languages = [
    { code: "fr", label: "Français" },
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "de", label: "Deutsch" },
    { code: "it", label: "Italiano" },
  ];

  return (
    <Select value={current} onValueChange={setLocale}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
