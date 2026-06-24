"use strict";

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

function readMailerConfig() {
  const email = process.env.SMTP_EMAIL;
  const password = process.env.SMTP_PASSWORD;

  if (!email || !password) {
    throw new HttpsError(
      "failed-precondition",
      "SMTP email credentials are not configured on the backend."
    );
  }

  return { email, password };
}

function createTransporter() {
  const { email, password } = readMailerConfig();

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: password,
    },
  });
}

exports.sendOrderReportEmail = onCall({ region: "us-central1" }, async (request) => {
  const { orderId, customerName, email, total, generatedAt } = request.data || {};

  if (!orderId || !email) {
    throw new HttpsError("invalid-argument", "Order ID and recipient email are required.");
  }

  const safeEmail = String(email).trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(safeEmail)) {
    throw new HttpsError("invalid-argument", "A valid recipient email is required.");
  }

  try {
    const transporter = createTransporter();
    const { email: senderEmail } = readMailerConfig();

    await transporter.sendMail({
      from: `"IconX Orders" <${senderEmail}>`,
      to: safeEmail,
      subject: `IconX Order Report - ${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; padding: 24px;">
          <h2 style="margin: 0 0 12px;">Order Report</h2>
          <p style="margin: 0 0 18px; color: #475569;">Your IconX order report is ready.</p>
          <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 12px; overflow: hidden;">
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 700;">Order ID</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">${orderId}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 700;">Customer</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">${customerName || "Customer"}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 700;">Total</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">${total || "LKR 0"}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 700;">Generated At</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">${generatedAt || new Date().toISOString()}</td>
            </tr>
          </table>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to send order report email", error);
    throw new HttpsError("internal", "Unable to send the order report email.");
  }
});
