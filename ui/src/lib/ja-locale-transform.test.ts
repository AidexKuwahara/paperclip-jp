import { describe, expect, it } from "vitest";
import { JA_LOCALE_IMPORT, isUserFacingCopy, rewriteJapaneseLocale } from "./ja-locale-transform";

function rewritten(source: string) {
  return rewriteJapaneseLocale(source).code;
}

describe("rewriteJapaneseLocale", () => {
  it("日本語化する JSX テキストとラベルだけを包む", () => {
    const code = rewritten(`export function View() {
  return <div label="Tasks" className="text-sm" aria-label="Resize sidebar">New Task</div>;
}
`);
    expect(code).toContain(JA_LOCALE_IMPORT);
    expect(code).toContain('label={__pcJa("Tasks")}');
    expect(code).toContain('aria-label={__pcJa("Resize sidebar")}');
    expect(code).toContain('{__pcJa("New Task")}');
    expect(code).toContain('className="text-sm"');
  });

  it("型引数と比較はそのまま残す", () => {
    const source = `export const load = (): Promise<void> => Promise.resolve();
const smaller = (a: number, b: number) => a < b;
type Status = "Open" | "Closed";
interface Tab { label: "General"; }
`;
    expect(rewritten(source)).toBe(source);
  });

  it("表示用のオブジェクト文言は包み、比較と識別子は残す", () => {
    const code = rewritten(`export const tabs = { label: "General", id: "general" };
export function Banner({ status }: { status: string }) {
  return <p>{status === "open" ? "Open" : "Closed"}</p>;
}
`);
    expect(code).toContain('label: __pcJa("General")');
    expect(code).toContain('id: "general"');
    expect(code).toContain('status === "open"');
    expect(code).toContain('? __pcJa("Open")');
    expect(code).toContain(': __pcJa("Closed")');
  });

  it("コメントと文字列中のマークアップは変換しない", () => {
    const source = `// <div>Hello</div>
const example = "<div>Hello</div>";
export const View = () => <span>{/* Hello */}</span>;
`;
    const code = rewritten(source);
    expect(code).toContain("// <div>Hello</div>");
    expect(code).toContain('const example = "<div>Hello</div>"');
    expect(code).not.toContain("__pcJa");
  });

  it("三項演算子の JSX を閉じ括弧ごと残す", () => {
    const code = rewritten(`export function View({ flag }: { flag: boolean }) {
  return (
    <section>
      {flag ? (
        <div>
          <p>Hello</p>
        </div>
      ) : null}
    </section>
  );
}
`);
    expect(code).toContain("{__pcJa(\"Hello\")}");
    expect(code).toContain(") : null}");
    expect(code).not.toContain("__pcJa(\") : null}\")");
  });

  it("空状態の message と、配列に並んだ説明文を包む", () => {
    const code = rewritten(`export function View() {
  const ideas = ["Research a topic and summarize the key findings", "in_progress"];
  return <Empty message="Create your first agent to get started." className="py-10" />;
}
`);
    expect(code).toContain('message={__pcJa("Create your first agent to get started.")}');
    expect(code).toContain('__pcJa("Research a topic and summarize the key findings")');
    expect(code).toContain('"in_progress"');
    expect(code).toContain('className="py-10"');
    const actions = rewritten(`export function View() {
  return <div><button action="Get Started" /><p action="load your settings" /></div>;
}
`);
    expect(actions).toContain('action={__pcJa("Get Started")}');
    expect(actions).toContain('action="load your settings"');
  });

  it("ブランド名と短い機械トークンは変換しない", () => {
    expect(isUserFacingCopy("Paperclip")).toBe(false);
    expect(isUserFacingCopy("sm")).toBe(false);
    expect(isUserFacingCopy("in_progress")).toBe(false);
    expect(isUserFacingCopy("Cancel")).toBe(true);
    expect(isUserFacingCopy("cancel")).toBe(true);
  });
});
