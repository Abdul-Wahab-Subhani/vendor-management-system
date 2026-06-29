import { renderLayout } from "./layout";

export interface RenderedEmail {
  subject: string;
  html: string;
}

export const EmailTemplates = {
  welcome(name: string): RenderedEmail {
    return {
      subject: "Welcome to the Vendor Management System",
      html: renderLayout({
        preheader: `Welcome aboard, ${name}!`,
        bodyHtml: `<h1>Welcome, ${name} 👋</h1>
          <p>Your account has been created. You can now sign in and start using the platform to manage vendors and quotations.</p>`,
      }),
    };
  },

  emailVerification(name: string, verifyUrl: string): RenderedEmail {
    return {
      subject: "Verify your email address",
      html: renderLayout({
        preheader: "Confirm your email to activate your account",
        bodyHtml: `<h1>Confirm your email</h1>
          <p>Hi ${name}, please confirm this is your email address to activate your account. This link expires in 24 hours.</p>`,
        ctaLabel: "Verify Email",
        ctaUrl: verifyUrl,
      }),
    };
  },

  passwordResetRequest(name: string, resetUrl: string): RenderedEmail {
    return {
      subject: "Reset your password",
      html: renderLayout({
        preheader: "Reset your password — link expires in 1 hour",
        bodyHtml: `<h1>Reset your password</h1>
          <p>Hi ${name}, we received a request to reset your password. This link is valid for 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
        ctaLabel: "Reset Password",
        ctaUrl: resetUrl,
      }),
    };
  },

  passwordChanged(name: string): RenderedEmail {
    return {
      subject: "Your password was changed",
      html: renderLayout({
        bodyHtml: `<h1>Password updated</h1>
          <p>Hi ${name}, this is a confirmation that your password was just changed. Contact support immediately if this wasn't you.</p>`,
      }),
    };
  },

  vendorAccountCreated(name: string, email: string, tempPassword: string, loginUrl: string): RenderedEmail {
    return {
      subject: "Your vendor account has been created",
      html: renderLayout({
        preheader: "Your vendor portal access is ready",
        bodyHtml: `<h1>Your vendor account is ready</h1>
          <p>Hi ${name}, an administrator has created a vendor account for you on the Vendor Management System.</p>
          <p><strong>Email:</strong> ${email}<br/><strong>Temporary password:</strong> ${tempPassword}</p>
          <p>Please sign in and change your password right away.</p>`,
        ctaLabel: "Sign In",
        ctaUrl: loginUrl,
      }),
    };
  },

  adminAccountCreated(name: string, email: string, tempPassword: string, loginUrl: string): RenderedEmail {
    return {
      subject: "Your admin account has been created",
      html: renderLayout({
        preheader: "Your admin dashboard access is ready",
        bodyHtml: `<h1>Your admin account is ready</h1>
          <p>Hi ${name}, you've been granted administrator access to the Vendor Management System.</p>
          <p><strong>Email:</strong> ${email}<br/><strong>Temporary password:</strong> ${tempPassword}</p>
          <p>Please sign in and change your password right away.</p>`,
        ctaLabel: "Sign In",
        ctaUrl: loginUrl,
      }),
    };
  },

  newQuotationRequest(vendorName: string, title: string, dueDate: string, viewUrl: string): RenderedEmail {
    return {
      subject: `New quotation request: ${title}`,
      html: renderLayout({
        preheader: `A new quotation request has been assigned to you`,
        bodyHtml: `<h1>New quotation request</h1>
          <p>Hi ${vendorName}, you've been assigned a new quotation request: <strong>${title}</strong>.</p>
          <p><strong>Due date:</strong> ${dueDate}</p>`,
        ctaLabel: "View Request",
        ctaUrl: viewUrl,
      }),
    };
  },

  quotationSubmitted(adminName: string, vendorName: string, title: string, viewUrl: string): RenderedEmail {
    return {
      subject: `Quotation submitted by ${vendorName}`,
      html: renderLayout({
        bodyHtml: `<h1>New quotation submitted</h1>
          <p>Hi ${adminName}, ${vendorName} just submitted a quotation for "<strong>${title}</strong>". Review it at your convenience.</p>`,
        ctaLabel: "Review Quotation",
        ctaUrl: viewUrl,
      }),
    };
  },

  quotationApproved(vendorName: string, title: string, amount: string, viewUrl: string): RenderedEmail {
    return {
      subject: `Quotation approved: ${title}`,
      html: renderLayout({
        bodyHtml: `<h1>Your quotation was approved ✅</h1>
          <p>Hi ${vendorName}, great news — your quotation for "<strong>${title}</strong>" (${amount}) has been approved.</p>`,
        ctaLabel: "View Details",
        ctaUrl: viewUrl,
      }),
    };
  },

  quotationRejected(vendorName: string, title: string, reason: string | undefined, viewUrl: string): RenderedEmail {
    return {
      subject: `Quotation update: ${title}`,
      html: renderLayout({
        bodyHtml: `<h1>Quotation status update</h1>
          <p>Hi ${vendorName}, your quotation for "<strong>${title}</strong>" was not approved this time.${
            reason ? ` Reason: ${reason}` : ""
          }</p>`,
        ctaLabel: "View Details",
        ctaUrl: viewUrl,
      }),
    };
  },

  statusUpdate(name: string, entity: string, status: string, viewUrl: string): RenderedEmail {
    return {
      subject: `Status update: ${entity}`,
      html: renderLayout({
        bodyHtml: `<h1>Status updated</h1>
          <p>Hi ${name}, the status of "<strong>${entity}</strong>" changed to <strong>${status}</strong>.</p>`,
        ctaLabel: "View",
        ctaUrl: viewUrl,
      }),
    };
  },

  reminder(name: string, subjectLine: string, message: string, viewUrl?: string): RenderedEmail {
    return {
      subject: `Reminder: ${subjectLine}`,
      html: renderLayout({
        bodyHtml: `<h1>Friendly reminder</h1><p>Hi ${name}, ${message}</p>`,
        ...(viewUrl ? { ctaLabel: "Take Action", ctaUrl: viewUrl } : {}),
      }),
    };
  },

  announcement(name: string, title: string, bodyText: string): RenderedEmail {
    return {
      subject: title,
      html: renderLayout({
        bodyHtml: `<h1>${title}</h1><p>Hi ${name},</p><p>${bodyText}</p>`,
      }),
    };
  },
};
