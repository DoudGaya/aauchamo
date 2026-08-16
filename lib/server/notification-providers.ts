import { db } from "@/lib/server/db";

export type EmailDeliveryPayload = {
  companyId: string;
  recipientEmail?: string;
  eventType: string;
  title: string;
  message: string;
  htmlBody?: string;
};

export type SmsDeliveryPayload = {
  companyId: string;
  recipientPhone?: string;
  eventType: string;
  message: string;
};

export interface EmailAdapter {
  send(payload: EmailDeliveryPayload): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export interface SmsAdapter {
  send(payload: SmsDeliveryPayload): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * Mandatory security alerts that CANNOT be opted out of.
 */
export const MANDATORY_SECURITY_EVENT_TYPES = new Set([
  "auth.login_failed",
  "users.created",
  "security.access_changed",
  "security.session_revoked",
  "security.password_reset",
]);

/**
 * Mock Email Adapter — Provider ready for SMTP, Resend, SendGrid, or AWS SES swap.
 */
export class ConsoleEmailAdapter implements EmailAdapter {
  async send(payload: EmailDeliveryPayload) {
    // Check user preference unless it's a mandatory security alert
    const isMandatory = MANDATORY_SECURITY_EVENT_TYPES.has(payload.eventType);

    if (!isMandatory && payload.recipientEmail) {
      const user = await db.user.findFirst({
        where: { email: payload.recipientEmail },
        select: { id: true },
      });
      if (user) {
        const pref = await db.notificationPreference.findFirst({
          where: { userId: user.id, type: payload.eventType, channel: "EMAIL" },
        });
        if (pref && !pref.enabled) {
          return { success: true, messageId: "opted_out_by_user" };
        }
      }
    }

    const messageId = `email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    // console.log(`[Email Adapter] Delivered "${payload.title}" to ${payload.recipientEmail ?? "Subscribed admins"} (ID: ${messageId})`);
    return { success: true, messageId };
  }
}

/**
 * Mock SMS Adapter — Provider ready for Twilio, Termii, or Infobip swap.
 */
export class ConsoleSmsAdapter implements SmsAdapter {
  async send(payload: SmsDeliveryPayload) {
    const isMandatory = MANDATORY_SECURITY_EVENT_TYPES.has(payload.eventType);

    if (!isMandatory && payload.recipientPhone) {
      const user = await db.user.findFirst({
        where: { staffProfile: { phone: payload.recipientPhone } },
        select: { id: true },
      });
      if (user) {
        const pref = await db.notificationPreference.findFirst({
          where: { userId: user.id, type: payload.eventType, channel: "SMS" },
        });
        if (pref && !pref.enabled) {
          return { success: true, messageId: "opted_out_by_user" };
        }
      }
    }

    const messageId = `sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    // console.log(`[SMS Adapter] Delivered text to ${payload.recipientPhone ?? "Subscribed admins"} (ID: ${messageId})`);
    return { success: true, messageId };
  }
}

// Active provider instances
export const emailProvider: EmailAdapter = new ConsoleEmailAdapter();
export const smsProvider: SmsAdapter = new ConsoleSmsAdapter();

export async function sendEmail(payload: EmailDeliveryPayload) {
  return await emailProvider.send(payload);
}

export async function sendSms(payload: SmsDeliveryPayload) {
  return await smsProvider.send(payload);
}
