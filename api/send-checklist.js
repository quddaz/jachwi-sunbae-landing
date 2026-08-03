import { renderChecklistEmail } from './lib/checklist-email.js';
import { createGmailSender } from './lib/gmail.js';
import { validateSubmission } from './lib/validation.js';

const RESEND_API_URL = 'https://api.resend.com';
const MAX_BODY_BYTES = 8 * 1024;

function parseBody(body) {
  if (typeof body !== 'string') {
    return body;
  }

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function bodySize(body) {
  try {
    return Buffer.byteLength(typeof body === 'string' ? body : JSON.stringify(body ?? null));
  } catch {
    return MAX_BODY_BYTES + 1;
  }
}

function sendJson(response, status, body) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  return response.status(status).json(body);
}

function resendHeaders(apiKey) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'jachwi-sunbae-landing/1.0',
  };
}

async function createContact({ fetchImpl, env, email }) {
  return fetchImpl(`${RESEND_API_URL}/contacts`, {
    method: 'POST',
    headers: resendHeaders(env.RESEND_API_KEY),
    body: JSON.stringify({
      email,
      unsubscribed: false,
      segments: [{ id: env.RESEND_SEGMENT_ID }],
    }),
  });
}

export function createHandler({
  fetchImpl = fetch,
  env = process.env,
  logger = console,
  sendMailImpl,
} = {}) {
  return async function sendChecklistHandler(request, response) {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return sendJson(response, 405, { ok: false, code: 'METHOD_NOT_ALLOWED' });
    }

    const declaredLength = Number(request.headers?.['content-length'] ?? 0);
    if (declaredLength > MAX_BODY_BYTES || bodySize(request.body) > MAX_BODY_BYTES) {
      return sendJson(response, 413, { ok: false, code: 'PAYLOAD_TOO_LARGE' });
    }

    const validation = validateSubmission(parseBody(request.body));
    if (!validation.ok) {
      return sendJson(response, validation.status, {
        ok: false,
        code: validation.code,
      });
    }

    if (
      !env.GMAIL_USER
      || !env.GMAIL_APP_PASSWORD
    ) {
      return sendJson(response, 500, {
        ok: false,
        code: 'SERVER_NOT_CONFIGURED',
      });
    }

    const { email, followUpConsent } = validation.value;

    if (followUpConsent && env.RESEND_API_KEY && env.RESEND_SEGMENT_ID) {
      try {
        const contactResponse = await createContact({ fetchImpl, env, email });
        if (!contactResponse.ok) {
          logger.warn('resend_contact_failed', { status: contactResponse.status });
        }
      } catch {
        logger.warn('resend_contact_failed', { status: 'network_error' });
      }
    }

    const checklistEmail = renderChecklistEmail();
    const sendMail = sendMailImpl ?? createGmailSender({ env });

    try {
      await sendMail({
        to: email,
        subject: checklistEmail.subject,
        html: checklistEmail.html,
        text: checklistEmail.text,
      });
    } catch {
      return sendJson(response, 502, { ok: false, code: 'SEND_FAILED' });
    }

    return sendJson(response, 200, { ok: true });
  };
}

export default createHandler();
