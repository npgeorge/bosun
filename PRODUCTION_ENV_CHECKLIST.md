# Production Environment Variables Checklist

Use this checklist to gather all required environment variables for deploying to Vercel.

---

## Required Variables (Must Have)

### 1. Supabase Configuration
**Where to get:** [supabase.com/dashboard](https://supabase.com/dashboard) → Your Project → Settings → API

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**Instructions:**
- [ ] Go to Supabase dashboard
- [ ] Select your project (or create new one)
- [ ] Settings → API
- [ ] Copy "Project URL" → paste as `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copy "Project API keys" → "anon/public" → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### 2. Application URL
**Where to set:** Use your domain

```bash
NEXT_PUBLIC_APP_URL=https://bosun.global
```

**Instructions:**
- [ ] Use exactly: `https://bosun.global`
- [ ] No trailing slash

---

### 3. Email Configuration (Resend)
**Where to get:** [resend.com/api-keys](https://resend.com/api-keys)

```bash
RESEND_API_KEY=
EMAIL_FROM="Bosun <notifications@bosun.global>"
EMAIL_REPLY_TO=support@bosun.global
```

**Instructions:**
- [ ] Sign up at [resend.com](https://resend.com) (free tier: 100 emails/day)
- [ ] Go to API Keys
- [ ] Click "Create API Key"
- [ ] Name it: "Bosun Production"
- [ ] Copy the key (starts with `re_`)
- [ ] Paste as `RESEND_API_KEY`

**For EMAIL_FROM:**
- **Option A (Quick Start)**: Use `"Bosun <onboarding@resend.dev>"` - works immediately
- **Option B (Production)**: Use `"Bosun <notifications@bosun.global>"` - requires domain verification (we'll do this in Step 5)

---

## Optional Variables (Recommended for Production)

### 4. Sentry Error Tracking
**Where to get:** [sentry.io](https://sentry.io)

```bash
NEXT_PUBLIC_SENTRY_DSN=
```

**Instructions:**
- [ ] Sign up at [sentry.io](https://sentry.io) (free tier available)
- [ ] Create new project → Platform: Next.js
- [ ] Copy the DSN (looks like: `https://xxx@xxx.ingest.sentry.io/xxx`)
- [ ] Paste as `NEXT_PUBLIC_SENTRY_DSN`

**Skip for now?** Leave empty. You can add later.

---

### 5. Slack Notifications
**Where to get:** [api.slack.com/apps](https://api.slack.com/apps)

```bash
SLACK_WEBHOOK_URL=
```

**Instructions:**
- [ ] Go to Slack workspace
- [ ] Create incoming webhook: [api.slack.com/apps](https://api.slack.com/apps)
- [ ] Click "Create New App" → "From scratch"
- [ ] Enable "Incoming Webhooks"
- [ ] Add webhook to workspace
- [ ] Copy webhook URL (starts with `https://hooks.slack.com/...`)
- [ ] Paste as `SLACK_WEBHOOK_URL`

**Skip for now?** Leave empty. You can add later.

---

## Summary: Copy-Paste Template for Vercel

Once you have all values, you'll paste these into Vercel:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key-here
NEXT_PUBLIC_APP_URL=https://bosun.global
RESEND_API_KEY=re_...your-key-here
EMAIL_FROM="Bosun <notifications@bosun.global>"
EMAIL_REPLY_TO=support@bosun.global

# Optional (can add later)
NEXT_PUBLIC_SENTRY_DSN=https://...
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

---

## Quick Start: Minimum Required

To get deployed quickly, you only need these 4:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=https://bosun.global
RESEND_API_KEY=
```

For EMAIL_FROM, start with Resend's test domain:
```bash
EMAIL_FROM="Bosun <onboarding@resend.dev>"
EMAIL_REPLY_TO=onboarding@resend.dev
```

You can upgrade to custom domain later.

---

## Verification Checklist

Before deploying, verify:

- [ ] All required variables are filled in
- [ ] No trailing spaces in values
- [ ] URLs start with `https://` (not `http://`)
- [ ] Supabase keys are from production project (not example values)
- [ ] Resend API key starts with `re_`

---

## Next Steps

1. ✅ Fill in all values above
2. ➡️ Go to Vercel and add these as environment variables
3. ➡️ Deploy your application
4. ➡️ Configure DNS
5. ➡️ Test everything

---

**Last Updated:** November 6, 2025
**Status:** Ready to use ✅
