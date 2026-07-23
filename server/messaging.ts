import { getDb, addAuditLog, saveDatabaseToDisk } from './db.js';
import { sendOutboundEmail } from './email.js';

export async function sendMessageById(messageId: string): Promise<{ ok: boolean; status: number; body: any }> {
  const db = getDb();
  const msg = db.messages.find((m) => m.id === messageId);
  if (!msg) return { ok: false, status: 404, body: { error: 'Message not found' } };

  const autonomous = process.env.AUTONOMOUS_MODE === 'true';

  if (msg.status !== 'approved' && msg.status !== 'pending_approval') {
    return { ok: false, status: 400, body: { error: `Message cannot be sent from status '${msg.status}'` } };
  }
  if (msg.status === 'pending_approval' && !autonomous) {
    return { ok: false, status: 403, body: { error: 'Message requires human approval before sending. Approve it first, or enable AUTONOMOUS_MODE.' } };
  }

  const conv = db.conversations.find((c) => c.id === msg.conversation_id);
  const comp = conv ? db.companies.find((c) => c.id === conv.company_id) : null;

  let deliveryResult: { success: boolean; error?: string; provider_message_id?: string } = {
    success: false,
    error: 'No delivery channel available'
  };

  if (comp && conv && conv.channel === 'email') {
    deliveryResult = await sendOutboundEmail({
      to: comp.email,
      subject: `Voxline AI — Partnership Proposal for ${comp.name}`,
      body: msg.body,
      companyName: comp.name
    });
  }

  if (deliveryResult.success) {
    msg.status = 'sent';
    msg.sent_at = new Date().toISOString();
    if (comp) {
      comp.pipeline_stage = 'contacted';
      comp.status = 'contacted';
      comp.updated_at = new Date().toISOString();
    }
    addAuditLog('messages', msg.id, 'UPDATE', null, { status: 'sent', provider_message_id: deliveryResult.provider_message_id });
    saveDatabaseToDisk();
    return { ok: true, status: 200, body: { message: msg, delivery: deliveryResult } };
  }

  msg.status = 'failed';
  addAuditLog('messages', msg.id, 'UPDATE', null, { status: 'failed', error: deliveryResult.error });
  saveDatabaseToDisk();
  return { ok: false, status: 502, body: { error: deliveryResult.error || 'Delivery failed', message: msg } };
}
