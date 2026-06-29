interface LayoutOptions {
  preheader?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

const BRAND = {
  name: "VMS",
  fullName: "Vendor Management System",
  navy: "#14213D",
  gold: "#FCA311",
  ink: "#1B1F27",
  muted: "#6B7280",
  border: "#E5E7EB",
  bg: "#F4F5F7",
  white: "#FFFFFF",
  supportEmail: "support@vms.app",
  website: "https://vms.app",
};

/** Wraps inner content HTML in a full, responsive, branded email shell. */
export function renderLayout({ preheader, bodyHtml, ctaLabel, ctaUrl }: LayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${BRAND.fullName}</title>
<style>
  body { margin:0; padding:0; background:${BRAND.bg}; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:${BRAND.ink}; }
  table { border-collapse: collapse; }
  img { border:0; display:block; }
  .container { max-width: 600px; margin: 0 auto; }
  .card { background:${BRAND.white}; border-radius: 12px; overflow:hidden; border:1px solid ${BRAND.border}; }
  .header { background:${BRAND.navy}; padding: 28px 32px; }
  .header .logo { color:${BRAND.white}; font-size:20px; font-weight:700; letter-spacing:0.5px; }
  .header .logo span { color:${BRAND.gold}; }
  .content { padding: 36px 32px; font-size:15px; line-height:1.6; color:${BRAND.ink}; }
  .content h1 { font-size:20px; margin:0 0 16px; color:${BRAND.navy}; }
  .content p { margin: 0 0 16px; }
  .btn { display:inline-block; background:${BRAND.gold}; color:${BRAND.navy}; font-weight:700; text-decoration:none; padding:12px 28px; border-radius:8px; font-size:14px; }
  .footer { padding: 24px 32px; text-align:center; font-size:12px; color:${BRAND.muted}; }
  .footer a { color:${BRAND.muted}; text-decoration:underline; }
  .divider { height:1px; background:${BRAND.border}; margin: 8px 0 24px; }
  .social a { margin: 0 6px; color:${BRAND.navy}; text-decoration:none; font-size:12px; }
  .preheader { display:none; max-height:0; overflow:hidden; }
</style>
</head>
<body>
  <span class="preheader">${preheader ?? ""}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td>
      <div class="container" style="padding: 32px 16px;">
        <div class="card">
          <div class="header">
            <span class="logo">VENDOR<span>MGMT</span></span>
          </div>
          <div class="content">
            ${bodyHtml}
            ${
              ctaLabel && ctaUrl
                ? `<div style="text-align:center; margin: 28px 0 8px;"><a class="btn" href="${ctaUrl}">${ctaLabel}</a></div>`
                : ""
            }
          </div>
        </div>
        <div class="footer">
          <div class="divider"></div>
          <p style="margin:0 0 8px;">${BRAND.fullName} · Streamlining procurement, one quotation at a time.</p>
          <p style="margin:0 0 8px;">Need help? <a href="mailto:${BRAND.supportEmail}">${BRAND.supportEmail}</a></p>
          <div class="social">
            <a href="${BRAND.website}">Website</a>·
            <a href="${BRAND.website}/linkedin">LinkedIn</a>·
            <a href="${BRAND.website}/twitter">Twitter</a>
          </div>
        </div>
      </div>
    </td></tr>
  </table>
</body>
</html>`;
}

export { BRAND };
