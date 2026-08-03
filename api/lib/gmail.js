async function loadCreateTransport() {
  const nodemailer = await import('nodemailer');
  return nodemailer.default.createTransport;
}

export function createGmailSender({
  env = process.env,
  createTransportImpl,
} = {}) {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    throw new Error('GMAIL_NOT_CONFIGURED');
  }

  let transportPromise;
  const getTransport = async () => {
    if (!transportPromise) {
      transportPromise = Promise.resolve(createTransportImpl ?? loadCreateTransport())
        .then((createTransport) => createTransport({
          service: 'gmail',
          auth: {
            user: env.GMAIL_USER,
            pass: env.GMAIL_APP_PASSWORD,
          },
        }));
    }
    return transportPromise;
  };

  return async ({ to, subject, html, text }) => {
    const transport = await getTransport();
    return transport.sendMail({
      from: `자취선배 <${env.GMAIL_USER}>`,
      replyTo: env.GMAIL_USER,
      to,
      subject,
      html,
      text,
    });
  };
}
