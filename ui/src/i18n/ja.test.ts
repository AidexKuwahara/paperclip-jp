import { describe, expect, it } from "vitest";
import { ja } from "./ja";

describe("ja", () => {
  it("画面の定型句を日本語にし、辞書に無い文は原文のまま返す", () => {
    expect(ja("Cancel")).toBe("キャンセル");
    expect(ja("Tasks")).toBe("タスク");
    expect(ja("New Task")).toBe("新しいタスク");
    expect(ja("___not_in_the_dictionary___")).toBe("___not_in_the_dictionary___");
  });
});
