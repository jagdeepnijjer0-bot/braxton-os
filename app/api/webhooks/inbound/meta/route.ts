import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookChallenge, verifyMetaSignature } from "@/lib/meta/verify";
import { processMetaWebhook, type MetaWebhookPayload } from "@/lib/meta/processor";

/**
 * GET /api/webhooks/inbound/meta
 *
 * Meta webhook verification challenge.
 * Configure this URL in: Meta Developer Console → App → Webhooks → Callback URL
 *
 * Meta will send:  ?hub.mode=subscribe&hub.verify_token=XXX&hub.challenge=YYY
 * We respond with the challenge string if the token matches META_WEBHOOK_VERIFY_TOKEN.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const valid = verifyWebhookChallenge(mode, token, challenge);
  if (!valid) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Respond with the challenge as plain text — Meta requires this exact format
  return new NextResponse(valid, { status: 200, headers: { "Content-Type": "text/plain" } });
}

/**
 * POST /api/webhooks/inbound/meta
 *
 * Receives Instagram and Facebook webhook events from Meta.
 * Handles: Instagram DMs, Facebook Messenger, Facebook Lead Ads.
 *
 * Security: validates X-Hub-Signature-256 header using META_APP_SECRET.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig     = req.headers.get("x-hub-signature-256") ?? "";

  if (!verifyMetaSignature(rawBody, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Meta requires a fast 200 OK — process asynchronously in the background
  // In production with Edge runtime you'd use a queue; for now we await inline
  // since Vercel gives us up to 60s on serverless functions.
  try {
    const result = await processMetaWebhook(payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[meta-webhook] processing error:", err);
    // Still return 200 so Meta doesn't retry indefinitely
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
