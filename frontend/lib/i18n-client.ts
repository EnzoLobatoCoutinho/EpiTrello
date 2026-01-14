"use client";

import { useEffect, useMemo, useState } from "react";

type Dict = Record<string, string>;

function interpolate(template: string, vars?: Record<string, unknown>) {
  if (!vars) return template;
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : ""
  );
}

export function useClientT(ns: string, initialLocale?: string) {
  const [locale, setLocale] = useState<string>(() => {
    if (initialLocale) return initialLocale;
    try {
      const match = typeof document !== "undefined"
        ? document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)
        : null;
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } catch {
      // noop
    }
    return "fr";
  });
  const [dict, setDict] = useState<Dict | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/locales/${locale}/${ns}.json`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as Dict;
          if (active) setDict(data);
        }
      } catch {
        // noop
      }
    })();
    return () => {
      active = false;
    };
  }, [locale, ns]);

  const t = useMemo(() => {
    return (key: string, opts?: { count?: number } & Record<string, unknown>) => {
      if (dict === null) return "";
      const d = dict;
      const { count, ...rest } = opts || {};
      let k = key;
      if (typeof count === "number") {
        if (count !== 1 && d[`${key}_plural`]) {
          k = `${key}_plural`;
        }
        return interpolate(d[k] ?? key, { count, ...rest });
      }
      return interpolate(d[k] ?? key, rest);
    };
  }, [dict]);

  return { t, locale };
}
