import dictionary from "./ja-dictionary.json";

const table: Record<string, string> = dictionary;

/** 画面文言を日本語にする。辞書に無い文は英語のまま返す。 */
export function ja(text: string): string {
  return Object.prototype.hasOwnProperty.call(table, text) ? table[text] : text;
}
