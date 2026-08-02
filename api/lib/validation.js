const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function failure(status, code) {
  return { ok: false, status, code };
}

export function validateSubmission(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return failure(400, 'INVALID_BODY');
  }

  if (typeof input.company === 'string' && input.company.trim() !== '') {
    return failure(400, 'BOT_DETECTED');
  }

  if (typeof input.email !== 'string') {
    return failure(400, 'INVALID_EMAIL');
  }

  const email = input.email.trim().toLowerCase();
  if (email.length === 0 || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return failure(400, 'INVALID_EMAIL');
  }

  if (input.privacyConsent !== true) {
    return failure(400, 'PRIVACY_CONSENT_REQUIRED');
  }

  return {
    ok: true,
    value: {
      email,
      privacyConsent: true,
      followUpConsent: input.followUpConsent === true,
    },
  };
}
