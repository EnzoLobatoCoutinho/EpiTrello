import { promises as fs } from "fs";
import path from "path";

type Dict = Record<string, string>;

function interpolate(template: string, vars?: Record<string, unknown>) {
  if (!vars) return template;
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : ""
  );
}

export async function getServerT(locale: string, ns: string = "common") {
  const filePath = path.join(
    process.cwd(),
    "public",
    "locales",
    locale,
    `${ns}.json`
  );
  const raw = await fs.readFile(filePath, "utf-8");
  const dict = JSON.parse(raw) as Dict;

  return (key: string, opts?: { count?: number } & Record<string, unknown>) => {
    const { count, ...rest } = opts || {};
    let k = key;

    if (typeof count === "number") {
      if (count !== 1 && dict[`${key}_plural`]) {
        k = `${key}_plural`;
      }
      return interpolate(dict[k] ?? key, { count, ...rest });
    }

    return interpolate(dict[k] ?? key, rest);
  };
}