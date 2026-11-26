/**
 * 画面に出る文字列リテラルを `__pcJa("...")` に差し替える。
 * TypeScript の構文木を使うので、型・比較・モジュール指定子は対象にしない。
 * テスト実行時は Vite プラグイン側でこの変換を掛けない。
 */
// TypeScript 7 の公開入口は版番号だけで、構文木 API は無い。画面文言の変換だけ 5 系を使う。
import ts from "typescript-legacy";

const HELPER = "__pcJa";
export const JA_LOCALE_IMPORT = `import { ja as ${HELPER} } from "@/i18n/ja";`;

const JSX_ATTRS = new Set([
  "label", "title", "placeholder", "description", "aria-label", "aria-description", "alt",
  "tooltip", "heading", "subtitle", "helperText", "hint", "emptyText", "emptyTitle",
  "emptyDescription", "confirmText", "cancelText", "submitLabel", "badgeLabel", "textBadge",
  "dialogTitle", "dialogDescription", "buttonText", "actionLabel", "primaryLabel",
  "secondaryLabel", "caption", "summary", "header", "emptyLabel", "emptyMessage",
  "errorMessage", "successMessage", "confirmLabel", "cancelLabel", "srLabel",
]);

const OBJECT_PROPS = new Set([
  "label", "title", "placeholder", "description", "heading", "subtitle", "helperText", "hint",
  "emptyText", "emptyTitle", "emptyDescription", "confirmText", "cancelText", "submitLabel",
  "badgeLabel", "textBadge", "tooltip", "ariaLabel", "buttonText", "actionLabel", "dialogTitle",
  "dialogDescription", "primaryLabel", "secondaryLabel", "caption", "summary", "header",
  "emptyLabel", "emptyMessage", "errorMessage", "successMessage", "confirmLabel", "cancelLabel",
  "srLabel",
]);

const UI_CALLEES = new Set(["toast", "alert", "confirm"]);
const TOAST_METHODS = new Set(["success", "error", "info", "warning", "message", "loading", "promise"]);

const LOWER_WORDS = new Set([
  "active", "add", "all", "apply", "approve", "archive", "archived", "back", "beta", "cancel",
  "clear", "close", "collapse", "confirm", "continue", "copy", "copied", "create", "custom",
  "default", "delete", "details", "disable", "dismiss", "done", "edit", "enable", "error",
  "expand", "failed", "general", "hide", "history", "inbox", "invite", "leave", "loading",
  "logs", "more", "name", "never", "new", "next", "none", "off", "ok", "on", "open", "optional",
  "overview", "pause", "paused", "pending", "preview", "refresh", "reject", "remove", "required",
  "reset", "restore", "results", "resume", "retry", "running", "save", "saved", "search",
  "select", "selected", "settings", "show", "start", "status", "stop", "submit", "success",
  "summary", "today", "tomorrow", "type", "undo", "unknown", "update", "view", "warning",
  "yesterday", "yes", "no",
]);

const BRANDS = new Set([
  "API", "AWS", "Azure", "CI", "CLI", "CSS", "CSV", "HTML", "HTTP", "HTTPS", "ID", "JSON", "MCP",
  "PDF", "PR", "SDK", "SQL", "SSH", "URL", "YAML", "Anthropic", "Claude", "Codex", "Cursor",
  "Discord", "Gemini", "GitHub", "GitLab", "Grok", "Hermes", "Jira", "Kimi", "Linear", "Notion",
  "OpenAI", "OpenClaw", "OpenCode", "Paperclip", "Slack", "Telegram",
]);

const SIZE_TOKENS = new Set(["xs", "sm", "md", "lg", "xl", "2xl", "3xl"]);

type Edit = { start: number; end: number; text: string };

export type JapaneseLocaleRewrite = { code: string; strings: string[] };

