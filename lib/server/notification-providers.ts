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

export class ResendEmailAdapter implements EmailAdapter {
  async send(payload: EmailDeliveryPayload) {
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

    if (!payload.recipientEmail) {
        // Send to all admins if recipientEmail is not provided
        return { success: true, messageId: "skipped_no_recipient" };
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[ResendEmailAdapter] RESEND_API_KEY not configured. Falling back to mock.");
      return new ConsoleEmailAdapter().send(payload);
    }

    try {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL || "system@aauchamo.com",
                to: payload.recipientEmail,
                subject: payload.title,
                text: payload.message,
                html: payload.htmlBody,
            })
        });
        const data = await res.json();
        if (!res.ok) {
            return { success: false, error: data.message || "Resend API error" };
        }
        return { success: true, messageId: data.id };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : "Network error" };
    }
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

export class TermiiSmsAdapter implements SmsAdapter {
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

    if (!payload.recipientPhone) {
        // Send to all admins if recipientPhone is not provided (mocking old behavior)
        return { success: true, messageId: "skipped_no_recipient" };
    }

    const apiKey = process.env.TERMII_API_KEY;
    if (!apiKey) {
      console.warn("[TermiiSmsAdapter] TERMII_API_KEY not configured. Falling back to mock.");
      return new ConsoleSmsAdapter().send(payload);
    }

    try {
        const res = await fetch("https://api.ng.termii.com/api/sms/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to: payload.recipientPhone,
                from: process.env.TERMII_SENDER_ID || "N-Alert",
                sms: payload.message,
                type: "plain",
                channel: "generic",
                api_key: apiKey,
            })
        });
        const data = await res.json();
        if (!res.ok) {
            return { success: false, error: data.message || "Termii API error" };
        }
        return { success: true, messageId: data.message_id };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : "Network error" };
    }
  }
}

// Active provider instances
export const emailProvider: EmailAdapter = process.env.RESEND_API_KEY ? new ResendEmailAdapter() : new ConsoleEmailAdapter();
export const smsProvider: SmsAdapter = process.env.TERMII_API_KEY ? new TermiiSmsAdapter() : new ConsoleSmsAdapter();

export async function sendEmail(payload: EmailDeliveryPayload) {
  return await emailProvider.send(payload);
}

export async function sendSms(payload: SmsDeliveryPayload) {
  return await smsProvider.send(payload);
}
