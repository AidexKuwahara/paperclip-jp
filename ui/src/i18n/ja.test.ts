import { describe, expect, it } from "vitest";
import { ja } from "./ja";

describe("ja", () => {
  it("画面の定型句を日本語にし、辞書に無い文は原文のまま返す", () => {
    expect(ja("Cancel")).toBe("キャンセル");
    expect(ja("Tasks")).toBe("タスク");
    expect(ja("New Task")).toBe("新しいタスク");
    expect(ja("Research a topic and summarize the key findings")).toBe("テーマを調査して要点をまとめる");
    expect(ja("Create a step-by-step plan for a project")).toBe("プロジェクトの手順を作る");
    expect(ja("Review a document and suggest improvements")).toBe("文書をレビューして改善案を出す");
    expect(ja("Create your first agent to get started.")).toBe("始めるには、最初のエージェントを作成してください。");
    expect(ja("Introducing Connectors")).toBe("コネクタのご紹介");
    expect(ja("Give your agents the access they need")).toBe("エージェントに必要な接続を渡す");
    expect(ja("Explore connectors")).toBe("コネクタを見る");
    expect(ja("___not_in_the_dictionary___")).toBe("___not_in_the_dictionary___");
  });
});
