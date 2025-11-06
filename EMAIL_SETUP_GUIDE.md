# Email Notification Setup Guide

Complete guide for setting up and testing email notifications for the Bosun platform.

---

## Overview

Bosun uses **Resend** for email delivery. Beautiful HTML email templates are sent for:

1. **Settlement Completion** - Notifies members of settlement results with pay/receive amounts
2. **Application Approval** - Welcomes new members with login credentials
3. **Application Rejection** - Notifies applicants of rejection with optional reason
4. **Transaction Confirmation** (Optional - can be added later)

---

## Setup Instructions

### Step 1: Create Resend Account (5 minutes)

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
   - Free tier: 100 emails/day, 3,000 emails/month
   - Perfect for MVP testing and early production
3. Verify your email address

### Step 2: Get API Key (2 minutes)

1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it: "Bosun Production" (or "Bosun Development")
4. Copy the API key (starts with `re_`)
5. ⚠️ **Save it securely** - you won't see it again!

### Step 3: Configure Domain (10 minutes)

#### Option A: Use Resend's Test Domain (Quick Start)
For development/testing, Resend provides a test domain that works immediately.
- Emails will come from `onboarding@resend.dev`
- Use this for initial testing

#### Option B: Configure Custom Domain (Recommended for Production)

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain: `bosun.global`
4. Add DNS records to your domain registrar:
   - **SPF Record** (TXT): Authorizes Resend to send emails
   - **DKIM Record** (TXT): Cryptographic signature for email authenticity
   - **DMARC Record** (TXT): Email authentication policy
5. Wait for DNS propagation (5-30 minutes)
6. Verify domain in Resend dashboard

**DNS Records Example:**
```
Type: TXT
Host: @
Value: v=spf1 include:_spf.resend.com ~all

Type: TXT
Host: resend._domainkey
Value: [Resend will provide this]

Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@bosun.global
```

### Step 4: Configure Environment Variables (2 minutes)

Add these to your `.env.local` file:

```bash
# Email Configuration (Resend)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM="Bosun <notifications@bosun.global>"
EMAIL_REPLY_TO=support@bosun.global
```

**For development**, you can use Resend's test domain:
```bash
EMAIL_FROM="Bosun <onboarding@resend.dev>"
```

**For production**, use your verified domain:
```bash
EMAIL_FROM="Bosun <notifications@bosun.global>"
```

### Step 5: Test Email Service (5 minutes)

Run the development server:
```bash
npm run dev
```

Test each email type:

#### Test 1: Settlement Email

1. Create test transactions in dashboard
2. Go to Admin → Settlements
3. Click "Test Settlement" (simulation mode)
4. Click "Run Settlement" (real execution)
5. Check inbox for settlement completion email

#### Test 2: Application Approval Email

1. Register a new account at `/auth/register`
2. Go to Admin → Applications
3. Click "Approve Application"
4. Check inbox for approval email with login credentials

#### Test 3: Application Rejection Email

1. Create another test application
2. Click "Reject" and enter a reason
3. Check inbox for rejection email

---

## Email Templates

### 1. Settlement Completion Email

**Sent to:** All members involved in settlement

**Triggers:** After successful settlement execution

**Contains:**
- Net amount to pay or receive
- Transaction count
- Gross volume processed
- Network efficiency percentage
- Savings vs wire transfer
- Settlement ID
- Link to view details

