"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "@/lib/mailer";
import { normalizeUsername } from "@/lib/username";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isKimepEmail(email: string) {
  // strict enough for your case; only allows @kimep.kz domain
  return /^[a-z0-9._%+-]+@kimep\.kz$/.test(email);
}

export async function registerUser(input: {
  name: string;
  username: string;
  email: string;
  password: string;
}) {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const username = normalizeUsername(input.username);
  const password = input.password;

  if (!name || !email || !username || !password) {
    throw new Error("Missing fields");
  }

  // ✅ KIMEP-only signup restriction
  if (!isKimepEmail(email)) {
    throw new Error("Only @kimep.kz email addresses can sign up");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  if (username.length < 3) {
    throw new Error("Username must be at least 3 characters");
  }

  // 🔒 Check email uniqueness
  const emailExists = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (emailExists) {
    throw new Error("Email already registered");
  }

  // 🔒 Check username uniqueness
  const usernameExists = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (usernameExists) {
    throw new Error("Username is already taken");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // ✅ Create user (email NOT verified yet)
  await prisma.user.create({
    data: {
      name,
      username,
      email,
      passwordHash,
      emoji: "☕",
      emailVerified: null,
    },
  });

  // 🔑 Create email verification token (30 min)
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  // Optional cleanup: remove older tokens for same email first
  await prisma.emailVerificationToken.deleteMany({
    where: { email },
  });

  await prisma.emailVerificationToken.create({
    data: {
      email,
      token,
      expiresAt,
    },
  });

  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const link = `${appUrl}/verify-email?token=${token}`;

 await sendEmail({
    to: email,
    subject: "Verify your KIMEPish account ☕",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto;">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">Welcome to KIMEPish ☕</h2>
        <p>Hi ${name},</p>
        <p>Please verify your email to activate your account and start joining the campus tea:</p>
        
        <div style="margin: 30px 0;">
          <a href="${link}" style="display:inline-block; padding:12px 24px; background-color: #000; color: #fff; border-radius: 12px; text-decoration: none; font-weight: 500;">
            Verify Email
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

        <p style="font-size: 13px; color: #666;">
          <strong>Button not working?</strong> If the button above is disabled (this can happen if the email is in your spam folder), please copy and paste the link below into your browser:
        </p>
        
        <p style="font-size: 13px; color: #0070f3; word-break: break-all;">
          <a href="${link}" style="color: #0070f3; text-decoration: underline;">${link}</a>
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This link expires in 30 minutes. If you didn’t sign up for KIMEPish, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  return { ok: true };
}