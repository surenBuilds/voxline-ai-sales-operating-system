// Real outbound email delivery.
//
// Three providers are supported, tried in this order:
//   1. Gmail API (GMAIL_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN) — free, sends
//      from your own Gmail account over HTTPS (port 443). This is the
//      preferred path on hosts like Railway that block outbound SMTP ports
//      (465/587) on free/hobby plans — the Gmail API sidesteps that
//      entirely since it's a normal HTTPS REST call, not raw SMTP.
//   2. Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD) — free, but requires
//      outbound SMTP ports to be open on the host. Kept as a fallback for
//      hosts that don't block them.
//   3. Resend (RESEND_API_KEY + RESEND_FROM_EMAIL) — needs a verified
//      sending domain for delivery to arbitrary recipients; sandbox mode
//      only delivers to your own verified address.
//
// If none are configured, sending is skipped and callers are told so
// explicitly rather than silently pretending to succeed.

import nodemailer from 'nodemailer';

interface SendEmailResult {
  success: boolean;
  provider_message_id?: string;
  error?: string;
  provider?: 'gmail_api' | 'gmail_smtp' | 'resend';
}

// --- Gmail API (HTTPS, OAuth2) ---

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getGmailAccessToken(): Promise<string | null> {
  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 30000) {
    return cachedAccessToken.token;
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Gmail OAuth token refresh failed: ${data.error_description || data.error || res.status}`);
  }
  cachedAccessToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
  return data.access_token;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendViaGmailApi(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<SendEmailResult> {
  const fromUser = process.env.GMAIL_USER || 'me';
  try {
    const accessToken = await getGmailAccessToken();
    if (!accessToken) {
      return { success: false, error: 'Gmail API not configured', provider: 'gmail_api' };
    }

    const rawMessage =
      `From: "Voxline AI" <${fromUser}>\r\n` +
      `To: ${params.to}\r\n` +
      `Subject: =?UTF-8?B?${Buffer.from(params.subject, 'utf-8').toString('base64')}?=\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: text/plain; charset="UTF-8"\r\n\r\n` +
      params.body;

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: base64UrlEncode(rawMessage) })
    });
    const data = await res.json();

    if (!res.ok) {
      console.error('Gmail API send error:', data);
      return { success: false, error: data.error?.message || `Gmail API HTTP ${res.status}`, provider: 'gmail_api' };
    }
    return { success: true, provider_message_id: data.id, provider: 'gmail_api' };
  } catch (err: any) {
    console.error('Gmail API send exception:', err.message || err);
    return { success: false, error: err.message || 'Unknown Gmail API error', provider: 'gmail_api' };
  }
}

// --- Gmail SMTP (fallback for hosts that don't block SMTP ports) ---

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

async function sendViaGmailSmtp(params: {
  to: string;
  subject: string;
  body: string;
  companyName: string;
}): Promise<SendEmailResult> {
  const transporter = getGmailTransporter();
  const user = process.env.GMAIL_USER;
  if (!transporter || !user) {
    return { success: false, error: 'Gmail SMTP not configured', provider: 'gmail_smtp' };
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
    return { success: true, provider_message_id: info.messageId, provider: 'gmail_smtp' };
  } catch (err: any) {
    console.error('Gmail SMTP send error:', err.message || err);
    return { success: false, error: err.message || 'Unknown Gmail SMTP error', provider: 'gmail_smtp' };
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

  // 1) Gmail API — HTTPS-based, works even when the host blocks SMTP ports.
  if (process.env.GMAIL_OAUTH_CLIENT_ID && process.env.GMAIL_OAUTH_CLIENT_SECRET && process.env.GMAIL_OAUTH_REFRESH_TOKEN) {
    const result = await sendViaGmailApi(params);
    if (result.success) return result;
    console.warn('Gmail API send failed, falling back:', result.error);
  }

  // 2) Gmail SMTP — free, but needs SMTP ports open on the host.
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const result = await sendViaGmailSmtp(params);
    if (result.success) return result;
    console.warn('Gmail SMTP send failed, falling back:', result.error);
  }

  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    return sendViaResend(params);
  }

  console.warn('No email provider configured (GMAIL_OAUTH_*, GMAIL_USER/GMAIL_APP_PASSWORD, or RESEND_API_KEY/RESEND_FROM_EMAIL) — email not actually sent.');
  return { success: false, error: 'Email provider not configured' };
}

