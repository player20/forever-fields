// Email Templates
// Uses React Email for rendering (or fallback to simple HTML)

import type { EmailTemplate } from "./types";

// Base URL for links
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://foreverfields.com";

// Brand colors
const COLORS = {
  sage: "#7C9A8B",
  sageDark: "#5A7A6B",
  gold: "#C9A962",
  cream: "#FAF8F5",
  grayDark: "#2D3748",
  grayBody: "#4A5568",
};

/**
 * Render email template to HTML and plain text
 */
export async function renderEmailTemplate(
  template: EmailTemplate,
  data: Record<string, unknown>
): Promise<{ html: string; text: string }> {
  // Get the template renderer
  const renderer = templates[template];
  if (!renderer) {
    throw new Error(`Unknown email template: ${template}`);
  }

  return renderer(data);
}

// Template wrapper with consistent styling
function wrapTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forever Fields</title>
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden">${preheader}</span>` : ""}
</head>
<body style="margin:0;padding:0;background-color:${COLORS.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" style="background-color:${COLORS.cream};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color:${COLORS.sage};padding:24px;text-align:center;">
              <img src="${BASE_URL}/logo-white.png" alt="Forever Fields" width="150" style="display:block;margin:0 auto;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f7f7f7;padding:24px 40px;text-align:center;font-size:12px;color:${COLORS.grayBody};">
              <p style="margin:0 0 8px;">
                Forever Fields - Honoring Lives, Preserving Memories
              </p>
              <p style="margin:0;">
                <a href="${BASE_URL}/privacy" style="color:${COLORS.sage};text-decoration:none;">Privacy</a> •
                <a href="${BASE_URL}/terms" style="color:${COLORS.sage};text-decoration:none;">Terms</a> •
                <a href="${BASE_URL}/help" style="color:${COLORS.sage};text-decoration:none;">Help</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Button component
