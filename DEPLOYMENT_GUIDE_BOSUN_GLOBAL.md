# Deploying Bosun to bosun.global

Complete step-by-step guide to deploy your Bosun application to **bosun.global** using Vercel and Cloudflare.

---

## Prerequisites

- ✅ Domain purchased: bosun.global (from Cloudflare)
- ✅ Cloudflare account with domain access
- ✅ Vercel account (free tier works great)
- ✅ Supabase project set up
- ✅ Code ready to deploy

---

## Part 1: Deploy to Vercel (15 minutes)

### Step 1: Connect GitHub Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository:
   - If this is your first time: Click **"Import Git Repository"**
   - Select the repository containing your Bosun code
   - Click **"Import"**

### Step 2: Configure Build Settings

Vercel should auto-detect Next.js. Verify these settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### Step 3: Add Environment Variables

Click **"Environment Variables"** and add these (get values from your setup):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Application URL (will update after domain setup)
NEXT_PUBLIC_APP_URL=https://bosun.global

# Email Configuration (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM="Bosun <notifications@bosun.global>"
EMAIL_REPLY_TO=support@bosun.global

# Monitoring (Optional)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SLACK_WEBHOOK_URL=your-slack-webhook-url
```

**Where to get these:**
- **Supabase**: Dashboard → Settings → API
- **Resend**: resend.com → API Keys
- **Sentry**: sentry.io → Settings → Projects
- **Slack**: api.slack.com/apps → Incoming Webhooks

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `your-project.vercel.app`
4. Test it! Click "Visit" to see your app live

---

## Part 2: Configure Cloudflare DNS (10 minutes)

### Step 1: Get Vercel DNS Records

In your Vercel project:

1. Go to **Settings** → **Domains**
2. Enter: `bosun.global`
3. Click **"Add"**
4. Vercel will show you DNS records to add

You should see something like:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 2: Add DNS Records in Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select your domain: **bosun.global**
3. Click **DNS** in the left sidebar
4. Add the records Vercel provided:

#### For Root Domain (@):

Click **"Add record"**:
- **Type**: A
- **Name**: `@`
- **IPv4 address**: `76.76.21.21` (from Vercel)
- **Proxy status**: ⚠️ **DNS only** (turn off orange cloud for now)
- Click **Save**

#### For WWW Subdomain:

Click **"Add record"**:
- **Type**: CNAME
- **Name**: `www`
- **Target**: `cname.vercel-dns.com` (from Vercel)
- **Proxy status**: ⚠️ **DNS only** (turn off orange cloud for now)
- Click **Save**

**Important:** Start with "DNS only" (gray cloud). You can enable Cloudflare's proxy later if needed, but it can complicate initial setup.

### Step 3: Wait for DNS Propagation

- DNS changes typically take 5-30 minutes
- Sometimes up to 24 hours in rare cases
- You can check status at: [dnschecker.org](https://dnschecker.org)

### Step 4: Verify Domain in Vercel

1. Back in Vercel → Settings → Domains
2. You should see **bosun.global** in the list
3. Wait for verification checkmark ✓
4. Vercel will automatically provision SSL certificate

---

## Part 3: Configure Email Domain (20 minutes)

### Option A: Use Resend with Custom Domain

#### Step 1: Add Domain to Resend

1. Go to [resend.com](https://resend.com) dashboard
2. Click **Domains** → **Add Domain**
3. Enter: `bosun.global`
4. Resend will provide DNS records

#### Step 2: Add Email DNS Records to Cloudflare

Back in Cloudflare DNS, add the records Resend provides:

**SPF Record:**
```
Type: TXT
Name: @
Content: v=spf1 include:_spf.resend.com ~all
TTL: Auto
```

**DKIM Record:**
```
Type: TXT
Name: resend._domainkey
Content: [Resend will provide this long string]
TTL: Auto
```

**DMARC Record:**
```
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=none; rua=mailto:dmarc@bosun.global
TTL: Auto
```

#### Step 3: Verify Domain in Resend

1. Wait 5-10 minutes for DNS propagation
2. In Resend dashboard, click **Verify** next to bosun.global
3. Once verified, emails will come from `notifications@bosun.global`

### Option B: Use Resend's Test Domain (Quick Start)

For testing, skip custom domain setup and use:

```bash
EMAIL_FROM="Bosun <onboarding@resend.dev>"
```

You can migrate to custom domain later.

---

## Part 4: Security & Performance (10 minutes)

### Enable HTTPS (Automatic)

Vercel automatically provisions SSL certificates. Verify:

1. Visit `https://bosun.global`
2. Check for 🔒 lock icon in browser
3. Should show "Connection is secure"

### Configure Security Headers (Already Done)

Your `next.config.ts` already includes:
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ CSP (Content Security Policy)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options

No additional work needed!

### Optional: Enable Cloudflare Proxy

After everything works, you can enable Cloudflare's proxy for:
- DDoS protection
- CDN acceleration
- Analytics

To enable:
1. Go to Cloudflare DNS
2. Click the cloud icon next to your A and CNAME records
3. Change from "DNS only" (gray) to "Proxied" (orange)

**Note:** This can sometimes interfere with Vercel's SSL. Only enable after confirming basic setup works.

---

## Part 5: Production Checklist

Before going live, verify:

