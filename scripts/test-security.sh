#!/bin/bash

# =====================================================
# Security Testing Script
# =====================================================
# Run this script to verify all security measures
# are working correctly before production deployment
# =====================================================

set -e

echo "🔒 Starting Security Tests..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Get base URL from environment or use localhost
BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "Testing against: $BASE_URL"
echo ""

# =====================================================
# Test 1: Security Headers
# =====================================================
echo "Test 1: Security Headers"
echo "------------------------"

HEADERS=$(curl -s -I "$BASE_URL" || echo "ERROR")

check_header() {
  local header=$1
  if echo "$HEADERS" | grep -q "$header"; then
    echo -e "${GREEN}✓${NC} $header present"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $header missing"
    ((FAILED++))
  fi
}

check_header "X-Frame-Options"
check_header "X-Content-Type-Options"
check_header "Strict-Transport-Security"
check_header "Referrer-Policy"

echo ""

# =====================================================
# Test 2: Rate Limiting
# =====================================================
echo "Test 2: Rate Limiting"
echo "---------------------"

echo "Testing login rate limit (5 attempts max)..."

RATE_LIMIT_HIT=false
for i in {1..7}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' 2>/dev/null || echo "000")

  if [ "$STATUS" = "429" ]; then
    RATE_LIMIT_HIT=true
    break
  fi
  sleep 0.5
done

if [ "$RATE_LIMIT_HIT" = true ]; then
  echo -e "${GREEN}✓${NC} Rate limiting working (HTTP 429 received)"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠${NC} Rate limiting may not be working (no 429 received)"
  ((FAILED++))
fi

echo ""

# =====================================================
# Test 3: File Upload Security
# =====================================================
echo "Test 3: File Upload Security"
echo "----------------------------"

# Check if storage bucket policies are mentioned in docs
if [ -f "supabase/migrations/storage_policies.sql" ]; then
  echo -e "${GREEN}✓${NC} Storage policies file exists"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Storage policies file missing"
  ((FAILED++))
fi

echo ""

# =====================================================
# Test 4: RLS Policies
# =====================================================
echo "Test 4: RLS Policies"
echo "--------------------"

if [ -f "supabase/migrations/enable_rls_policies.sql" ]; then
  echo -e "${GREEN}✓${NC} RLS policies file exists"
  ((PASSED++))

  # Check if policies cover all tables
  TABLES=("members" "users" "transactions" "settlements" "settlement_cycles" "admin_manual_overrides" "audit_logs" "member_applications")

  for table in "${TABLES[@]}"; do
    if grep -q "ON $table FOR" "supabase/migrations/enable_rls_policies.sql"; then
      echo -e "  ${GREEN}✓${NC} Policies for $table table"
      ((PASSED++))
    else
      echo -e "  ${RED}✗${NC} Missing policies for $table table"
      ((FAILED++))
    fi
  done
else
  echo -e "${RED}✗${NC} RLS policies file missing"
  ((FAILED++))
fi

echo ""

# =====================================================
# Test 5: Environment Variables
# =====================================================
echo "Test 5: Environment Variables"
echo "-----------------------------"

if [ -f ".env.local" ]; then
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" ".env.local"; then
    echo -e "${GREEN}✓${NC} Supabase URL configured"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} Supabase URL missing"
    ((FAILED++))
  fi

  if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" ".env.local"; then
    echo -e "${GREEN}✓${NC} Supabase Anon Key configured"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} Supabase Anon Key missing"
    ((FAILED++))
  fi
else
  echo -e "${YELLOW}⚠${NC} .env.local not found (may be in production)"
fi

echo ""

# =====================================================
# Test 6: Security Utilities
# =====================================================
echo "Test 6: Security Utilities"
echo "--------------------------"

if [ -f "src/lib/security/sanitize.ts" ]; then
  echo -e "${GREEN}✓${NC} Input sanitization utilities exist"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Input sanitization utilities missing"
  ((FAILED++))
fi

if [ -f "src/lib/security/headers.ts" ]; then
  echo -e "${GREEN}✓${NC} Security headers configuration exists"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Security headers configuration missing"
  ((FAILED++))
fi

if [ -f "src/middleware/rateLimit.ts" ]; then
  echo -e "${GREEN}✓${NC} Rate limiting middleware exists"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Rate limiting middleware missing"
  ((FAILED++))
fi

echo ""

# =====================================================
# Test 7: Documentation
# =====================================================
echo "Test 7: Security Documentation"
echo "-------------------------------"

if [ -f "SECURITY_DEPLOYMENT_GUIDE.md" ]; then
  echo -e "${GREEN}✓${NC} Security deployment guide exists"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Security deployment guide missing"
  ((FAILED++))
fi

echo ""

# =====================================================
# Test Results
# =====================================================
echo "======================================"
echo "Security Test Results"
echo "======================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All security tests passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Review SECURITY_DEPLOYMENT_GUIDE.md"
  echo "2. Apply RLS policies in Supabase"
  echo "3. Configure storage bucket security"
  echo "4. Test in staging environment"
  echo "5. Deploy to production"
  exit 0
else
  echo -e "${RED}✗ Some security tests failed${NC}"
  echo "Please review and fix the issues above before deploying to production."
  exit 1
fi
