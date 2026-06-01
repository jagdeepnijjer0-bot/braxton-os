import "server-only";

/**
 * Provider-agnostic integration event dispatcher.
 *
 * Extend this file to add Gmail, WhatsApp, Slack, or any other provider.
 * Each provider implements the IntegrationProvider interface and is enabled
 * via feature flags in process.env.
 *
 * Usage:
 *   import { sendIntegrationEvent } from "@/lib/integrations";
 *   await sendIntegrationEvent("lead.created", { name: "John", email: "..." });
 */

import { emit, type BraxtonEventName } from "@/lib/events/emit";

// ── Provider registry ─────────────────────────────────────────────────────────

export interface IntegrationProvider {
  name:     string;
  enabled:  () => boolean;
  dispatch: (event: BraxtonEventName, payload: Record<string, unknown>) => Promise<void>;
}

// ── Feature-flag helpers ──────────────────────────────────────────────────────

function envEnabled(key: string): boolean {
  return process.env[key] === "true";
}

// ── Registered providers ──────────────────────────────────────────────────────

const providers: IntegrationProvider[] = [
  // n8n — primary automation backbone (always registered; enabled flag lives in DB + env)
  {
    name:     "n8n",
    enabled:  () => true, // dispatcher checks its own enabled flag
    dispatch: async (event, payload) => {
      await emit(event, payload);
    },
  },

  // Gmail — placeholder; wire up when lib/integrations/gmail.ts is built
  {
    name:     "gmail",
    enabled:  () => envEnabled("GMAIL_INTEGRATION_ENABLED"),
    dispatch: async (_event, _payload) => {
      // TODO: import and call gmailDispatch(event, payload)
    },
  },

  // WhatsApp — placeholder; wire up when lib/integrations/whatsapp.ts is built
  {
    name:     "whatsapp",
    enabled:  () => envEnabled("WHATSAPP_INTEGRATION_ENABLED"),
    dispatch: async (_event, _payload) => {
      // TODO: import and call whatsappDispatch(event, payload)
    },
  },
];

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Dispatch an event to all enabled providers.
 * Individual provider failures are swallowed — they never propagate.
 */
export async function sendIntegrationEvent(
  event: BraxtonEventName,
  payload: Record<string, unknown>,
): Promise<void> {
  await Promise.allSettled(
    providers
      .filter(p => p.enabled())
      .map(p => p.dispatch(event, payload).catch(err => {
        console.warn(`[integrations] ${p.name} dispatch failed for ${event}:`, err);
      })),
  );
}

export { type BraxtonEventName };