export function rewriteJapaneseLocale(source: string, fileName = "component.tsx"): JapaneseLocaleRewrite {
  const scriptKind = fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, scriptKind);
  const edits: Edit[] = [];
  const strings: string[] = [];

  const push = (start: number, end: number, value: string, wrap: "jsx" | "expr") => {
    const call = `${HELPER}(${JSON.stringify(value)})`;
    strings.push(value);
    edits.push({ start, end, text: wrap === "jsx" ? `{${call}}` : call });
  };

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      const raw = node.getText(sourceFile);
      const leading = raw.match(/^\s*/)?.[0].length ?? 0;
      const trailing = raw.match(/\s*$/)?.[0].length ?? 0;
      if (leading + trailing < raw.length) {
        const normalized = decodeEntities(raw.slice(leading, raw.length - trailing).replace(/\s*\n\s*/g, " ").trim());
        if (isUserFacingCopy(normalized)) {
          push(node.getStart(sourceFile) + leading, node.getEnd() - trailing, normalized, "jsx");
        }
      }
      return;
    }

    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const mode = classifyString(node);
      if (mode && isUserFacingCopy(node.text)) push(node.getStart(sourceFile), node.getEnd(), node.text, mode);
      return;
    }

    ts.forEachChild(node, visit);
  };

  const classifyString = (node: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral): "jsx" | "expr" | null => {
    const owner = outermostExpression(node);
    const parent = owner.parent;
    if (!parent) return null;
    if (ts.isJsxAttribute(parent)) {
      return JSX_ATTRS.has(jsxAttributeName(parent)) ? "jsx" : null;
    }
    if (isUiPropertyAssignment(parent)) return "expr";
    if (isUiCallArgument(owner)) return "expr";
    if (ts.isJsxExpression(parent)) {
      const host = parent.parent;
      if (ts.isJsxAttribute(host)) return JSX_ATTRS.has(jsxAttributeName(host)) ? "expr" : null;
      if (ts.isJsxElement(host) || ts.isJsxFragment(host) || ts.isJsxSelfClosingElement(host)) return "expr";
    }
    return null;
  };

  visit(sourceFile);
  if (edits.length === 0) return { code: source, strings };

  let code = applyEdits(source, edits);
  if (!code.includes(JA_LOCALE_IMPORT)) {
    const directive = code.match(/^\s*['"]use client['"];?\s*\n/);
    const at = directive ? directive[0].length : 0;
    code = `${code.slice(0, at)}${JA_LOCALE_IMPORT}\n${code.slice(at)}`;
  }
  return { code, strings };
}

function outermostExpression(node: ts.Node): ts.Node {
  let current = node;
  while (current.parent && isTransparentParent(current.parent, current)) current = current.parent;
  return current;
}

function isTransparentParent(parent: ts.Node, child: ts.Node): boolean {
  if (ts.isParenthesizedExpression(parent) || ts.isAsExpression(parent) || ts.isSatisfiesExpression(parent)) {
    return parent.expression === child;
  }
  if (ts.isConditionalExpression(parent)) return parent.whenTrue === child || parent.whenFalse === child;
  if (!ts.isBinaryExpression(parent)) return false;
  const kind = parent.operatorToken.kind;
  const chain = kind === ts.SyntaxKind.AmpersandAmpersandToken || kind === ts.SyntaxKind.BarBarToken;
  return chain && (parent.left === child || parent.right === child);
}

function jsxAttributeName(node: ts.JsxAttribute): string {
  return ts.isIdentifier(node.name) ? node.name.text : node.name.getText();
}

function isUiPropertyAssignment(node: ts.Node): boolean {
  return ts.isPropertyAssignment(node)
    && ts.isIdentifier(node.name)
    && OBJECT_PROPS.has(node.name.text);
}

function isUiCallArgument(node: ts.Node): boolean {
  const parent = node.parent;
  if (!parent || !ts.isCallExpression(parent) || parent.arguments[0] !== node) return false;
  const callee = parent.expression;
  if (ts.isIdentifier(callee)) return UI_CALLEES.has(callee.text) && callee.text !== HELPER;
  if (!ts.isPropertyAccessExpression(callee) || !TOAST_METHODS.has(callee.name.text)) return false;
  return ts.isIdentifier(callee.expression) && callee.expression.text === "toast";
}

export function isUserFacingCopy(value: string): boolean {
  const text = value.trim();
  if (!text || BRANDS.has(text) || SIZE_TOKENS.has(text)) return false;
  if (!/[A-Za-z]/.test(text)) return false;
  if (text.length > 500) return false;
  if (/^(https?:|\/|\.\/|@|#)/.test(text)) return false;
  if (/[<>{}]|=>|\bfunction\b|\bimport\b|\bexport\b|\bconst\b|\bclassName\b|^\s*[);]/.test(text)) return false;
  if (/^[a-z0-9_./:-]+$/.test(text)) {
    if (text.includes("_") || text.includes("/") || text.includes(".") || text.includes(":") || text.includes("-")) return false;
    return LOWER_WORDS.has(text);
  }
  if (/^[A-Z0-9]{2,6}$/.test(text) && text !== "OK") return false;
  return true;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function applyEdits(source: string, edits: Edit[]): string {
  const ordered = [...edits].sort((a, b) => b.start - a.start || b.end - a.end);
  let code = source;
  let lastStart = Number.POSITIVE_INFINITY;
  for (const edit of ordered) {
    if (edit.end > lastStart) continue;
    code = `${code.slice(0, edit.start)}${edit.text}${code.slice(edit.end)}`;
    lastStart = edit.start;
  }
  return code;
}
