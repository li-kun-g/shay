import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: process.env.EMAIL_HOST!,
  port: Number(process.env.EMAIL_PORT || 587),
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASS!,
  },
});

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  return mailer.sendMail({
    from: process.env.EMAIL_FROM!,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
