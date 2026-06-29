import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { prisma } from "../config/prisma";
import { EmailStatus } from "@prisma/client";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (env.email.provider !== "smtp") return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.email.smtpHost,
      port: env.email.smtpPort,
      secure: env.email.smtpPort === 465,
      auth: env.email.smtpUser ? { user: env.email.smtpUser, pass: env.email.smtpPass } : undefined,
    });
  }
  return transporter;
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  templateKey?: string;
  sentById?: string;
  scheduledFor?: Date;
}

async function dispatch(to: string, subject: string, html: string): Promise<void> {
  switch (env.email.provider) {
    case "smtp": {
      const t = getTransporter();
      await t!.sendMail({ from: env.email.from, to, subject, html });
      return;
    }
    case "resend": {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.email.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: env.email.from, to, subject, html }),
      });
      if (!res.ok) throw new Error(`Resend API error: ${res.status} ${await res.text()}`);
      return;
    }
    case "console":
    default: {
      logger.info(`📧 [console-email] To: ${to} | Subject: ${subject}`);
      return;
    }
  }
}

export const EmailService = {
  /** Sends immediately (or queues + sends if scheduledFor is omitted/past) and logs the attempt. */
  async send(input: SendEmailInput) {
    const isScheduled = input.scheduledFor && input.scheduledFor.getTime() > Date.now();

    const log = await prisma.emailLog.create({
      data: {
        to: input.to,
        subject: input.subject,
        templateKey: input.templateKey,
        sentById: input.sentById,
        status: isScheduled ? EmailStatus.SCHEDULED : EmailStatus.QUEUED,
        scheduledFor: input.scheduledFor,
        metadata: { html: input.html },
      },
    });

    if (isScheduled) return log;

    try {
      await dispatch(input.to, input.subject, input.html);
      return prisma.emailLog.update({
        where: { id: log.id },
        data: { status: EmailStatus.SENT, sentAt: new Date() },
      });
    } catch (err) {
      logger.error(`Failed to send email to ${input.to}: ${(err as Error).message}`);
      return prisma.emailLog.update({
        where: { id: log.id },
        data: { status: EmailStatus.FAILED, error: (err as Error).message },
      });
    }
  },

  async sendToMany(recipients: string[], subject: string, html: string, sentById?: string, templateKey?: string) {
    return Promise.all(
      recipients.map((to) => this.send({ to, subject, html, sentById, templateKey }))
    );
  },

  async history(params: { page: number; limit: number; skip: number; status?: EmailStatus }) {
    const where = params.status ? { status: params.status } : {};
    const [items, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.limit,
      }),
      prisma.emailLog.count({ where }),
    ]);
    return { items, total };
  },

  /** Processes due scheduled emails. Intended to be called by a cron job. */
  async processScheduledEmails() {
    const due = await prisma.emailLog.findMany({
      where: { status: EmailStatus.SCHEDULED, scheduledFor: { lte: new Date() } },
      take: 50,
    });

    for (const item of due) {
      try {
        const html = (item.metadata as { html?: string } | null)?.html ?? "";
        await dispatch(item.to, item.subject, html);
        await prisma.emailLog.update({
          where: { id: item.id },
          data: { status: EmailStatus.SENT, sentAt: new Date() },
        });
      } catch (err) {
        await prisma.emailLog.update({
          where: { id: item.id },
          data: { status: EmailStatus.FAILED, error: (err as Error).message },
        });
      }
    }
    return due.length;
  },
};
