export function createSubmissionPayload(formData) {
  return {
    email: String(formData.get('email') ?? '').trim(),
    privacyConsent: formData.get('privacyConsent') === 'on',
    followUpConsent: formData.get('followUpConsent') === 'on',
    company: String(formData.get('company') ?? ''),
  };
}

export async function submitChecklist({ fetchImpl = fetch, payload }) {
  try {
    const response = await fetchImpl('/api/send-checklist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let result;
    try {
      result = await response.json();
    } catch {
      return { ok: false, code: 'UNEXPECTED_ERROR' };
    }

    if (!response.ok) {
      return {
        ok: false,
        code: typeof result.code === 'string' ? result.code : 'UNEXPECTED_ERROR',
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, code: 'NETWORK_ERROR' };
  }
}