**Colors:**
- Pay emails: Red accent (#dc2626)
- Receive emails: Green accent (#16a34a)

---

### 2. Application Approval Email

**Sent to:** New member upon approval

**Triggers:** Admin clicks "Approve Application"

**Contains:**
- Welcome message
- Login credentials (temporary password)
- Login URL
- Platform features overview
- Fee structure (0.8% Year 1)
- Settlement time (5 PM Dubai)
- Support contact

**Important:** Temporary password is auto-generated and sent once. User should change it immediately.

---

### 3. Application Rejection Email

**Sent to:** Applicant upon rejection

**Triggers:** Admin clicks "Reject" with reason

**Contains:**
- Polite rejection message
- Reason for rejection (if provided)
- Support contact for questions

---

## Troubleshooting

### Problem: "RESEND_API_KEY is not configured"

**Solution:**
1. Check `.env.local` file exists
2. Verify API key is correct (starts with `re_`)
3. Restart development server (`npm run dev`)

### Problem: Emails not being received

**Check:**
1. **Spam folder** - Resend test emails often go to spam
2. **Resend dashboard logs** - See if email was sent successfully
3. **Email address** - Verify recipient email is correct
4. **Domain verification** - Check domain is verified in Resend
5. **API key** - Ensure API key has send permissions

### Problem: Email looks broken

**Common Causes:**
1. **Email client CSS support** - Some clients strip CSS
2. **Dark mode** - Test in both light/dark modes
3. **Mobile rendering** - Test on mobile devices

**Solution:**
- Emails are designed with inline styles for maximum compatibility
- Test in multiple clients (Gmail, Outlook, Apple Mail)

### Problem: "Failed to send email" in logs

**Debug Steps:**
1. Check Resend API status: [status.resend.com](https://status.resend.com)
2. Verify API key is valid
3. Check rate limits (100 emails/day on free tier)
4. Review Resend dashboard for error details

---

## Production Checklist

Before deploying to production:

- [ ] Custom domain configured in Resend
- [ ] DNS records verified (SPF, DKIM, DMARC)
- [ ] Production API key generated
- [ ] Environment variables set in Vercel
- [ ] Test all email types in production
- [ ] Verify emails don't go to spam
- [ ] Set up email monitoring/alerts
- [ ] Configure unsubscribe handling (if needed)
- [ ] Review email deliverability score

---

## Email Deliverability Best Practices

### 1. Domain Reputation

- Use dedicated domain for transactional emails
- Don't send marketing emails from same domain
- Monitor bounce rates and spam complaints

### 2. Content Quality

- Clear, concise subject lines
- Proper HTML structure (tables for layout)
- Plain text alternative (Resend auto-generates)
- Unsubscribe link (for non-transactional emails)

### 3. Authentication

- **SPF**: Verifies sender authorization
- **DKIM**: Cryptographic email signature
- **DMARC**: Email authentication policy

All configured automatically when domain is verified in Resend.

### 4. Monitoring

Track these metrics in Resend dashboard:
- **Sent**: Total emails sent
- **Delivered**: Successfully delivered emails
- **Opened**: Email open rate (if tracking enabled)
- **Clicked**: Link click rate
- **Bounced**: Failed deliveries (hard bounces)
- **Complained**: Spam complaints

---

## Rate Limits

### Free Tier (Resend)
- **100 emails/day**
- **3,000 emails/month**
- Perfect for MVP with 5-10 members

### Pro Tier ($20/month)
- **50,000 emails/month**
- **Unlimited contacts**
- **Priority support**
- Upgrade when needed

### Calculate Your Needs

**Emails per member per month:**
- Settlements: 30 emails (daily settlement)
- Applications: 1 email (one-time)
- Transactions: ~20 emails (optional notifications)
- Total: ~50 emails/member/month

**For 40 members:**
- 40 members × 50 emails = 2,000 emails/month
- Well within free tier!

**For 100 members:**
- 100 members × 50 emails = 5,000 emails/month
- Upgrade to Pro tier recommended

---

## Email Testing Tools

### 1. Resend Logs
View all sent emails in Resend dashboard:
- Email content
- Delivery status
- Bounce/complaint tracking

### 2. Email Previews
Test email rendering:
- [Litmus](https://litmus.com) - Email testing platform
- [Email on Acid](https://www.emailonacid.com) - Email preview tool
- Gmail preview (most common client)

### 3. Spam Testing
Check spam score:
- [Mail Tester](https://www.mail-tester.com)
- [GlockApps](https://glockapps.com)

---

## Customization

### Changing Email Templates

Email templates are in `/src/lib/email/service.ts`. Each function returns HTML.

**To modify:**
1. Find the function (e.g., `sendSettlementCompleteEmail`)
2. Edit the HTML template in the `html` variable
3. Test thoroughly in multiple email clients

**Design Guidelines:**
- Use inline styles (required for email)
- Tables for layout (better email client support)
- Max width 600px for readability
- Test in Gmail, Outlook, Apple Mail

### Adding New Email Types

Create new function in `/src/lib/email/service.ts`:

```typescript
export async function sendCustomEmail(params: {
  to: string
  subject: string
  // ... other params
}): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <!-- Your HTML template here -->
    </html>
  `

  return sendEmail({ to: params.to, subject, html })
}
```

Then use it in your API routes or components.

---

## Support & Resources

### Resend Documentation
- [Resend Docs](https://resend.com/docs)
- [API Reference](https://resend.com/docs/api-reference/introduction)
- [Domain Setup](https://resend.com/docs/dashboard/domains/introduction)

### Email Best Practices
- [Really Good Emails](https://reallygoodemails.com) - Inspiration
- [Email Markup Guide](https://www.campaignmonitor.com/css/) - CSS support
- [MJML Framework](https://mjml.io) - Email framework (optional)

### Support Contacts
- **Resend Support:** support@resend.com
- **Bosun Email Issues:** Log in `src/lib/email/service.ts`

---

## Cost Analysis

### Development (Free Tier)
- **Cost:** $0/month
- **Limit:** 100 emails/day, 3,000/month
- **Perfect for:** MVP testing, 5-10 members

### Production (Pro Tier)
- **Cost:** $20/month
- **Limit:** 50,000 emails/month
- **Perfect for:** 40-100 members, Year 1 target

### Scale (Business Tier)
- **Cost:** Custom pricing
- **Limit:** 100,000+ emails/month
- **Perfect for:** Year 2+ with 90+ members

**ROI:** $20/month for email service that enables $72M Year 1 revenue = excellent investment!

---

## Frequently Asked Questions

### Q: Can I use SendGrid or another service?

A: Yes! The code is abstracted. Just modify `/src/lib/email/service.ts` to use a different provider. Resend is recommended for its simplicity and generous free tier.

### Q: How do I prevent emails from going to spam?

A:
1. Verify custom domain in Resend
2. Configure SPF, DKIM, DMARC records
3. Avoid spammy content (excessive caps, multiple exclamation marks)
4. Send from reputable domain
5. Monitor bounce rates

### Q: Can I disable emails temporarily?

A: Yes, comment out the email calls in API routes or set `RESEND_API_KEY=` to empty string. Emails will fail silently without breaking the application.

### Q: How do I track email opens/clicks?

A: Resend supports tracking. Enable in dashboard settings. Consider privacy implications for transactional emails.

### Q: What if Resend is down?

A: Email failures are logged but don't block critical operations (settlements, approvals). Check logs and resend manually if needed.

---

**Last Updated:** October 25, 2025
**Version:** 1.0
**Status:** Production-Ready ✅
