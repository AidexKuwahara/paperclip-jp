import { describe, expect, it } from "vitest";
import { ja } from "./ja";
import { jaInteractionText, jaWorkedFor, jaWorkingFor } from "./ja-interaction-copy";

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
    expect(ja("Confirm secret binding")).toBe("シークレットの紐づけを確認");
    expect(ja("Create binding")).toBe("紐づけを作成");
    expect(ja("___not_in_the_dictionary___")).toBe("___not_in_the_dictionary___");
  });

  it("シークレット紐づけの英語文と作業時間を日本語にする", () => {
    expect(jaInteractionText("Confirm secret binding")).toBe("シークレットの紐づけを確認");
    expect(jaInteractionText("Bind Inbox POP3 to メール担当 as env.MAIL_POP3_PASSWORD")).toBe(
      "「Inbox POP3」を メール担当 の env.MAIL_POP3_PASSWORD に紐づけます",
    );
    expect(jaInteractionText("Bind secret Inbox POP3 to メール担当 as env.MAIL_POP3_PASSWORD?")).toBe(
      "シークレット「Inbox POP3」を メール担当 の env.MAIL_POP3_PASSWORD に紐づけますか？",
    );
    expect(jaInteractionText("Create binding")).toBe("紐づけを作成");
    expect(jaInteractionText("Reject")).toBe("却下");
    expect(jaWorkedFor("16s")).toBe("16秒作業しました");
    expect(jaWorkingFor("16s")).toBe("16秒作業中");
    expect(jaWorkedFor("2m 5s", true)).toBe("2分5秒後に停止しました");
  });
});
