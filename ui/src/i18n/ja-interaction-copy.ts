import { ja } from "./ja";

const BIND_SUMMARY = /^Bind (.+) to (.+) as (\S+)$/;
const BIND_PROMPT = /^Bind secret (.+) to (.+) as (\S+)\?$/;

/** 配信済みの英語カードも、画面では日本語にする。 */
export function jaInteractionText(text: string | null | undefined): string {
  if (!text) return "";
  const prompt = BIND_PROMPT.exec(text);
  if (prompt) {
    const [, secret, agent, path] = prompt;
    return `シークレット「${secret}」を ${agent} の ${path} に紐づけますか？`;
  }
  const summary = BIND_SUMMARY.exec(text);
  if (summary) {
    const [, secret, agent, path] = summary;
    return `「${secret}」を ${agent} の ${path} に紐づけます`;
  }
  return ja(text);
}

export function jaCompactDuration(label: string): string {
  return label
    .replace(/^(\d+(?:\.\d+)?)s$/, "$1秒")
    .replace(/^(\d+)m (\d+)s$/, "$1分$2秒")
    .replace(/^(\d+)m$/, "$1分");
}

export function jaWorkedFor(duration: string | null | undefined, failed = false): string {
  if (!duration) return failed ? "停止しました" : "作業しました";
  const elapsed = jaCompactDuration(duration);
  return failed ? `${elapsed}後に停止しました` : `${elapsed}作業しました`;
}

export function jaWorkingFor(duration: string | null | undefined): string {
  if (!duration) return "作業中";
  return `${jaCompactDuration(duration)}作業中`;
}
