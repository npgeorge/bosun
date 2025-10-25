# Monitoring & Alerts Setup Guide

Complete guide to setting up Sentry error tracking and Slack notifications for the Bosun platform.

## Overview

The monitoring system consists of two main components:

1. **Sentry** - Error tracking and performance monitoring
2. **Slack** - Real-time admin alerts via webhooks

## Part 1: Sentry Setup (5 minutes)

### Step 1: Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up for a free account (100k events/month free)
3. Create a new project:
   - Platform: **Next.js**
   - Alert frequency: **On every new issue**
   - Project name: **bosun**

### Step 2: Get Your DSN

1. After project creation, copy your **DSN** (Data Source Name)
2. It looks like: `https://abc123@o123456.ingest.sentry.io/7891011`

### Step 3: Configure Environment Variables

Add to your `.env.local`:

```bash
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
```

### Step 4: Verify Installation

The Sentry SDK is already configured in:
- `sentry.client.config.ts` - Client-side tracking
- `sentry.server.config.ts` - Server-side tracking
- `sentry.edge.config.ts` - Edge runtime tracking

Sentry will automatically:
- Capture unhandled errors
- Track API performance
- Monitor slow queries
- Capture session replays (10% of sessions, 100% with errors)

### Step 5: Test Sentry (Optional)

Create a test error to verify Sentry is working:

```bash
# In your browser console on the dashboard page:
throw new Error("Sentry test error")
```

Check your Sentry dashboard - you should see the error within seconds.

## Part 2: Slack Setup (3 minutes)

### Step 1: Create Slack Webhook

1. Go to your Slack workspace
2. Click **Apps** → **Add apps**
3. Search for **Incoming Webhooks**
4. Click **Add to Slack**
5. Choose a channel (e.g., `#bosun-alerts` or `#general`)
6. Click **Add Incoming WebHooks integration**

### Step 2: Copy Webhook URL

You'll get a webhook URL like:
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

### Step 3: Configure Environment Variable

Add to your `.env.local`:

```bash
SLACK_WEBHOOK_URL=your-slack-webhook-url-here
```

### Step 4: Test Slack Notifications

Run this in your terminal:

```bash
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "🚀 Bosun monitoring is now active!",
    "username": "Bosun Bot",
    "icon_emoji": ":ship:"
  }'
```

You should see a message in your Slack channel immediately.

## What Gets Monitored?

### Sentry Captures:

- ✅ All unhandled JavaScript errors (client & server)
- ✅ API route errors and performance
- ✅ Database query errors
- ✅ Authentication failures
- ✅ Session replays when errors occur
- ✅ Performance metrics (slow API calls, render times)

### Slack Alerts For:

**Critical Events:**
- 🚨 Settlement processing failures
- ⚠️ Circuit breaker triggers (safety limits exceeded)
- 💰 High-value transactions (potential fraud)

**Success Events:**
- ✅ Settlement cycles completed
- ✅ Member applications approved
- ❌ Member applications rejected

**Daily Summaries:**
- 📊 Transaction volume
- 📊 Settlement statistics
- 📊 New members
- 📊 Error counts

## Alert Examples

### Settlement Complete
```
✅ Settlement Completed
━━━━━━━━━━━━━━━━━━━━━━
Cycle ID: abc-123
Transactions: 47
Settlements: 12
Total Volume: $125,000
Efficiency: 74.5%
Processing Time: 1.23s
```

### Circuit Breaker Triggered
```
⚠️ Circuit Breaker Triggered
━━━━━━━━━━━━━━━━━━━━━━
Settlement Halted - Safety Limits Exceeded

Total Volume: $5,200,000
Member Count: 15

Violations:
• Total volume exceeds $5M limit (5200000 > 5000000)

Action Required: Review and adjust limits if needed
```

### Settlement Failed
```
🚨 Settlement Failed
━━━━━━━━━━━━━━━━━━━━━━
Error: Database connection timeout
Stage: settlement_processing

IMMEDIATE ACTION REQUIRED
```

## Customization

### Adjusting Sentry Sample Rates

Edit `sentry.server.config.ts` and `sentry.client.config.ts`:

```typescript
// Current: 10% in production
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

// High traffic? Reduce to 5%
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

// Need more data? Increase to 25%
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.25 : 1.0,
```

