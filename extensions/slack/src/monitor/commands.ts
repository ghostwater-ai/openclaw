import type { SlackSlashCommandConfig } from "openclaw/plugin-sdk/config-runtime";
import { normalizeOptionalString } from "openclaw/plugin-sdk/text-runtime";

export type ResolvedSlackSlashCommandConfig = Omit<
  Required<SlackSlashCommandConfig>,
  "nativePrefix"
> & {
  nativePrefix?: string;
};

/**
 * Strip Slack mentions (<@U123>, <@U123|name>) so command detection works on
 * normalized text. Use in both prepare and debounce gate for consistency.
 */
export function stripSlackMentionsForCommandDetection(text: string): string {
  return (text ?? "")
    .replace(/<@[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSlackSlashCommandName(raw: string) {
  return raw.replace(/^\/+/, "");
}

export function resolveSlackSlashCommandConfig(
  raw?: SlackSlashCommandConfig,
): ResolvedSlackSlashCommandConfig {
  const normalizedName = normalizeSlackSlashCommandName(
    normalizeOptionalString(raw?.name) ?? "openclaw",
  );
  const name = normalizedName || "openclaw";
  const nativePrefix = normalizeOptionalString(raw?.nativePrefix);
  return {
    enabled: raw?.enabled === true,
    name,
    nativePrefix: nativePrefix || undefined,
    sessionPrefix: normalizeOptionalString(raw?.sessionPrefix) ?? "slack:slash",
    ephemeral: raw?.ephemeral !== false,
  };
}

export function buildSlackSlashCommandMatcher(name: string) {
  const normalized = normalizeSlackSlashCommandName(name);
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^/?${escaped}$`);
}
