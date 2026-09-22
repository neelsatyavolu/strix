import "server-only";
import { bundledModels, loadModels, selectModels } from "@neelsatyavolu/shared-ai-auth";

// Add model IDs here only when Strix should hide them. New IDs show by default.
const HIDDEN_MODELS = { codex: [] as string[], grok: [] as string[] };
let cached = bundledModels;
let refreshAt = 0;

export async function aiModels() {
  if (Date.now() >= refreshAt) {
    cached = await loadModels({ fallback: cached });
    refreshAt = Date.now() + 5 * 60_000;
  }
  return {
    chatgpt: selectModels(cached, "codex", HIDDEN_MODELS.codex).map((model) => ({ value: model.id, label: model.label })),
    grok: selectModels(cached, "grok", HIDDEN_MODELS.grok).map((model) => ({ value: model.id, label: model.label })),
  };
}
