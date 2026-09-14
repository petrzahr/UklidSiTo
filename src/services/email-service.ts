import { Resend } from "resend";
import { getConfig } from "@/lib/config/env";
import { Task } from "@/types";

export interface SendTaskEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveredTo: string;
}

export class EmailService {
  private resend: Resend | null = null;

  constructor() {
    const config = getConfig();
    if (config.resendApiKey) {
      this.resend = new Resend(config.resendApiKey);
    }
  }

  private async dispatchEmail(
    subject: string,
    html: string,
    destinationEmail: string,
    completionUrlForLog?: string
  ): Promise<SendTaskEmailResult> {
    const config = getConfig();

    if (!this.resend) {
      console.log(`[Email Simulated] Subject: "${subject}" -> To: "${destinationEmail}"`);
      if (completionUrlForLog) {
        console.log(`[Email Simulated] Completion URL: ${completionUrlForLog}`);
      }
      return {
        success: true,
        messageId: `simulated-${Date.now()}`,
        deliveredTo: destinationEmail,
      };
    }

    try {
      const response = await this.resend.emails.send({
        from: config.emailFrom,
        to: destinationEmail,
        subject,
        html,
      });

      if (response.error) {
        console.error("[Email Error]", response.error);
        return {
          success: false,
          error: response.error.message,
          deliveredTo: destinationEmail,
        };
      }

      return {
        success: true,
        messageId: response.data?.id,
        deliveredTo: destinationEmail,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[Email Exception]", errorMsg);
      return {
        success: false,
        error: errorMsg,
        deliveredTo: destinationEmail,
      };
    }
  }

  /**
   * Sends a task assignment email for a newly created task.
   */
  async sendTaskEmail(task: Task, rawToken: string): Promise<SendTaskEmailResult> {
    const destinationEmail = task.assigneeEmail;

    const config = getConfig();
    const completionUrl = `${config.appBaseUrl}/task/${rawToken}`;
    const subject = `🧹 ${task.assigneeName}, máš nový úkol: ${task.taskName}`;

    const roomHtml = task.roomName
      ? `<p style="margin: 6px 0; font-size: 16px; color: #374151;">🏠 <strong>Místnost:</strong> ${task.roomName}</p>`
      : "";

    const noteHtml = task.note
      ? `
      <div style="margin: 16px 0; padding: 12px 16px; background: #f9fafb; border-left: 4px solid #16a34a; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #4b5563; font-weight: 600;">Poznámka:</p>
        <p style="margin: 4px 0 0 0; font-size: 15px; color: #1f2937;">${task.note}</p>
      </div>`
      : "";

    const deadlineHtml = task.deadline
      ? `<p style="margin: 6px 0; font-size: 15px; color: #dc2626;">⏰ <strong>Termín:</strong> ${task.deadline}</p>`
      : "";

    const html = `
    <!DOCTYPE html>
    <html lang="cs">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; font-size: 40px; line-height: 1; margin-bottom: 8px;">🧹</div>
            <h1 style="margin: 0; font-size: 22px; color: #111827; font-weight: 700;">UklidSiTo</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280; font-style: italic;">Domácnost se sama neuklidí.</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="font-size: 16px; color: #1f2937; margin-top: 0;">
              Ahoj <strong>${task.assigneeName}</strong>,
            </p>
            <p style="font-size: 16px; color: #374151;">
              máš nový úkol v UklidSiTo:
            </p>

            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <h2 style="margin: 0; font-size: 20px; color: #15803d;">✨ ${task.taskName}</h2>
              ${roomHtml}
              ${deadlineHtml}
            </div>

            ${noteHtml}
          </div>

          <div style="text-align: center; margin: 32px 0 20px 0;">
            <a href="${completionUrl}" style="display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              MÁM UKLIZENO ✅
            </a>
          </div>

          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
            Pro potvrzení stačí kliknout na tlačítko a na stránce úkol označit jako hotový.
          </p>
        </div>
      </body>
    </html>
    `;

    return this.dispatchEmail(subject, html, destinationEmail, completionUrl);
  }

  /**
   * Sends an email notification informing the assignee that their task was edited/updated.
   * Includes task details and a valid completion link.
   */
  async sendTaskUpdatedEmail(task: Task, rawToken: string): Promise<SendTaskEmailResult> {
    const destinationEmail = task.assigneeEmail;

    const config = getConfig();
    const completionUrl = `${config.appBaseUrl}/task/${rawToken}`;
    const subject = `🔄 ${task.assigneeName}, úkol byl upraven: ${task.taskName}`;

    const roomHtml = task.roomName
      ? `<p style="margin: 6px 0; font-size: 16px; color: #374151;">🏠 <strong>Místnost:</strong> ${task.roomName}</p>`
      : "";

    const noteHtml = task.note
      ? `
      <div style="margin: 16px 0; padding: 12px 16px; background: #f9fafb; border-left: 4px solid #0284c7; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #4b5563; font-weight: 600;">Poznámka:</p>
        <p style="margin: 4px 0 0 0; font-size: 15px; color: #1f2937;">${task.note}</p>
      </div>`
      : "";

    const deadlineHtml = task.deadline
      ? `<p style="margin: 6px 0; font-size: 15px; color: #dc2626;">⏰ <strong>Termín:</strong> ${task.deadline}</p>`
      : "";

    const html = `
    <!DOCTYPE html>
    <html lang="cs">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; font-size: 40px; line-height: 1; margin-bottom: 8px;">🧹</div>
            <h1 style="margin: 0; font-size: 22px; color: #111827; font-weight: 700;">UklidSiTo</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280; font-style: italic;">Domácnost se sama neuklidí.</p>
          </div>

          <div style="margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px; border: 1px solid #bfdbfe;">
              🔄 ÚKOL BYL UPRAVEN
            </div>
            <p style="font-size: 16px; color: #1f2937; margin-top: 0;">
              Ahoj <strong>${task.assigneeName}</strong>,
            </p>
            <p style="font-size: 16px; color: #374151;">
              tvůj úkol v UklidSiTo byl správcem upraven na následující znění:
            </p>

            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <h2 style="margin: 0; font-size: 20px; color: #15803d;">✨ ${task.taskName}</h2>
              ${roomHtml}
              ${deadlineHtml}
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #4b5563;">👤 <strong>Řešitel:</strong> ${task.assigneeName}</p>
            </div>

            ${noteHtml}
          </div>

          <div style="text-align: center; margin: 32px 0 20px 0;">
            <a href="${completionUrl}" style="display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              MÁM UKLIZENO ✅
            </a>
          </div>

          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
            Po dokončení stačí kliknout na tlačítko a splnění potvrdit.
          </p>
        </div>
      </body>
    </html>
    `;

    return this.dispatchEmail(subject, html, destinationEmail, completionUrl);
  }

  /**
   * Sends an email notification informing the assignee that their task was cancelled.
   * Strictly does NOT contain any completion link.
   */
  async sendTaskCancelledEmail(task: Task, previousDeadline?: string | null): Promise<SendTaskEmailResult> {
    const destinationEmail = task.assigneeEmail;

    const subject = `❌ ${task.assigneeName}, úkol byl zrušen: ${task.taskName}`;

    const roomHtml = task.roomName
      ? `<p style="margin: 6px 0; font-size: 15px; color: #374151;">🏠 <strong>Místnost:</strong> ${task.roomName}</p>`
      : "";

    const effectiveDeadline = previousDeadline || task.deadline;
    const deadlineHtml = effectiveDeadline
      ? `<p style="margin: 6px 0; font-size: 14px; color: #6b7280; text-decoration: line-through;">⏰ Původní termín: ${effectiveDeadline}</p>`
      : "";

    const html = `
    <!DOCTYPE html>
    <html lang="cs">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; font-size: 40px; line-height: 1; margin-bottom: 8px;">🧹</div>
            <h1 style="margin: 0; font-size: 22px; color: #111827; font-weight: 700;">UklidSiTo</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280; font-style: italic;">Domácnost se sama neuklidí.</p>
          </div>

          <div style="margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px; border: 1px solid #fecaca;">
              ❌ ÚKOL ZRUŠEN
            </div>
            <p style="font-size: 16px; color: #1f2937; margin-top: 0;">
              Ahoj <strong>${task.assigneeName}</strong>,
            </p>
            <p style="font-size: 16px; color: #374151;">
              následující úkol byl správcem <strong>zrušen</strong> a již jej nemusíš plnit:
            </p>

            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <h2 style="margin: 0; font-size: 18px; color: #4b5563; text-decoration: line-through;">${task.taskName}</h2>
              ${roomHtml}
              ${deadlineHtml}
            </div>

            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-top: 20px;">
              <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 600;">
                🎉 Máš volno! V aplikaci nemusíš nic potvrzovat ani uklízet.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
    `;

    return this.dispatchEmail(subject, html, destinationEmail);
  }
}

let emailServiceInstance: EmailService | null = null;
export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}
