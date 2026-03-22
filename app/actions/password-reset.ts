"use server";

import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { Resend } from "resend";
import bcrypt from "bcryptjs";

const resend = new Resend(process.env.EMAIL_PASS);

/**
 * PHASE 1: Send the reset email
 */
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) return { error: "Email is required" };

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Security: Don't reveal if email exists or not
    if (!user) {
      return { success: true };
    }

    const token = uuidv4();
    const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expires,
      },
    });

    const baseUrl = process.env.APP_URL || "http://localhost:3000";
const resetLink = `${baseUrl}/reset-password?token=${token}`;

    await resend.emails.send({
      from: "auth@shay.kz",
      to: email,
      subject: "Reset your Shay password",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #111;">Password Reset Request</h2>
          <p>We received a request to reset your password for your Shay account.</p>
          <p>Click the button below to set a new one. This link expires in 1 hour.</p>
          <a href="${resetLink}" style="background: black; color: white; padding: 12px 24px; text-decoration: none; border-radius: 99px; display: inline-block; margin: 20px 0; font-weight: 500;">Reset Password</a>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Reset Request Error:", error);
    return { error: "Failed to send reset email. Try again later." };
  }
}

/**
 * PHASE 2: Update the password in the database
 */
export async function resetPassword(formData: FormData, token: string) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  try {
    const existingToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!existingToken) {
      return { error: "Invalid token." };
    }

    const hasExpired = new Date(existingToken.expires) < new Date();
    if (hasExpired) {
      return { error: "Token has expired. Please request a new link." };
    }

    const user = await prisma.user.findUnique({
      where: { email: existingToken.email },
    });

    if (!user) {
      return { error: "User account not found." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ FIXED: Using 'passwordHash' to match your schema
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword }, 
      }),
      prisma.passwordResetToken.delete({
        where: { id: existingToken.id },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Reset Password Error:", error);
    return { error: "Something went wrong during the update." };
  }
}