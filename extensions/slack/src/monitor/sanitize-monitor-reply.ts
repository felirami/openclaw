import { resolveSendableOutboundReplyParts } from "openclaw/plugin-sdk/reply-payload";
import type { ReplyPayload } from "openclaw/plugin-sdk/reply-runtime";
import { sanitizeAssistantVisibleText } from "openclaw/plugin-sdk/text-chunking";

// Native streams, direct monitor replies, and draft previews never pass through
// Slack's generic outbound sanitizeText adapter. Strip here or Exec-failed traces
// leak as a follow-up message after a successful answer.
export function sanitizeSlackMonitorReplyPayload(payload: ReplyPayload): ReplyPayload | null {
  if (payload.isReasoning === true) {
    return null;
  }
  if (typeof payload.text !== "string") {
    return payload;
  }
  const text = sanitizeAssistantVisibleText(payload.text);
  if (text === payload.text) {
    return payload;
  }
  const nextPayload = { ...payload, text: text || undefined };
  if (
    !text &&
    !resolveSendableOutboundReplyParts(nextPayload).hasMedia &&
    !nextPayload.presentation &&
    !nextPayload.interactive
  ) {
    return null;
  }
  return nextPayload;
}

export function sanitizeSlackMonitorDraftPartialText(text: string | undefined): string | undefined {
  if (!text) {
    return text;
  }
  return sanitizeAssistantVisibleText(text) || undefined;
}
