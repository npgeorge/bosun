# Security Deployment Guide

**CRITICAL**: This guide MUST be completed before deploying to production.

## Overview

This guide walks through enabling all security features for the Bosun platform, including:
- Row-Level Security (RLS) policies
- Storage bucket security
- API rate limiting
- CSRF/XSS protection
- Security headers

---

## Prerequisites

- [ ] Supabase project created (production environment)
- [ ] Admin access to Supabase dashboard
- [ ] Vercel account (for deployment)
- [ ] Domain configured (bosun.ae)

---

## Step 1: Enable Row-Level Security (RLS)

### 1.1 Access Supabase SQL Editor

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your **production** project
3. Navigate to **SQL Editor** in the left sidebar

### 1.2 Apply RLS Policies

Copy and paste the entire contents of `/supabase/migrations/enable_rls_policies.sql` into the SQL Editor and execute.

**What this does:**
- Enables RLS on all tables
- Creates helper functions (`is_admin()`, `get_user_member_id()`)
- Creates policies for each table:
  - Members: Users can only view their own record
  - Transactions: Users can only see transactions they're involved in
  - Settlements: Users can only see their own settlements
  - Admin tables: Only admins can access

### 1.3 Verify RLS is Enabled

Run this query to verify:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'members',
  'users',
  'transactions',
  'settlement_cycles',
  'settlements',
  'admin_manual_overrides',
  'audit_logs',
  'member_applications'
);
```

**Expected result:** All tables should show `rowsecurity = true`

---

## Step 2: Secure Storage Buckets

### 2.1 Configure member-documents Bucket

1. In Supabase Dashboard, go to **Storage** > **member-documents**
2. Click **Configuration** tab
3. Set the following:
   - **Public bucket**: OFF (CRITICAL!)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `application/pdf`, `image/jpeg`, `image/png`

### 2.2 Apply Storage Policies

1. Click **Policies** tab
2. Delete any existing policies (if the bucket was public before)
3. Copy each policy from `/supabase/migrations/storage_policies.sql` and create them one by one:
   - "Authenticated users can upload their own documents"
   - "Admins can view all documents"
   - "Users can view their own documents"
   - "Admins can update documents"
   - "Admins can delete documents"

### 2.3 Test Storage Access

After applying policies:
- Try uploading a document as a regular user → Should work
- Try viewing another user's document → Should fail
- Login as admin → Should see all documents

---

## Step 3: Security Headers & Rate Limiting

### 3.1 Verify Security Headers

Security headers are already configured in `next.config.ts`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)

These will be automatically applied when deploying to Vercel.

### 3.2 Verify Rate Limiting

Rate limiting is configured in `src/middleware/rateLimit.ts`:
- API endpoints: 200 requests/minute (general)
- Settlement processing: 10 requests/minute
- Login: 5 attempts/minute
- Registration: 3 attempts/5 minutes

**No additional action needed** - already integrated in middleware.

---

## Step 4: Environment Variables Security

### 4.1 Production Environment Variables

In Vercel (or your deployment platform):

```bash
# Supabase (PRODUCTION ONLY)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# NEVER commit these to git
# NEVER use development credentials in production
```

### 4.2 Verify .gitignore

Ensure these are in `.gitignore`:
```
.env
.env.local
.env.production
.env.development
```

---

## Step 5: Pre-Deployment Testing

### 5.1 Test RLS Policies Locally

Create a staging environment in Supabase and test:

```bash
# 1. Copy .env.local to .env.staging
cp .env.local .env.staging

# 2. Update with staging credentials
# 3. Apply RLS policies to staging
# 4. Test all user flows
```

**Test scenarios:**

1. **Member User:**
   - Can view own transactions ✓
   - Cannot view other members' transactions ✗
   - Can create transactions ✓
   - Can view own settlements ✓
   - Cannot access admin dashboard ✗

2. **Admin User:**
   - Can view all members ✓
   - Can view all transactions ✓
   - Can approve applications ✓
   - Can run settlements ✓
   - Can view audit logs ✓

### 5.2 Test Rate Limiting

```bash
# Test login rate limit (should block after 5 attempts)
for i in {1..10}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# Expected: First 5 succeed (or fail with wrong password)
# 6th onwards should return 429 (Rate limit exceeded)
```

### 5.3 Test Security Headers

```bash
# Check security headers are present
curl -I https://your-staging-url.vercel.app

