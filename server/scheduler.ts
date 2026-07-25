import { getDb } from './db.js';
import { VoxlineBrain } from './brain.js';
import { sendMessageById } from './messaging.js';
import { checkForReplies } from './replyTracker.js';

// --- Configuration (all via environment variables, so behavior is controlled
//     from hosting/deployment settings, not by editing code) ---
//
// AUTO_DISCOVERY_INDUSTRIES   comma-separated list, e.g. "Healthcare,Hospitality,Retail"
// AUTO_DISCOVERY_REGION       e.g. "Yerevan" (default)
// AUTO_DISCOVERY_INTERVAL_MIN how often (minutes) to run Scout Agent — default 60
// AUTONOMOUS_MODE             "true" to auto-approve + send outreach without human review
// AUTONOMOUS_SEND_INTERVAL_MIN how often (minutes) to flush pending outreach — default 15

function getIndustries(): string[] {
  const raw = process.env.AUTO_DISCOVERY_INDUSTRIES || '';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

async function runDiscoveryTick() {
  const industries = getIndustries();
  if (industries.length === 0) return; // Not configured — scheduler stays idle for discovery

  const region = process.env.AUTO_DISCOVERY_REGION || 'Yerevan';
  // Space out requests between industries — OpenStreetMap's Overpass API
  // rate-limits back-to-back requests (seen as HTTP 429 in logs), and this
  // also naturally paces any Gemini AI fallback calls.
  const betweenIndustriesMs = Math.max(1000, Number(process.env.DISCOVERY_INDUSTRY_DELAY_MS) || 8000);

  for (const industry of industries) {
    try {
      const result = await VoxlineBrain.runScoutAgent(industry, region);
      console.log(`[scheduler] Scout Agent (${industry}/${region}) discovered ${result.new_companies.length} new companies`);
    } catch (err: any) {
      console.error(`[scheduler] Scout Agent failed for ${industry}/${region}:`, err.message || err);
    }
    await new Promise((r) => setTimeout(r, betweenIndustriesMs));
  }
}

async function runAutonomousSendTick() {
  if (process.env.AUTONOMOUS_MODE !== 'true') return; // Safety default: do nothing unless explicitly enabled

  const db = getDb();
  const pending = db.messages.filter((m) => m.status === 'pending_approval');

  for (const msg of pending) {
    try {
      const result = await sendMessageById(msg.id);
      if (result.ok) {
        console.log(`[scheduler] Autonomously sent message ${msg.id}`);
      } else {
        console.warn(`[scheduler] Could not send message ${msg.id}:`, result.body.error);
      }
    } catch (err: any) {
      console.error(`[scheduler] Error sending message ${msg.id}:`, err.message || err);
    }
  }
}

async function runReplyCheckTick() {
  try {
    const { checked, matched } = await checkForReplies();
    if (checked > 0) {
      console.log(`[scheduler] Reply check: ${checked} new message(s) in inbox, ${matched} matched to known companies.`);
    }
  } catch (err: any) {
    console.error('[scheduler] Reply check failed:', err.message || err);
  }
}

export function startAutonomousScheduler() {
  const discoveryIntervalMs = Math.max(5, Number(process.env.AUTO_DISCOVERY_INTERVAL_MIN) || 60) * 60 * 1000;
  const sendIntervalMs = Math.max(1, Number(process.env.AUTONOMOUS_SEND_INTERVAL_MIN) || 15) * 60 * 1000;

  const industries = getIndustries();
  const autonomous = process.env.AUTONOMOUS_MODE === 'true';

  const replyTrackingEnabled = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  console.log(
    `[scheduler] Starting. Discovery: ${industries.length ? industries.join(', ') : 'DISABLED (set AUTO_DISCOVERY_INDUSTRIES)'} ` +
    `every ${discoveryIntervalMs / 60000}min. Autonomous send: ${autonomous ? 'ENABLED' : 'DISABLED (manual approval required)'}. ` +
    `Reply tracking: ${replyTrackingEnabled ? 'ENABLED (IMAP)' : 'DISABLED (set GMAIL_USER/GMAIL_APP_PASSWORD)'}.`
  );

  // Run once shortly after boot, then on the configured interval
  setTimeout(runDiscoveryTick, 15000);
  setInterval(runDiscoveryTick, discoveryIntervalMs);

  setTimeout(runAutonomousSendTick, 30000);
  setInterval(runAutonomousSendTick, sendIntervalMs);

  const replyCheckIntervalMs = Math.max(1, Number(process.env.REPLY_CHECK_INTERVAL_MIN) || 5) * 60 * 1000;
  setTimeout(runReplyCheckTick, 20000);
  setInterval(runReplyCheckTick, replyCheckIntervalMs);
}
