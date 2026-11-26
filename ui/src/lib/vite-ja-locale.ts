import path from "node:path";
import type { Plugin } from "vite";
import { rewriteJapaneseLocale } from "./ja-locale-transform";

const UI_ROOTS = [`${path.sep}ui${path.sep}src${path.sep}`, `${path.sep}ui${path.sep}storybook${path.sep}`];

/**
 * 開発サーバと本番ビルドの画面文言を日本語にする。
 * Vitest はソースの英語のまま実行する。`PAPERCLIP_LOCALE=en` で英語に戻せる。
 */
export function japaneseLocalePlugin(): Plugin {
  return {
    name: "paperclip-japanese-locale",
    enforce: "pre",
    transform(code, id) {
      if (process.env.VITEST || process.env.PAPERCLIP_LOCALE === "en") return null;
      const file = id.split("?")[0];
      if (!file.endsWith(".ts") && !file.endsWith(".tsx")) return null;
      if (!UI_ROOTS.some((root) => file.includes(root))) return null;
      if (file.includes(`${path.sep}i18n${path.sep}`)) return null;
      if (file.includes(".test.") || file.includes(".spec.") || file.endsWith("ja-locale-transform.ts")) return null;
      const result = rewriteJapaneseLocale(code, file);
      if (result.code === code) return null;
      return { code: result.code, map: null };
    },
  };
}