### Customizing Slack Messages

Edit `/src/lib/monitoring/slack.ts` to customize:
- Alert thresholds (e.g., high-value transaction amount)
- Message formatting
- Alert channels
- Emoji and styling

### Adding New Alerts

Example: Alert when a member is created

```typescript
// In /src/lib/monitoring/slack.ts
export async function alertNewMember(params: {
  companyName: string
  memberType: string
  creditLimit: number
}) {
  return sendSlackMessage({
    text: '🆕 New Member Created',
    attachments: [
      {
        color: 'good',
        title: 'New Member Onboarded',
        fields: [
          {
            title: 'Company',
            value: params.companyName,
            short: true,
          },
          {
            title: 'Type',
            value: params.memberType,
            short: true,
          },
          {
            title: 'Credit Limit',
            value: `$${params.creditLimit.toLocaleString()}`,
            short: false,
          },
        ],
        footer: 'Bosun Platform',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  })
}
```

Then call it in your API route:

```typescript
alertNewMember({
  companyName: member.company_name,
  memberType: member.member_type,
  creditLimit: member.credit_limit,
}).catch(err => console.error('Failed to send Slack alert:', err))
```

## Production Checklist

Before deploying to production:

- [ ] Sentry DSN configured in production environment
- [ ] Slack webhook configured in production environment
- [ ] Test Sentry error capture in staging
- [ ] Test Slack webhook delivery
- [ ] Set up Sentry alerts (email/Slack integration)
- [ ] Create dedicated Slack channel for alerts (recommended: `#bosun-alerts`)
- [ ] Adjust Sentry sample rates based on expected traffic
- [ ] Document on-call procedures for critical alerts

## Cost Breakdown

### Sentry Pricing
- **Free Tier**: 10k errors/month, 100k transactions/month
- **Estimated usage**: ~2-5k errors/month, ~50k transactions/month
- **Cost**: $0/month (well within free tier)
- **Paid plans**: Start at $26/month if you exceed free tier

### Slack Pricing
- **Webhooks**: Free (unlimited messages)
- **Cost**: $0/month

**Total monitoring cost: $0/month**

## Troubleshooting

### Sentry Not Capturing Errors

1. **Check DSN is set:**
   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. **Check Sentry initialization:**
   - Open browser console
   - Look for `Sentry is enabled` or check `window.__SENTRY__`

3. **Verify environment:**
   - Development errors are logged to console but NOT sent to Sentry (by design)
   - Test in production or staging environment

### Slack Alerts Not Working

1. **Check webhook URL:**
   ```bash
   echo $SLACK_WEBHOOK_URL
   ```

2. **Test webhook manually:**
   ```bash
   curl -X POST $SLACK_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test message"}'
   ```

3. **Check logs:**
   - Look for `Slack notification sent successfully` in server logs
   - Check for error messages: `Failed to send Slack message`

4. **Verify webhook is not revoked:**
   - Go to Slack workspace settings
   - Check that webhook is still active

### Alerts Are Too Noisy

1. **Adjust thresholds** in `/src/lib/monitoring/slack.ts`
2. **Filter by environment:**
   ```typescript
   // Only alert in production
   if (process.env.NODE_ENV === 'production') {
     await sendSlackMessage(...)
   }
   ```

3. **Rate limit alerts:**
   ```typescript
   // Only alert once per hour for same error
   const lastAlert = await redis.get(`alert:${errorType}`)
   if (lastAlert) return
   await redis.set(`alert:${errorType}`, '1', 'EX', 3600)
   ```

## Next Steps

1. **Set up daily summary cron job** (optional)
   - Use Vercel Cron or external scheduler
   - Call `/api/monitoring/daily-summary` endpoint

2. **Configure Sentry alerts**
   - Go to Sentry project settings
   - Set up email alerts for critical errors
   - Integrate Sentry with Slack for error notifications

3. **Create runbook for critical alerts**
   - Document response procedures
   - Define escalation paths
   - Set up on-call schedule

## Support

- Sentry docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Slack webhooks: https://api.slack.com/messaging/webhooks
- Questions: Check `/src/lib/monitoring/slack.ts` for implementation details
