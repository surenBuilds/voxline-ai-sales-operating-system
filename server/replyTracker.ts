// Closed-loop reply tracking.
//
// Polls the same Gmail inbox we send from (via IMAP + the same App Password
// used for SMTP sending — no extra credentials needed), matches incoming
// mail to a known company by sender address, records it as an inbound
// message, and runs it through an AI classifier that:
//   - tags the reply's sentiment,
//   - writes a memory entry (rejection reason, preference, decision, etc.)
//     that future outreach drafts will read back in,
//   - proposes a concrete next step for the sales rep.
//
// Only runs when GMAIL_USER + GMAIL_APP_PASSWORD are configured. Free —
// IMAP access is included with every Gmail account.

import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { getDb, addAuditLog, saveDatabaseToDisk } from './db.js';
import { runReplyAnalysisAI } from './ai.js';
import { addSalesMemory, buildMemoryContext } from './salesMemory.js';
import { Conversation, Message } from '../src/types/index.js';

// Gate reply-classification AI calls through the same daily/per-minute
// budget used for research + drafting, imported lazily to avoid a circular
// import at module-load time.
async function reserveAISlotSafe(): Promise<boolean> {
  try {
    const brain = await import('./brain.js');
    return await (brain as any).reserveAISlot?.();
  } catch {
    return true; // If the gate isn't reachable for some reason, don't block reply tracking entirely.
  }
}

let isChecking = false;

export async function checkForReplies(): Promise<{ checked: number; matched: number }> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return { checked: 0, matched: 0 };

  if (isChecking) return { checked: 0, matched: 0 }; // avoid overlapping polls
  isChecking = true;

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false
  });

  let checked = 0;
  let matched = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      // Only look at unseen messages — each one gets marked seen once processed,
      // so re-running this on a timer never reprocesses the same email twice.
      const uids = await client.search({ seen: false });
      if (!uids || uids.length === 0) return { checked: 0, matched: 0 };

      const db = getDb();

      for (const uid of uids) {
        checked++;
        try {
          const { content } = await client.download(String(uid), undefined, { uid: true });
          const parsed = await simpleParser(content as any);
          const fromAddress = (parsed.from?.value?.[0]?.address || '').toLowerCase().trim();
          const subject = parsed.subject || '(no subject)';
          const text = (parsed.text || parsed.html || '').toString().trim();

          if (!fromAddress) {
            await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
            continue;
          }

          const company = db.companies.find((c) => (c.email || '').toLowerCase().trim() === fromAddress);
          if (!company) {
            // Not from a company we contacted — leave it alone for the human inbox,
            // just mark it seen so we don't keep re-checking it.
            await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
            continue;
          }

          matched++;

          let conversation = db.conversations.find((c) => c.company_id === company.id && c.channel === 'email');
          if (!conversation) {
            conversation = {
              id: 'conv-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
              company_id: company.id,
              channel: 'email',
              status: 'active',
              requires_human_approval: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as Conversation;
            db.conversations.unshift(conversation);
          }

          const inboundMessage: Message = {
            id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            conversation_id: conversation.id,
            direction: 'inbound',
            sender: fromAddress,
            body: text || subject,
            status: 'delivered',
            ai_generated: false,
            language: 'am'
          };
          db.messages.unshift(inboundMessage);
          addAuditLog('messages', inboundMessage.id, 'INSERT', null, inboundMessage);

          company.pipeline_stage = 'replied';
          company.last_reply_at = new Date().toISOString();
          company.updated_at = new Date().toISOString();
          conversation.updated_at = new Date().toISOString();
          saveDatabaseToDisk();

          // Classify the reply with AI (sentiment + memory + next step), staying
          // within the shared daily/per-minute AI budget.
          if (text && (await reserveAISlotSafe())) {
            const priorContext = buildMemoryContext(company.id);
            const analysis = await runReplyAnalysisAI(company.name, company.industry, text, priorContext);

            company.reply_sentiment = analysis.sentiment;
            company.next_step_suggestion = analysis.next_step;
            company.next_step_updated_at = new Date().toISOString();

            addSalesMemory({
              company_id: company.id,
              memory_type: analysis.memory_type,
              content: analysis.memory_content
            });

            saveDatabaseToDisk();
            console.log(`[replyTracker] ${company.name}: sentiment=${analysis.sentiment}, next_step="${analysis.next_step}"`);
          }

          await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
        } catch (err: any) {
          console.error('[replyTracker] Error processing one message:', err.message || err);
        }
      }
    } finally {
      lock.release();
    }
  } catch (err: any) {
    console.error('[replyTracker] IMAP check failed:', {
      message: err.message,
      code: err.code,
      authenticationFailed: err.authenticationFailed,
      responseText: err.responseText,
      response: err.response
    });
  } finally {
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
    isChecking = false;
  }

  return { checked, matched };
}