# Should see:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000
```

---

## Step 6: Deployment Checklist

### Before Deploying:

- [ ] RLS enabled on all tables (Step 1)
- [ ] Storage bucket is PRIVATE with policies (Step 2)
- [ ] Environment variables configured (Step 4)
- [ ] All tests passing (Step 5)
- [ ] Admin user created in production
- [ ] Database backups configured (hourly + daily)
- [ ] Sentry error monitoring set up (see MONITORING_GUIDE.md)
- [ ] Slack alerts configured (see MONITORING_GUIDE.md)

### Deploy:

```bash
# 1. Build production bundle
npm run build

# 2. Deploy to Vercel
vercel --prod

# 3. Verify deployment
curl -I https://bosun.ae

# 4. Test login flow
# 5. Test transaction creation
# 6. Test settlement (simulation mode first!)
```

---

## Step 7: Post-Deployment Verification

### 7.1 Security Checklist

- [ ] All pages load correctly
- [ ] Login/logout works
- [ ] Members can only see their own data
- [ ] Admins can see all data
- [ ] Rate limiting works (test with curl)
- [ ] File uploads work
- [ ] Cannot access other users' files
- [ ] Security headers present (check with curl -I)
- [ ] HTTPS enforced (http:// redirects to https://)

### 7.2 Performance Verification

- [ ] Page load time < 2 seconds
- [ ] API response time < 200ms
- [ ] No console errors in browser
- [ ] No 500 errors in Vercel logs

---

## Rollback Plan

If issues occur after deployment:

### Immediate Rollback:

```bash
# 1. Revert Vercel deployment
vercel rollback

# 2. Investigate issue in staging
# 3. Fix and re-deploy
```

### If RLS Causes Issues:

```sql
-- EMERGENCY ONLY: Temporarily disable RLS on a specific table
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing policies
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING:** Never disable RLS in production unless absolutely necessary.

---

## Security Monitoring

### Daily Checks:

1. Review Sentry error reports
2. Check Slack alerts for anomalies
3. Review failed login attempts in audit logs
4. Check rate limit violations

### Weekly Checks:

1. Review all admin actions in audit logs
2. Check for suspicious file uploads
3. Review database backup status
4. Update dependencies (security patches)

### Monthly Checks:

1. Review and rotate API keys
2. Audit user access levels
3. Review RLS policies effectiveness
4. Security penetration testing

---

## Common Issues & Solutions

### Issue: "Row-level security policy violation"

**Cause:** User trying to access data they don't have permission for.

**Solution:**
1. Verify user role in `users` table
2. Check RLS policies are correct
3. Verify `member_id` is set correctly
4. Check helper functions (`is_admin()`, `get_user_member_id()`)

### Issue: "Storage upload fails"

**Cause:** Storage bucket policies not configured correctly.

**Solution:**
1. Verify bucket is private
2. Check storage policies in Supabase dashboard
3. Ensure folder structure is `{user_id}/{filename}`
4. Verify file size < 10MB and correct MIME type

### Issue: "Rate limit triggered too frequently"

**Cause:** Rate limits set too low for production usage.

**Solution:**
1. Review rate limit config in `src/middleware/rateLimit.ts`
2. Adjust limits based on actual usage patterns
3. Consider implementing Redis for distributed rate limiting

---

## Security Contacts

**Security Issues:** Report immediately to:
- Technical Founder: [email]
- Security Lead: [email]

**Emergency Contacts:**
- Supabase Support: support@supabase.io
- Vercel Support: support@vercel.com

---

## Additional Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Vercel Security](https://vercel.com/docs/security)

---

**Last Updated:** October 25, 2025
**Version:** 1.0
**Status:** Ready for Production Deployment
