import { useCallback } from "react";
import { useSettings } from "@/src/context/SettingsContext";
import { DICTS, Lang, LANGUAGES, TR } from "./translations";

export { LANGUAGES };
export type { Lang };

export function useI18n() {
  const { language, update } = useSettings();
  const lang = (language || "tr") as Lang;

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = DICTS[lang] || TR;
      let str = dict[key] ?? TR[key] ?? key;
      if (vars) {
        for (const k of Object.keys(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
        }
      }
      return str;
    },
    [lang],
  );

  const setLang = useCallback((l: Lang) => update({ language: l }), [update]);

  return { t, lang, setLang };
}