### Environment Variables ✓
- [ ] `NEXT_PUBLIC_APP_URL=https://bosun.global`
- [ ] All Supabase keys are production keys (not dev keys)
- [ ] Resend API key is configured
- [ ] Email addresses use `@bosun.global`

### Database & Security ✓
- [ ] Supabase RLS policies enabled (see `supabase/migrations/`)
- [ ] Production Supabase project created
- [ ] Database migrations applied
- [ ] Row-level security tested

### Email ✓
- [ ] Domain verified in Resend
- [ ] Test settlement email sent successfully
- [ ] Test application approval email sent
- [ ] Emails not going to spam folder

### Monitoring ✓
- [ ] Sentry DSN configured for error tracking
- [ ] Slack webhook configured for admin alerts
- [ ] Test error tracking with intentional error

### Performance ✓
- [ ] Run `npm run build` locally to check for errors
- [ ] Verify build completes in Vercel without warnings
- [ ] Test site on mobile devices
- [ ] Check page load times

### DNS ✓
- [ ] `bosun.global` resolves correctly
- [ ] `www.bosun.global` redirects to root domain
- [ ] SSL certificate is valid (🔒 in browser)
- [ ] Check DNS propagation globally: [dnschecker.org](https://dnschecker.org)

---

## Part 6: Common Issues & Troubleshooting

### Issue: "Domain not found" in browser

**Solution:**
- DNS hasn't propagated yet (wait 30 minutes)
- Check Cloudflare DNS records are correct
- Verify nameservers are pointing to Cloudflare

### Issue: "Certificate Invalid" or SSL errors

**Solution:**
- Vercel needs time to provision certificate (wait 10 minutes)
- Check domain is verified in Vercel
- Ensure Cloudflare proxy is off (gray cloud) initially

### Issue: Vercel can't verify domain

**Solution:**
- Make sure DNS records exactly match Vercel's requirements
- Turn off Cloudflare proxy (use "DNS only" mode)
- Wait for DNS propagation, then click "Refresh" in Vercel

### Issue: Emails not sending

**Solution:**
- Verify `RESEND_API_KEY` is set in Vercel environment variables
- Check Resend dashboard for error logs
- Ensure domain is verified in Resend
- Test with Resend's test domain first: `onboarding@resend.dev`

### Issue: 500 Internal Server Error

**Check Vercel Logs:**
1. Go to Vercel project → **Deployments**
2. Click latest deployment
3. Click **Functions** tab
4. Check runtime logs for errors

**Common causes:**
- Missing environment variables
- Database connection issues
- Supabase keys incorrect

---

## Part 7: Post-Deployment

### Update Your .env.local

After deployment, update your local `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=https://bosun.global
```

Restart dev server: `npm run dev`

### Test Production Application

1. **User Registration**: `/auth/register`
   - Create test account
   - Verify email arrives

2. **Admin Dashboard**: `/admin`
   - Log in with admin account
   - Test application approval
   - Run test settlement

3. **Transactions**: `/transactions`
   - Create test transaction
   - Verify it appears in dashboard

4. **Settlements**: `/admin/settlements`
   - Run settlement cycle
   - Check email notifications sent

### Monitor Performance

**Vercel Analytics:**
- Go to project → **Analytics**
- Check page load times
- Monitor error rates

**Sentry Error Tracking:**
- Go to [sentry.io](https://sentry.io)
- Check for runtime errors
- Set up alerts for critical issues

**Supabase Monitoring:**
- Dashboard → **Database**
- Check query performance
- Monitor connection pool usage

---

## Quick Reference: DNS Records

Here's what your Cloudflare DNS should look like when complete:

| Type | Name | Content | Proxy Status | Purpose |
|------|------|---------|--------------|---------|
| A | @ | 76.76.21.21 | DNS only | Root domain |
| CNAME | www | cname.vercel-dns.com | DNS only | WWW subdomain |
| TXT | @ | v=spf1 include:_spf.resend.com ~all | DNS only | Email auth (SPF) |
| TXT | resend._domainkey | [long DKIM value] | DNS only | Email auth (DKIM) |
| TXT | _dmarc | v=DMARC1; p=none; rua=mailto:dmarc@bosun.global | DNS only | Email policy |

---

## Support Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Cloudflare Docs**: [developers.cloudflare.com](https://developers.cloudflare.com)
- **Resend Docs**: [resend.com/docs](https://resend.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

---

## Summary: What You'll Have

After completing this guide:

- ✅ **Live Application**: https://bosun.global
- ✅ **SSL/HTTPS**: Automatic with Vercel
- ✅ **Email**: notifications@bosun.global
- ✅ **Monitoring**: Sentry error tracking
- ✅ **Performance**: Vercel edge network
- ✅ **Security**: RLS policies, rate limiting, CSP headers
- ✅ **Database**: Production Supabase with backups

**Estimated Total Time:** 60-90 minutes

**Cost:**
- Vercel: Free tier (sufficient for MVP)
- Cloudflare: Free (domain registration separate)
- Resend: Free tier (100 emails/day)
- Supabase: Free tier (500MB database)
- **Total: $0/month** for infrastructure

---

**Last Updated:** November 6, 2025
**Version:** 1.0
**Status:** Production-Ready ✅

Good luck with your deployment! 🚀
