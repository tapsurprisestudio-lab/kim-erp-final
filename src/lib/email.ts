import nodemailer from "nodemailer";

type Attachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

export async function sendMail({
  to,
  subject,
  text,
  attachments = []
}: {
  to: string;
  subject: string;
  text: string;
  attachments?: Attachment[];
}) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_FROM) {
    console.info("[email:skipped]", {
      reason: "SMTP is not configured",
      to,
      subject,
      text,
      attachments: attachments.map((attachment) => ({
        filename: attachment.filename,
        contentType: attachment.contentType,
        bytes: attachment.content.length
      }))
    });
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
  });

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    attachments
  });

  return { skipped: false };
}
