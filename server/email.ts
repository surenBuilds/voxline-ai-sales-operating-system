// Real outbound email delivery via Resend (https://resend.com).
// Requires RESEND_API_KEY and RESEND_FROM_EMAIL (must be a verified sender/domain in Resend).

interface SendEmailResult {
  success: boolean;
  provider_message_id?: string;
  error?: string;
}

export async function sendOutboundEmail(params: {
  to: string;
  subject: string;
  body: string;
  companyName: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.warn('RESEND_API_KEY / RESEND_FROM_EMAIL not configured — email not actually sent.');
    return { success: false, error: 'Email provider not configured' };
  }

  if (!params.to) {
    return { success: false, error: 'Recipient has no email address on file' };
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
      return { success: false, error: data.message || `Resend HTTP ${res.status}` };
    }

    return { success: true, provider_message_id: data.id };
  } catch (err: any) {
    console.error('Email send exception:', err);
    return { success: false, error: err.message || 'Unknown email send error' };
  }
}