function button(text: string, url: string): string {
  return `
    <table role="presentation" style="margin:24px 0;">
      <tr>
        <td style="background-color:${COLORS.sage};border-radius:6px;">
          <a href="${url}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:600;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// Template definitions
const templates: Record<EmailTemplate, (data: Record<string, unknown>) => { html: string; text: string }> = {
  welcome: (data) => {
    const { userName, loginUrl } = data as { userName: string; loginUrl: string };
    const html = wrapTemplate(`
      <h1 style="color:${COLORS.grayDark};font-size:24px;margin:0 0 16px;">Welcome to Forever Fields</h1>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hi ${userName},
      </p>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        Thank you for joining Forever Fields. We're honored to help you preserve and celebrate the memories of those you love.
      </p>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 24px;">
        Get started by creating your first memorial, or explore our features to see how we can help you honor their legacy.
      </p>
      ${button("Get Started", loginUrl)}
    `, "Welcome to Forever Fields - Let's get started");

    const text = `Welcome to Forever Fields

Hi ${userName},

Thank you for joining Forever Fields. We're honored to help you preserve and celebrate the memories of those you love.

Get started by visiting: ${loginUrl}`;

    return { html, text };
  },

  password_reset: (data) => {
    const { userName, resetUrl, expiresIn } = data as { userName: string; resetUrl: string; expiresIn: string };
    const html = wrapTemplate(`
      <h1 style="color:${COLORS.grayDark};font-size:24px;margin:0 0 16px;">Reset Your Password</h1>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hi ${userName},
      </p>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 24px;">
        We received a request to reset your password. Click the button below to create a new password. This link will expire in ${expiresIn}.
      </p>
      ${button("Reset Password", resetUrl)}
      <p style="color:${COLORS.grayBody};font-size:14px;line-height:1.6;margin:24px 0 0;">
        If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
      </p>
    `, "Reset your Forever Fields password");

    const text = `Reset Your Password

Hi ${userName},

We received a request to reset your password. Visit this link to create a new password:
${resetUrl}

This link will expire in ${expiresIn}.

If you didn't request this, you can safely ignore this email.`;

    return { html, text };
  },

  email_verification: (data) => {
    const { userName, verifyUrl } = data as { userName: string; verifyUrl: string };
    const html = wrapTemplate(`
      <h1 style="color:${COLORS.grayDark};font-size:24px;margin:0 0 16px;">Verify Your Email</h1>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 24px;">
        Hi ${userName}, please verify your email address by clicking the button below.
      </p>
      ${button("Verify Email", verifyUrl)}
    `);
    const text = `Verify your email by visiting: ${verifyUrl}`;
    return { html, text };
  },

  collaborator_invite: (data) => {
    const { inviterName, memorialName, role, inviteUrl, expiresIn } = data as {
      inviterName: string;
      memorialName: string;
      role: string;
      inviteUrl: string;
      expiresIn: string;
    };
    const html = wrapTemplate(`
      <h1 style="color:${COLORS.grayDark};font-size:24px;margin:0 0 16px;">You've Been Invited</h1>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        ${inviterName} has invited you to collaborate on the memorial for <strong>${memorialName}</strong>.
      </p>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 24px;">
        You've been invited as a <strong>${role}</strong>. This invitation expires in ${expiresIn}.
      </p>
      ${button("Accept Invitation", inviteUrl)}
    `, `${inviterName} invited you to collaborate on a memorial`);

    const text = `${inviterName} has invited you to collaborate on the memorial for ${memorialName}.

Role: ${role}
Expires in: ${expiresIn}

Accept the invitation: ${inviteUrl}`;

    return { html, text };
  },

  anniversary_reminder: (data) => {
    const { userName, memorialName, memorialUrl, anniversaryType, anniversaryDate, yearsAgo, customLabel } = data as {
      userName: string;
      memorialName: string;
      memorialUrl: string;
      anniversaryType: string;
      anniversaryDate: string;
      yearsAgo?: number;
      customLabel?: string;
    };

    const typeLabel = anniversaryType === "birth" ? "birthday" : anniversaryType === "death" ? "remembrance day" : customLabel || "anniversary";
    const yearsText = yearsAgo ? ` (${yearsAgo} years)` : "";

    const html = wrapTemplate(`
      <h1 style="color:${COLORS.grayDark};font-size:24px;margin:0 0 16px;">Remembering ${memorialName}</h1>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hi ${userName},
      </p>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        ${memorialName}'s ${typeLabel} is coming up on <strong>${anniversaryDate}</strong>${yearsText}.
      </p>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 24px;">
        Take a moment to visit their memorial, light a candle, or share a memory.
      </p>
      ${button("Visit Memorial", memorialUrl)}
    `, `${memorialName}'s ${typeLabel} is coming up`);

    const text = `Remembering ${memorialName}

Hi ${userName},

${memorialName}'s ${typeLabel} is coming up on ${anniversaryDate}${yearsText}.

Visit the memorial: ${memorialUrl}`;

    return { html, text };
  },

  guestbook_notification: (data) => {
    const { ownerName, memorialName, memorialUrl, authorName, message, requiresApproval } = data as {
      ownerName: string;
      memorialName: string;
      memorialUrl: string;
      authorName: string;
      message: string;
      requiresApproval: boolean;
    };

    const html = wrapTemplate(`
      <h1 style="color:${COLORS.grayDark};font-size:24px;margin:0 0 16px;">New Guestbook Entry</h1>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hi ${ownerName},
      </p>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        <strong>${authorName}</strong> signed the guestbook for ${memorialName}:
      </p>
      <blockquote style="border-left:4px solid ${COLORS.sage};padding:12px 16px;margin:16px 0;background-color:#f9f9f9;font-style:italic;color:${COLORS.grayBody};">
        "${message.substring(0, 300)}${message.length > 300 ? "..." : ""}"
      </blockquote>
      ${requiresApproval ? '<p style="color:#e53e3e;font-size:14px;margin:0 0 16px;">⚠️ This entry requires your approval before it will be visible.</p>' : ""}
      ${button("View Guestbook", memorialUrl)}
    `, `${authorName} signed the guestbook for ${memorialName}`);

    const text = `New Guestbook Entry

Hi ${ownerName},

${authorName} signed the guestbook for ${memorialName}:

"${message}"

${requiresApproval ? "This entry requires your approval." : ""}

View the guestbook: ${memorialUrl}`;

    return { html, text };
  },

  story_notification: (data) => {
    const { ownerName, memorialName, memorialUrl, authorName, storyTitle, storyPreview, requiresApproval } = data as {
      ownerName: string;
      memorialName: string;
      memorialUrl: string;
      authorName: string;
      storyTitle: string;
      storyPreview: string;
      requiresApproval: boolean;
    };

    const html = wrapTemplate(`
      <h1 style="color:${COLORS.grayDark};font-size:24px;margin:0 0 16px;">New Story Shared</h1>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hi ${ownerName},
      </p>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        <strong>${authorName}</strong> shared a new story about ${memorialName}:
      </p>
      <p style="color:${COLORS.grayDark};font-size:18px;font-weight:600;margin:0 0 8px;">${storyTitle}</p>
      <p style="color:${COLORS.grayBody};font-size:14px;line-height:1.6;margin:0 0 16px;">
        ${storyPreview}
      </p>
      ${requiresApproval ? '<p style="color:#e53e3e;font-size:14px;margin:0 0 16px;">⚠️ This story requires your approval.</p>' : ""}
      ${button("Read Story", memorialUrl)}
    `, `${authorName} shared a story about ${memorialName}`);

    const text = `New Story Shared

${authorName} shared "${storyTitle}" about ${memorialName}.

${storyPreview}

Read the story: ${memorialUrl}`;

    return { html, text };
  },

  candle_notification: (data) => {
    const { ownerName, memorialName, memorialUrl, litByName, message } = data as {
      ownerName: string;
      memorialName: string;
      memorialUrl: string;
      litByName: string;
      message?: string;
    };

    const html = wrapTemplate(`
      <h1 style="color:${COLORS.grayDark};font-size:24px;margin:0 0 16px;">🕯️ A Candle Was Lit</h1>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hi ${ownerName},
      </p>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        <strong>${litByName}</strong> lit a candle in memory of ${memorialName}.
      </p>
      ${message ? `<blockquote style="border-left:4px solid ${COLORS.gold};padding:12px 16px;margin:16px 0;background-color:#fffbeb;font-style:italic;color:${COLORS.grayBody};">"${message}"</blockquote>` : ""}
      ${button("View Memorial", memorialUrl)}
    `, `${litByName} lit a candle for ${memorialName}`);

    const text = `A Candle Was Lit

${litByName} lit a candle in memory of ${memorialName}.
${message ? `\nMessage: "${message}"` : ""}

View memorial: ${memorialUrl}`;

    return { html, text };
  },

  time_capsule_ready: (data) => {
    const { recipientName, senderName, memorialName, capsuleTitle, openUrl } = data as {
      recipientName: string;
      senderName: string;
      memorialName?: string;
      capsuleTitle: string;
      openUrl: string;
    };

    const html = wrapTemplate(`
      <h1 style="color:${COLORS.grayDark};font-size:24px;margin:0 0 16px;">🎁 A Time Capsule Is Ready</h1>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        Dear ${recipientName},
      </p>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        ${senderName} created a time capsule for you${memorialName ? ` in memory of ${memorialName}` : ""}, and it's now ready to be opened.
      </p>
      <p style="color:${COLORS.grayDark};font-size:18px;font-weight:600;margin:0 0 24px;">"${capsuleTitle}"</p>
      ${button("Open Time Capsule", openUrl)}
    `, "A time capsule is ready to be opened");

    const text = `A Time Capsule Is Ready

Dear ${recipientName},

${senderName} created a time capsule "${capsuleTitle}" for you, and it's now ready.

Open it here: ${openUrl}`;

    return { html, text };
  },

  time_capsule_opened: (_data) => {
    const html = wrapTemplate(`<p>Time capsule opened notification</p>`);
    return { html, text: "Time capsule was opened" };
  },

  donation_received: (data) => {
    const { ownerName, memorialName, donorName, amount, causeName, message, totalRaised, goalAmount } = data as {
      ownerName: string;
      memorialName: string;
      donorName: string;
      amount: string;
      causeName?: string;
      message?: string;
      totalRaised: string;
      goalAmount?: string;
    };

    const html = wrapTemplate(`
      <h1 style="color:${COLORS.grayDark};font-size:24px;margin:0 0 16px;">💝 Donation Received</h1>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hi ${ownerName},
      </p>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        <strong>${donorName}</strong> made a donation of <strong>${amount}</strong> in memory of ${memorialName}${causeName ? ` to support ${causeName}` : ""}.
      </p>
      ${message ? `<blockquote style="border-left:4px solid ${COLORS.sage};padding:12px 16px;margin:16px 0;background-color:#f9f9f9;font-style:italic;color:${COLORS.grayBody};">"${message}"</blockquote>` : ""}
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:16px 0;">
        Total raised: <strong>${totalRaised}</strong>${goalAmount ? ` of ${goalAmount} goal` : ""}
      </p>
    `, `${donorName} donated ${amount} in memory of ${memorialName}`);

    const text = `Donation Received

${donorName} donated ${amount} in memory of ${memorialName}.
${message ? `Message: "${message}"` : ""}

Total raised: ${totalRaised}`;

    return { html, text };
  },

  donation_thank_you: (data) => {
    const { donorName, memorialName, memorialUrl, amount, causeName, receiptUrl } = data as {
      donorName: string;
      memorialName: string;
      memorialUrl: string;
      amount: string;
      causeName?: string;
      receiptUrl?: string;
    };

    const html = wrapTemplate(`
      <h1 style="color:${COLORS.grayDark};font-size:24px;margin:0 0 16px;">Thank You for Your Donation</h1>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        Dear ${donorName},
      </p>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        Thank you for your generous donation of <strong>${amount}</strong> in memory of ${memorialName}${causeName ? ` to support ${causeName}` : ""}.
      </p>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 24px;">
        Your kindness helps keep their memory alive and makes a meaningful difference.
      </p>
      ${button("Visit Memorial", memorialUrl)}
      ${receiptUrl ? `<p style="color:${COLORS.grayBody};font-size:14px;margin:24px 0 0;"><a href="${receiptUrl}" style="color:${COLORS.sage};">View your donation receipt</a></p>` : ""}
    `, "Thank you for your donation");

    const text = `Thank You for Your Donation

Dear ${donorName},

Thank you for your donation of ${amount} in memory of ${memorialName}.

Visit the memorial: ${memorialUrl}`;

    return { html, text };
  },

  order_confirmation: (data) => {
    const d = data as {
      customerName: string;
      orderNumber: string;
      orderUrl: string;
      items: Array<{ name: string; quantity: number; price: string; customization?: string }>;
      subtotal: string;
      shipping: string;
      total: string;
      shippingAddress: { name: string; street1: string; street2?: string; city: string; state: string; postalCode: string; country: string };
      estimatedDelivery?: string;
    };

    const itemsHtml = d.items.map((item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.name}${item.customization ? `<br><small style="color:#666;">${item.customization}</small>` : ""}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${item.price}</td>
      </tr>
    `).join("");

    const html = wrapTemplate(`
      <h1 style="color:${COLORS.grayDark};font-size:24px;margin:0 0 16px;">Order Confirmed</h1>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hi ${d.customerName}, thank you for your order!
      </p>
      <p style="color:${COLORS.grayBody};font-size:14px;margin:0 0 24px;">
        Order #${d.orderNumber}
      </p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <thead>
          <tr style="border-bottom:2px solid ${COLORS.sage};">
            <th style="text-align:left;padding:8px 0;">Item</th>
            <th style="text-align:center;padding:8px 0;">Qty</th>
            <th style="text-align:right;padding:8px 0;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr><td colspan="2" style="padding:8px 0;text-align:right;">Subtotal:</td><td style="text-align:right;">${d.subtotal}</td></tr>
          <tr><td colspan="2" style="padding:8px 0;text-align:right;">Shipping:</td><td style="text-align:right;">${d.shipping}</td></tr>
          <tr><td colspan="2" style="padding:8px 0;text-align:right;font-weight:bold;">Total:</td><td style="text-align:right;font-weight:bold;">${d.total}</td></tr>
        </tfoot>
      </table>
      <p style="color:${COLORS.grayDark};font-weight:600;margin:0 0 8px;">Shipping to:</p>
      <p style="color:${COLORS.grayBody};font-size:14px;margin:0 0 24px;">
        ${d.shippingAddress.name}<br>
        ${d.shippingAddress.street1}<br>
        ${d.shippingAddress.street2 ? d.shippingAddress.street2 + "<br>" : ""}
        ${d.shippingAddress.city}, ${d.shippingAddress.state} ${d.shippingAddress.postalCode}<br>
        ${d.shippingAddress.country}
      </p>
      ${d.estimatedDelivery ? `<p style="color:${COLORS.grayBody};font-size:14px;margin:0 0 24px;">Estimated delivery: ${d.estimatedDelivery}</p>` : ""}
      ${button("View Order", d.orderUrl)}
    `, `Order #${d.orderNumber} confirmed`);

    const text = `Order Confirmed - #${d.orderNumber}`;
    return { html, text };
  },

  order_shipped: (data) => {
    const d = data as {
      customerName: string;
      orderNumber: string;
      trackingNumber: string;
      trackingUrl: string;
      carrier: string;
      items: Array<{ name: string; quantity: number }>;
    };

    const html = wrapTemplate(`
      <h1 style="color:${COLORS.grayDark};font-size:24px;margin:0 0 16px;">📦 Your Order Has Shipped!</h1>
      <p style="color:${COLORS.grayBody};font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hi ${d.customerName}, your order #${d.orderNumber} is on its way!
      </p>
      <p style="color:${COLORS.grayBody};font-size:16px;margin:0 0 8px;">
        <strong>Carrier:</strong> ${d.carrier}
      </p>
      <p style="color:${COLORS.grayBody};font-size:16px;margin:0 0 24px;">
        <strong>Tracking:</strong> ${d.trackingNumber}
      </p>
      ${button("Track Package", d.trackingUrl)}
    `, `Your order #${d.orderNumber} has shipped`);

    const text = `Your order #${d.orderNumber} has shipped!\n\nTracking: ${d.trackingNumber}\nTrack at: ${d.trackingUrl}`;
    return { html, text };
  },

  weekly_digest: (_data) => {
    const html = wrapTemplate(`<p>Weekly digest content</p>`);
    return { html, text: "Weekly digest" };
  },

  claim_request: (_data) => {
    const html = wrapTemplate(`<p>Memorial claim request</p>`);
    return { html, text: "Claim request received" };
  },

  claim_approved: (_data) => {
    const html = wrapTemplate(`<p>Your claim was approved</p>`);
    return { html, text: "Claim approved" };
  },

  claim_rejected: (_data) => {
    const html = wrapTemplate(`<p>Your claim was not approved</p>`);
    return { html, text: "Claim not approved" };
  },

  partner_order: (data) => {
    const d = data as {
      partnerName: string;
      orderNumber: string;
      items: Array<{ name: string; quantity: number; price: string; customization?: Record<string, string> }>;
      shippingAddress: { name: string; street1: string; street2?: string; city: string; state: string; postalCode: string; country: string };
      customerNotes?: string;
      isGift: boolean;
      giftMessage?: string;
      dashboardUrl: string;
    };

    const html = wrapTemplate(`
      <h1 style="color:${COLORS.grayDark};font-size:24px;margin:0 0 16px;">New Order: ${d.orderNumber}</h1>
      <p style="color:${COLORS.grayBody};font-size:16px;margin:0 0 24px;">
        Hi ${d.partnerName}, you have a new order to fulfill.
      </p>
      ${button("View in Dashboard", d.dashboardUrl)}
    `, `New order ${d.orderNumber} received`);

    const text = `New order ${d.orderNumber} - view in dashboard: ${d.dashboardUrl}`;
    return { html, text };
  },

  partner_welcome: (_data) => {
    const html = wrapTemplate(`<p>Welcome to the partner program</p>`);
    return { html, text: "Welcome partner" };
  },
};
