// Real outbound email delivery.
//
// Two providers are supported, tried in this order:
//   1. Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD) — free, sends from your
//      own Gmail account via an App Password. No domain or billing needed.
//      Subject to Gmail's own sending limits (~500/day on a normal account)
//      and its spam heuristics; use responsibly and in moderation.
//   2. Resend (RESEND_API_KEY + RESEND_FROM_EMAIL) — needs a verified
//      sending domain for delivery to arbitrary recipients; sandbox mode
//      only delivers to your own verified address.
//
// If neither is configured, sending is skipped and callers are told so
// explicitly rather than silently pretending to succeed.

import nodemailer from 'nodemailer';

interface SendEmailResult {
  success: boolean;
  provider_message_id?: string;
  error?: string;
  provider?: 'gmail' | 'resend';
}

let gmailTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getGmailTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  if (!gmailTransporter) {
    gmailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }
  return gmailTransporter;
}

async function sendViaGmail(params: {
  to: string;
  subject: string;
  body: string;
  companyName: string;
}): Promise<SendEmailResult> {
  const transporter = getGmailTransporter();
  const user = process.env.GMAIL_USER;
  if (!transporter || !user) {
    return { success: false, error: 'Gmail SMTP not configured', provider: 'gmail' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Voxline AI" <${user}>`,
      to: params.to,
      subject: params.subject,
      text: params.body,
      html: params.body
        .split('\n')
        .map((line) => `<p>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
        .join('')
    });
    return { success: true, provider_message_id: info.messageId, provider: 'gmail' };
  } catch (err: any) {
    console.error('Gmail SMTP send error:', err.message || err);
    return { success: false, error: err.message || 'Unknown Gmail SMTP error', provider: 'gmail' };
  }
}

async function sendViaResend(params: {
  to: string;
  subject: string;
  body: string;
  companyName: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return { success: false, error: 'Resend not configured', provider: 'resend' };
  }

  const htmlBody = params.body
    .split('\n')
    .map((line) => `<p>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
    .join('');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [params.to],
        subject: params.subject,
        html: htmlBody,
        text: params.body
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend send error:', data);
      return { success: false, error: data.message || `Resend HTTP ${res.status}`, provider: 'resend' };
    }

    return { success: true, provider_message_id: data.id, provider: 'resend' };
  } catch (err: any) {
    console.error('Email send exception:', err);
    return { success: false, error: err.message || 'Unknown email send error', provider: 'resend' };
  }
}

export async function sendOutboundEmail(params: {
  to: string;
  subject: string;
  body: string;
  companyName: string;
}): Promise<SendEmailResult> {
  if (!params.to) {
    return { success: false, error: 'Recipient has no email address on file' };
  }

  // Prefer Gmail SMTP when configured — it's the free, no-domain-required path.
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return sendViaGmail(params);
  }

  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    return sendViaResend(params);
  }

  console.warn('No email provider configured (GMAIL_USER/GMAIL_APP_PASSWORD or RESEND_API_KEY/RESEND_FROM_EMAIL) — email not actually sent.');
  return { success: false, error: 'Email provider not configured' };
}
