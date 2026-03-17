import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM
  ? `LeaseFlow <${process.env.EMAIL_FROM}>`
  : 'LeaseFlow <noreply@leaseflow.com>';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const TEMP_EMAIL = 'buctuanonmarisa@gmail.com';

function baseTemplate(content) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body { font-family: 'Courier New', monospace; background: #f9f7f4; margin: 0; padding: 0; }
  .wrap { max-width: 600px; margin: 0 auto; background: white; }
  .header { background: #0f172a; padding: 20px 24px; display: flex; align-items: center; gap: 12px; }
  .logo { width: 36px; height: 36px; background: #1d4ed8; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px; }
  .brand { color: white; font-size: 14px; font-weight: 700; }
  .body { padding: 28px 24px; }
  .hero { padding: 16px 18px; border-left: 4px solid; margin-bottom: 18px; }
  .hero.success { border-color: #10b981; background: #f0fdf9; }
  .hero.mismatch { border-color: #f59e0b; background: #fffbeb; }
  .hero.review { border-color: #1d4ed8; background: #dbeafe; }
  .hero.rejected { border-color: #991b1b; background: #fee2e2; }
  .hero-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  .app-id { background: #0f172a; color: #60a5fa; padding: 16px; text-align: center; font-size: 22px; font-weight: 700; letter-spacing: 4px; margin: 18px 0; }
  .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .detail-table td { padding: 8px 10px; border: 1px solid #d1ccc3; font-size: 12px; }
  .detail-table td:first-child { background: #f0ece4; font-weight: 600; width: 38%; }
  .cta { padding: 14px 20px; text-align: center; font-weight: 700; font-size: 13px; color: white; margin: 16px 0; text-decoration: none; display: block; }
  .cta.blue { background: #1d4ed8; }
  .cta.green { background: #065f46; }
  .cta.orange { background: #d97706; }
  .notice { background: #f1f5f9; border: 1px solid #d1ccc3; padding: 12px 14px; font-size: 11px; color: #6b7280; line-height: 1.8; margin-bottom: 14px; }
  .notice.green { background: #d1fae5; border-color: #6ee7b7; color: #065f46; }
  .notice.yellow { background: #fef3c7; border-color: #fde68a; color: #92400e; }
  .mismatch-item { border: 1px solid #fde68a; background: #fffbeb; padding: 10px 12px; margin-bottom: 8px; font-size: 11px; line-height: 1.8; }
  p { font-size: 12px; line-height: 1.8; color: #111827; margin-bottom: 12px; }
  .footer { border-top: 1px solid #d1ccc3; padding: 14px 24px; font-size: 10px; color: #6b7280; line-height: 1.8; }
</style>
</head><body>
<div class="wrap">
  <div class="header">
    <div class="logo">P</div>
    <span class="brand">LeaseFlow · Tenant Screening</span>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    Automated message from LeaseFlow Tenant Screening System.<br>
    Questions? Call (02) 8888-0000 or email leasing@leaseflow.com<br>
    © ${new Date().getFullYear()} LeaseFlow · 22 Magsaysay Avenue, Makati City
  </div>
</div>
</body></html>`;
}

/* ── Email 1: Submission Confirmed ── */
export async function sendConfirmationEmail(app) {
  const statusLink = `${APP_URL}/status/${app.id}`;
  const html = baseTemplate(`
    <div class="hero success">
      <div class="hero-title">✅ Application Successfully Submitted</div>
      <div style="font-size:11px; color:#065f46;">All 7 documents received and ₱5,000 application fee confirmed</div>
    </div>
    <p>Dear ${app.firstName} ${app.lastName},</p>
    <p>Thank you for submitting your complete rental application. All 7 required documents have been received and your ₱5,000 application fee has been confirmed.</p>
    <p><strong>Please save your Application ID — you'll need it to track your application status:</strong></p>
    <div class="app-id">${app.id}</div>
    <table class="detail-table">
      <tr><td>Property</td><td>${app.unit}</td></tr>
      <tr><td>Monthly Rent</td><td>₱${parseFloat(app.monthlyRent).toLocaleString('en-PH')}/month</td></tr>
      <tr><td>Application Fee</td><td>₱5,000 — Confirmed</td></tr>
      <tr><td>Submitted</td><td>${new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })}</td></tr>
      <tr><td>Status</td><td style="color:#6d28d9; font-weight:700;">🤖 AI Review In Progress</td></tr>
    </table>
    <a class="cta blue" href="${statusLink}">▶ Track Application Status</a>
    <div class="notice">
      If any document inconsistency is found during AI review, you will receive a separate email asking you to re-upload the affected file(s). No other action is needed from you at this time.
    </div>
  `);

  return resend.emails.send({
    from: FROM,
    to: TEMP_EMAIL,
    subject: `📋 Application Received — Your ID is ${app.id}`,
    html,
  });
}

/* ── Email 2: Mismatch Detected ── */
export async function sendMismatchEmail(app, mismatches) {
  const reuploadLink = `${APP_URL}/status/${app.id}`;
  const mismatchHtml = mismatches.map(m =>
    `<div class="mismatch-item"><strong>⚡ ${m.doc}:</strong><br>${m.issue}</div>`
  ).join('');

  const html = baseTemplate(`
    <div class="hero mismatch">
      <div class="hero-title" style="color:#92400e;">⚡ Document Inconsistency Detected</div>
      <div style="font-size:11px; color:#92400e;">${app.id} · AI found mismatching information</div>
    </div>
    <p>Dear ${app.firstName} ${app.lastName},</p>
    <p>Our AI screening system reviewed your submitted documents and detected <strong>inconsistencies</strong> in the following files. Please re-upload corrected versions using the link below.</p>
    <div style="font-weight:700; font-size:12px; margin-bottom:8px; color:#92400e;">Documents requiring re-upload:</div>
    ${mismatchHtml}
    <a class="cta orange" href="${reuploadLink}">🔄 Re-upload Documents Now</a>
    <div class="notice">
      Use your Application ID <strong>${app.id}</strong> and email to access your application. Your other documents are unaffected and do not need to be re-uploaded.<br><br>
      If you believe this is an error, contact our office at (02) 8888-0000.
    </div>
  `);

  return resend.emails.send({
    from: FROM,
    to: TEMP_EMAIL,
    subject: `🔍 Action Required — Document Inconsistency Found in ${app.id}`,
    html,
  });
}

/* ── Email 3: Under Manual Review ── */
export async function sendReviewEmail(app) {
  const statusLink = `${APP_URL}/status/${app.id}`;
  const html = baseTemplate(`
    <div class="hero review">
      <div class="hero-title">🔎 Under Manual Review by Leasing Team</div>
      <div style="font-size:11px; color:#1d4ed8;">${app.id} · All documents verified</div>
    </div>
    <p>Dear ${app.firstName} ${app.lastName},</p>
    <p>All your documents have been received and verified by our AI system. Your application has been forwarded to our leasing team for a human review.</p>
    <p>No action is needed from you at this time. A leasing team member will contact you within <strong>2 business days</strong>.</p>
    <table class="detail-table">
      <tr><td>Application ID</td><td>${app.id}</td></tr>
      <tr><td>Property</td><td>${app.unit}</td></tr>
      <tr><td>Status</td><td style="color:#1d4ed8; font-weight:700;">⚠️ Under Manual Review</td></tr>
    </table>
    <a class="cta blue" href="${statusLink}">▶ Check Application Status</a>
    <div class="notice">Watch your email for updates from our leasing team.</div>
  `);

  return resend.emails.send({
    from: FROM,
    to: TEMP_EMAIL,
    subject: `⚠️ Your Application is Under Review — ${app.id}`,
    html,
  });
}

/* ── Email 4: Application Approved ── */
export async function sendApprovedEmail(app, decidedBy) {
  const deposit = (parseFloat(app.monthlyRent) * 2).toLocaleString('en-PH');
  const statusLink = `${APP_URL}/status/${app.id}`;
  const html = baseTemplate(`
    <div class="hero success">
      <div class="hero-title">🎉 Your Application has been Approved!</div>
      <div style="font-size:11px; color:#065f46;">${app.id} · Reviewed by ${decidedBy}</div>
    </div>
    <p>Dear ${app.firstName} ${app.lastName},</p>
    <p>We are pleased to inform you that your rental application for <strong>${app.unit}</strong> has been <strong>approved</strong>. Your documents passed all screening criteria successfully.</p>
    <table class="detail-table">
      <tr><td>Application ID</td><td>${app.id}</td></tr>
      <tr><td>Unit Approved</td><td>${app.unit}</td></tr>
      <tr><td>Monthly Rent</td><td>₱${parseFloat(app.monthlyRent).toLocaleString('en-PH')}/month</td></tr>
      <tr><td>Move-in Date</td><td>${app.moveIn}</td></tr>
      <tr><td>Security Deposit</td><td>₱${deposit} (2× rent) — due within 5 days</td></tr>
      <tr><td>Approved By</td><td>${decidedBy} · Leasing Agent</td></tr>
    </table>
    <a class="cta green" href="${statusLink}">📄 View Lease Agreement</a>
    <div class="notice green">
      <strong>Next Steps:</strong><br>
      1. Review and sign your lease agreement (link above)<br>
      2. Pay security deposit of ₱${deposit} within 5 business days<br>
      3. Schedule unit walkthrough: (02) 8888-0000<br>
      4. Collect keys on move-in day with valid government ID
    </div>
    <div class="notice yellow">
      ⚠️ Lease must be signed and deposit paid within 5 business days, or the unit may be offered to other applicants.
    </div>
  `);

  return resend.emails.send({
    from: FROM,
    to: TEMP_EMAIL,
    subject: `✅ Congratulations! Your Application is Approved — ${app.id}`,
    html,
  });
}

/* ── Email 5: Application Rejected ── */
export async function sendRejectedEmail(app, reasons) {
  const html = baseTemplate(`
    <div class="hero rejected">
      <div class="hero-title">❌ Application Not Approved</div>
      <div style="font-size:11px; color:#991b1b;">${app.id}</div>
    </div>
    <p>Dear ${app.firstName} ${app.lastName},</p>
    <p>We regret to inform you that your rental application for <strong>${app.unit}</strong> was not approved based on our screening criteria.</p>
    ${reasons ? `<div class="notice" style="margin-bottom:14px;"><strong>Reason(s):</strong><br>${reasons}</div>` : ''}
    <div class="notice">
      For questions about this decision, please contact us at:<br>
      📞 (02) 8888-0000<br>
      📧 leasing@leaseflow.com
    </div>
  `);

  return resend.emails.send({
    from: FROM,
    to: TEMP_EMAIL,
    subject: `❌ Rental Application Update — ${app.id}`,
    html,
  });
}
