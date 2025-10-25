# Bosun Platform Specification (Optimized)

## Overview
Bosun is a settlement netting platform for maritime trade that reduces transaction costs by 85% through multilateral netting and Bitcoin L1 settlement via institutional OTC desks.

## Core Value Proposition
- **Problem**: Maritime trade participants lose $75B annually to inefficient settlement (wire fees 2-3%, FX markup, working capital costs, settlement delays)
- **Solution**: Bitcoin settlement rails via OTC desks reduce costs from 2.5% to 0.4-0.8%, with hidden multilateral netting providing additional operational margin
- **Market Size**: $655B global TAM (freight $395B, oil/tankers $130B, bunkers $130B); targeting $200B MENA region initially
- **Pricing**: Pure transaction fee model (0.8% Year 1, 0.6% Year 2, 0.4% Year 3+), no monthly platform fees - aligns with industry norms and removes adoption friction. Hidden volume discounts applied automatically.
- **Target Users**: Ship owners, charterers, bunker suppliers, oil traders, freight forwarders

## Product Goals
1. **Primary Goal**: Process $9B gross volume in Year 1 with 40 members
2. **Revenue Goal**: $72M Year 1 revenue (97% gross margin before operating costs)
3. **Customer Value Goal**: Deliver 70-85% cost savings vs traditional wire transfers
4. **Efficiency Goal**: Achieve 40% netting efficiency in Year 1, scaling to 85% by Year 10 (internal optimization)
5. **Speed Goal**: Once-daily initially (Week 1-5), twice-daily by Week 6 (10-20 minute confirmations) vs 3-5 day wire transfers
6. **Automation Goal**: AI handles 70-80% of operations with 2-3 person team in Year 1
7. **Launch Goal**: First revenue by Week 4 (4-week MVP), full platform by Week 8

## Success Criteria
- **Week 4**: First revenue from 5 pilot members, MVP launched
- **Week 8**: Full platform with automation, 10-15 members
- **Month 4**: 20-30 members, first profitable month
- **Month 6**: Cash flow positive with $10M+ cumulative revenue
- **Year 1**: 40 members, $9B gross volume, $72M revenue, $70.1M net profit
- **Year 2**: 90 members, $24.3B gross volume, $145.8M revenue, $140.4M net profit
- **Year 5**: 720 members, $333.79B gross volume, $1.34B revenue, $1.3B net profit
- **Operational**: Maintain 95%+ gross margins through AI automation and netting efficiency
- **Market Position**: Capture 4.5% of MENA TAM in Year 1, 15% of global TAM by Year 5
- **Sales Efficiency**: Zero-friction onboarding (no monthly fees) drives viral adoption

## Feature Requirements

### CRITICAL PATH MVP (Weeks 1-4): Revenue-Generating Core

**Philosophy**: Build minimum viable features to process first real settlements and generate revenue, then polish.

#### 1. Member Management (MVP - Simplified)
- **Registration** (Manual Approval)
  - Company profile creation (name, registration, contact email)
  - Bank details for wire transfers
  - Terms & conditions acceptance
  - Document upload (trade license, bank statement) to Supabase storage
  - **Admin manually reviews and approves** (no automated KYC initially)
  - Role assignment: Admin or Member only
  - **Defer to Week 7**: Automated Sumsub KYC, multi-entity support, graduated trust levels

- **Member Portal Dashboard** (Basic)
  - Real-time balance overview (owed/owing)
  - Transaction history (simple table with filters)
  - Next settlement countdown timer
  - **Defer to Week 6**: Savings calculator, document repository, settlement preview

#### 2. Transaction Recording (MVP - Manual Only)
- **Manual Entry Only**
  - Simple form: counterparty (dropdown of members), amount (USD only), reference number, trade date, description
  - Submit for confirmation
  - Basic validation: amount > 0, valid counterparty
  - **Defer to Week 5**: AI document processing (GPT-4 Vision), multi-currency, draft save, bulk upload

- **Transaction List** (Basic)
  - Simple table with status, counterparty, amount, date
  - Filter by status or counterparty
  - CSV export
  - **Defer to Week 5**: Complex filtering, bulk actions

- **Counterparty Confirmation** (Simplified)
  - Automatic email notification to counterparty
  - Accept/dispute buttons
  - **Defer to Week 5**: Comment threads, auto-accept after 48h

#### 3. Settlement Engine (MVP - Simplified Algorithm)
**CRITICAL**: Netting is a proprietary internal optimization, NOT a customer-facing feature. Members never see the algorithm, network graph, or how transactions connect. They only see: "You owe $X" or "You receive $Y" plus the fee.

**MVP Approach:**
- **Start with simple bilateral netting** (Week 2-4)
- **Add complex cycle detection** in Week 6 after MVP proven
- **Progressive disclosure**: Show "network efficiency: 42%" without explaining HOW

- **Simple Netting Algorithm** (Server-side only, completely hidden)
  ```typescript
  // Week 2-4: Start with basic bilateral netting
  function calculateNetPositions(transactions: Transaction[]): Map<string, number> {
    const positions = new Map<string, number>();
    
    for (const tx of transactions) {
      positions.set(tx.from, (positions.get(tx.from) || 0) - tx.amount);
      positions.set(tx.to, (positions.get(tx.to) || 0) + tx.amount);
    }
    
    return positions;
  }
  
  // Week 6: Add multilateral cycle detection
  // - Full DFS for complex cycles
  // - GPT-4 optimization for strategy
  // - Still completely hidden from members
  ```

- **Once-Daily Settlement Process** (MVP)
  - **5:00 PM Dubai time settlement** (once daily initially)
  - 4:00 PM: Freeze transactions
  - 4:15 PM: Calculate net positions (simple algorithm, internal process)
  - 4:30 PM: Email members their individual net position ONLY
  - **Manual OTC execution**: Admin calls OTC desk, executes trades by phone/email
  - Admin manually confirms in database
  - Email notifications: "Settlement complete, amount: $X"
  - **Week 6**: Add 12:00 PM midday batch for twice-daily settlements

- **Circuit Breakers** (Critical Safety - MVP Required)
  ```typescript
  const CIRCUIT_BREAKERS = {
    maxSettlementAmount: 10_000_000,    // $10M max per settlement
    maxMembersPerBatch: 20,             // Limit initial complexity
    minOTCSpread: 0.003,                // 0.3% minimum acceptable
    maxOTCSpread: 0.010,                // 1% maximum before halt
    settlementTimeout: 3600,            // 1 hour max processing
  };
  
  // Auto-pause and notify admin if any breached
  ```

- **Settlement Simulation Mode** (MVP Required)
  - Run parallel simulation before every real settlement
  - Preview expected gross volume, net settlement, savings
  - Admin review and approval before execution
  - Compare simulation vs actual results after completion

- **Member Settlement View** (Dead Simple - Zero Technical Details)
  - **Settlement notification contains ONLY:**
    - "Settlement Complete"
    - "Amount due: $2.08M" (or "You will receive: $3M")
    - "Confirm Payment" button
  - **That's it. No other information exposed.**
  - Members can separately view their transaction list if they want details
  - **NO**: Fee breakdown, savings calculation, network graphs, how amount calculated, netting methodology

#### 4. Bitcoin Settlement via OTC Desks

**MVP Approach (Week 4):**
- Partner with ONE OTC desk (Binance institutional or similar)
- Manual execution: Admin calls desk, executes trades, manually confirms in system
- Simple cost tracking: record spread, calculate margin

**Full Automation (Week 5-6):**
- Multi-desk integration with automated routing
- API-based execution
- Real-time price comparison

- **OTC Desk Integration** (Full Version - Week 5)
  - Partner with 3-5 institutional OTC desks (Genesis, Cumberland, Galaxy Digital, BitOasis, etc.)
  - Negotiate volume-based pricing: 0.5% Year 1, targeting 0.3% by Year 3
  - Secure API integration for trade execution
  - Automatic BTC/USD price fetching
  - Multi-desk quote comparison and best-price routing
  - Slippage protection (max 0.5%)
  - Failover to alternative desks if primary unavailable

- **Settlement Execution**
  - Member notification of net position (amount to pay/receive)
  - Execute OTC trades: USD â†’ BTC â†’ USD for each net transfer
  - On-chain confirmation tracking (1 block = 10-20 minutes)
  - Settlement receipt generation
  - Fallback to manual processing if automation fails

- **Cost Tracking & Margin Analysis**
  - Track actual OTC spread per trade
  - Calculate margin: transaction fee charged - actual OTC cost
  - Alert if margin drops below 50%
  - Monitor desk performance: execution quality, slippage, speed
  - Quarterly rate renegotiation triggers

- **Safety Features**
  - Transaction preview before execution
  - Member confirmation requirement (or auto-confirm after 30 min)
  - Maximum settlement size limits (circuit breakers)
  - Manual override capability for every automated operation
  - Comprehensive audit trail

#### 5. Billing System

**MVP Approach (Week 3):**
- Calculate 0.8% on gross obligations
- Generate simple CSV invoice
- Email with wire transfer instructions
- Manual payment tracking

**Full Automation (Week 7):**
- Automated PDF invoices
- Payment reconciliation
- Late payment reminders

- **Transaction Fee Calculation**
  - Base rate: 0.8% Year 1, 0.6% Year 2, 0.4% Year 3+
  - Calculate on gross obligations (not net settlement)
  - **Hidden volume discounts** (apply automatically, don't advertise):
    ```typescript
    const calculateFeeRate = (monthlyVolume: number, yearNumber: number): number => {
      const baseRate = yearNumber === 1 ? 0.008 : yearNumber === 2 ? 0.006 : 0.004;
      
      // Volume discounts (hidden but implemented)
      if (monthlyVolume > 100_000_000) return baseRate * 0.8;  // 20% discount
      if (monthlyVolume > 50_000_000) return baseRate * 0.9;   // 10% discount
      
      return baseRate;
    };
    ```

- **Invoicing**
  - Monthly invoice generation
  - Itemized transaction breakdown (date, counterparty, amount, fee)
  - CSV export for member accounting systems
  - PDF invoice with wire transfer instructions
  - Automated email delivery

- **Payment Processing**
  - Wire transfer instructions (primary method Year 1)
  - ACH/SEPA options (if available)
  - Payment confirmation and matching
  - Late payment reminders (7, 14, 30 days)
  - Payment history tracking

#### 6. Manual Override & Admin Controls (MVP Critical)
**Philosophy**: Every automated operation needs manual override capability for safe operations.

- **Admin Override Dashboard**
  - Manual settlement execution (bypass automation)
  - Edit settlement amounts
  - Override fee rates for specific members
  - Pause/resume settlement process
  - Manual OTC trade entry
  - All overrides logged with reason and admin user

- **Settlement Control Panel**
  - Start/stop settlement process
  - View real-time settlement status
  - Trigger member notifications manually
  - Preview settlement before execution
  - Cancel in-progress settlement if needed

#### 7. Telemetry & Monitoring (MVP Required - From Day 1)
**Philosophy**: Measure everything, optimize based on data.

- **Comprehensive Event Tracking**
  ```typescript
  // Track every critical operation
  async function executeSettlement(settlementId: string) {
    const timer = startTimer();
    
    try {
      await track('settlement.started', {
        settlementId,
        memberCount: members.length,
        grossVolume: calculateGross(),
        expectedNetVolume: calculateNet(),
      });
      
      const result = await processSettlement();
      
      await track('settlement.completed', {
        duration: timer.elapsed(),
        actualNetVolume: result.netVolume,
        nettingEfficiency: result.efficiency,
        actualSavings: result.savings,
        marginPercentage: result.margin,
        otcSpread: result.otcSpread,
      });
      
    } catch (error) {
      await track('settlement.failed', {
        error: error.message,
        stage: getCurrentStage(),
        stackTrace: error.stack,
      });
      
      await notifyAdmin('Settlement failed', {
        settlementId,
        error: error.message,
        stage: getCurrentStage(),
      });
    }
  }
  ```

- **Admin Alerts**
  - Slack webhook for critical events (settlement failure, circuit breaker trip, margin drop)
  - Email alerts for important events
  - SMS alerts for emergencies (optional)
  - Daily metrics summary

- **Error Monitoring**
  - Sentry integration for error tracking
  - Custom error boundaries
  - API error rate monitoring
  - Alert if error rate > 5%

### POLISH PHASE (Weeks 5-8): Automation & Advanced Features

#### 8. AI Document Processing (Week 5)
- **Bulk Upload Interface**
  - Drag-and-drop file upload (PDF, PNG, JPG)
  - Processing queue with progress indicators
  - Preview thumbnails

- **GPT-4 Vision Integration**
  - Send document images to GPT-4 Vision API
  - Prompt engineering for field extraction:
    ```
    Extract the following from this invoice/bill of lading:
    - Invoice/BL number
    - Issuer (from party)
    - Recipient (to party)
    - Amount and currency
    - Issue date
    - Due date
    - Line items and descriptions
    Return as structured JSON with confidence scores.
    ```
  - Parse API response into transaction fields
  - Confidence scoring (0.0 - 1.0)

- **Review & Confirmation Workflow**
  - Display extracted data with confidence scores
  - Highlight low-confidence fields (< 0.8) in yellow
  - Inline editing for corrections
  - Approve/reject buttons
  - Bulk approve for high-confidence extractions
  - Feedback loop to improve prompts over time

#### 9. Multi-Factor Authentication (Week 6)
- **MFA Implementation**
  - TOTP (Time-based One-Time Password) setup
  - SMS backup option via Twilio
  - Recovery codes generation (10 codes)
  - MFA enforcement for all users
  - Remember device option (30 days)

- **Account Security**
  - Failed login tracking
  - Suspicious activity alerts
  - IP whitelisting option for admins
  - Session management (view active sessions, force logout)

#### 10. Advanced Netting Algorithm (Week 6)
**Enhance from simple bilateral to complex multilateral optimization**

- **Full Cycle Detection**
  - Implement DFS (depth-first search) for cycle finding
  - Detect all cycles in transaction graph (Aâ†’Bâ†’Câ†’A)
  - Calculate maximum settlement for each cycle
  - Handle partial netting when full cycles unavailable
  - Priority weighting for larger settlements

- **GPT-4 Optimization**
  - Prompt: "Given these cycles: [cycles], find the combination that maximizes netting efficiency while minimizing number of settlements"
  - Linear programming solver as fallback
  - Calculate net positions for each member
  - Generate optimal settlement transfer list
  - Track gross volume for billing purposes

- **Enhanced Security for Algorithm**
  - Store algorithm code in separate private repository
  - Admin-only database tables for netting details
  - No API endpoints exposing netting logic
  - Customer support trained to say "proprietary settlement optimization" only

#### 11. Multi-Currency Support (Week 6)
- **Currency Management**
  - Support: USD, EUR, GBP, AED, SGD, CNY, JPY
  - Real-time FX rate feeds (exchangerate-api.io or similar)
  - Convert all to USD for netting calculation (internal only)
  - Apply 0.2% markup on conversions (optional service)
  - Historical rate tracking
  - Member-specific currency preferences

- **FX Display**
  - Show original currency and USD equivalent
  - Clear FX rate applied
  - Total fees including FX markup

#### 12. Twice-Daily Settlements (Week 6)
- **Midday Batch (12:00 PM Dubai time)**
  - 11:00 AM: Freeze transactions
  - 11:15 AM: Calculate net positions
  - 11:30 AM: Member notifications
  - 12:00 PM: Execute OTC trades and settlement
  - 12:20 PM: Confirmations complete (1 block)

- **End of Day Batch (5:00 PM Dubai time)**
  - 4:00 PM: Freeze transactions
  - 4:15 PM: Calculate net positions
  - 4:30 PM: Member notifications
  - 5:00 PM: Execute OTC trades and settlement
  - 5:20 PM: Confirmations complete

- **Coordination**
  - Coordinate with OTC desks for both windows
  - Automated scheduling via Supabase Edge Functions
  - Status updates at each stage
  - Member preference for which batch to use (if urgent)

#### 13. Member Dashboard Enhancements (Week 6 - Progressive Disclosure)
**Show value without revealing methodology**

- **Settlement Preview**
  - Countdown to next batch (midday or end of day)
  - Estimated net position based on pending transactions
  - Projected cost (fee calculation: 0.8% on gross)
  - **Show: "Network Efficiency: 42%"** (vague metric)
  - **Show: "You saved $X through network optimization"**
  - **Don't show: HOW optimization works, netting cycles, network graphs**
  - Historical settlement performance

- **Transaction Visualization**
  - Simple transaction list (no network graph)
  - Sum of amounts owed vs owing
  - Clear display: "You owe $X, you're owed $Y"
  - Filter by status, date range, counterparty
  - Export to CSV

- **Savings Dashboard**
  - Total volume processed YTD
  - Total fees paid to Bosun (0.8%)
  - **Display gross vs net amounts** (builds trust)
  - Total savings vs wire transfers (comparison)
  - Simple bar chart showing cumulative savings
  - Monthly breakdown table
  - Year-over-year comparison

#### 14. Automated Billing & Reconciliation (Week 7)
- **Automated Invoice Generation**
  - PDF invoices with itemized breakdown
  - Transaction details: date, counterparty, amount, rate, fee
  - Total gross volume processed
  - Total fees owed
  - Effective rate (total fees / total volume)
  - Automated email delivery
  - Payment instructions included

- **Payment Reconciliation**
  - Fuzzy matching on reference numbers
  - Amount-based matching with tolerance (Â±0.01%)
  - Date proximity matching (Â±3 days)
  - GPT-4 assisted matching for unclear cases:
    ```
    Transaction A: $10,000 from Company X, ref: INV-12345, date: 2025-01-15
    Payment B: $10,000 from CompanyX Ltd, ref: Invoice 12345, date: 2025-01-16
    Are these the same? Confidence score?
    ```
  - Auto-resolution for high-confidence matches
  - Manual review queue for exceptions

- **Discrepancy Detection**
  - Flag unmatched transactions > 7 days old
  - Highlight amount mismatches
  - Identify duplicate payments
  - Categorize discrepancies (missing payment, wrong amount, wrong counterparty)
  - Resolution workflow with comment threads

#### 15. AI-Powered Customer Support (Week 7)
- **Knowledge Base Creation**
  - Comprehensive FAQ documents
  - **Keep methodology vague**: "We use proprietary settlement optimization"
  - Platform user guide
  - How Bitcoin settlement works (twice daily at 12 PM & 5 PM)
  - Fee structure: "0.8% on all transactions"
  - How to read invoices
  - Security and compliance information
  - Common error messages and solutions
  - Video tutorials

- **Chatbot Implementation**
  - Embed chat widget in member portal
  - OpenAI Assistant API with knowledge base
  - Multi-language support (English, Arabic, Mandarin, Spanish, French)
  - Context awareness (user role, recent actions, current fee rate)
  - Conversation history storage
  - **Train to avoid revealing netting details**
  - **If asked about calculation: "Based on your transactions with counterparties. For questions, contact support."**

- **Human Escalation**
  - Escalation triggers (unresolved after 3 messages, keyword detection like "fraud" or "dispute")
  - Ticket creation system
  - Admin notification via Slack
  - Ticket assignment and tracking
  - Response time SLA: 90% < 2 hours
  - Satisfaction rating after resolution

#### 16. Automated KYC Integration (Week 7)
- **Sumsub SDK Integration**
  - Create Sumsub account and get API keys
  - Implement applicant creation flow
  - Embed Sumsub WebSDK for document upload
  - Configure verification levels (basic, advanced)

- **Webhook Handling**
  - Set up endpoint for Sumsub callbacks
  - Process verification status updates
  - Update member KYC status in database
  - Trigger email notifications

- **Document Verification Flow**
  - Trade license upload and verification
  - Beneficial ownership documentation
  - Bank account verification
  - Passport/ID verification
  - Manual review queue for edge cases
  - Compliance reporting

### FUTURE FEATURES (Year 2+)

#### 17. Premium Services (Once Platform is Essential)
**Only offer after platform becomes critical infrastructure**

- **Premium Support Package** ($5K/month)
  - Priority support queue (< 1 hour response)
  - Dedicated account manager
  - Quarterly business reviews
  - Custom reporting

- **Instant Settlement Service** ($10K/month + 0.1% fee)
  - Mid-week settlement option
  - 24-hour execution SLA
  - Priority OTC desk routing
  - Emergency settlement capability

- **Advanced Analytics Package** ($15K/month)
  - Market trend analysis
  - Route profitability insights
  - Counterparty risk scoring (aggregated, anonymized)
  - Price benchmarking
  - Predictive analytics for trade flows
  - Custom dashboards

- **API Access Tier** ($10K/month)
  - RESTful API for transaction submission
  - Webhook notifications
  - ERP system connectors (SAP, Oracle)
  - Accounting software exports (QuickBooks, Xero)
  - Dedicated API support

#### 18. Credit Facility (Year 3+)
- **Bridge Financing Service**
  - Credit line application workflow
  - Risk assessment scoring
  - 8% APR interest calculation
  - Draw-down and repayment tracking
  - Collateral management
  - Default handling procedures
  - Integration with settlements (auto-deduct repayments)

## Technical Architecture

### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js/TypeScript with Supabase
- **Database**: PostgreSQL (via Supabase)
- **Hosting**: Vercel (frontend), Supabase (backend)
- **AI**: OpenAI GPT-4 and GPT-4 Vision APIs
- **Bitcoin/OTC**: Multiple institutional OTC desk APIs
- **KYC**: Sumsub integration (Week 7+)
- **Monitoring**: Sentry (errors), custom telemetry
- **Scheduling**: Supabase Edge Functions with cron

### Database Schema (Full Version by Week 8)

**Core Tables (MVP - Week 1-4):**
```sql
-- Members
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    contact_email VARCHAR(255) NOT NULL UNIQUE,
    kyc_status VARCHAR(50) DEFAULT 'pending', -- manual approval initially
    collateral_amount DECIMAL(20, 2) DEFAULT 0,
    join_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL, -- 'admin' or 'member'
    name VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_member_id UUID REFERENCES members(id),
    to_member_id UUID REFERENCES members(id),
    amount_usd DECIMAL(20, 2) NOT NULL,
    reference_number VARCHAR(255),
    trade_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending/confirmed/settled
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Settlements
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'calculating',
    total_gross_volume DECIMAL(20, 2),
    total_net_settlement DECIMAL(20, 2),
    netting_percentage DECIMAL(5, 2),
    otc_cost_actual DECIMAL(20, 2),
    gross_margin DECIMAL(20, 2),
    is_simulation BOOLEAN DEFAULT false, -- for testing
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Settlement Transfers
CREATE TABLE settlement_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID REFERENCES settlements(id),
    from_member_id UUID REFERENCES members(id),
    to_member_id UUID REFERENCES members(id),
    gross_amount DECIMAL(20, 2),
    net_amount_usd DECIMAL(20, 2),
    transaction_fee_charged DECIMAL(20, 2),
    transaction_fee_rate DECIMAL(5, 4), -- e.g., 0.0080 for 0.8%
    created_at TIMESTAMP DEFAULT NOW()
);

-- Admin Manual Overrides
CREATE TABLE admin_manual_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID REFERENCES settlements(id),
    override_type VARCHAR(50), -- 'amount', 'status', 'fee_rate'
    original_value JSONB,
    new_value JSONB,
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

**Additional Tables (Week 5-8):**
```sql
-- Transaction Documents
CREATE TABLE transaction_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id),
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    total_transaction_fees DECIMAL(20, 2),
    total_gross_volume DECIMAL(20, 2),
    effective_rate DECIMAL(5, 4), -- actual rate after discounts
    status VARCHAR(50) DEFAULT 'draft', -- draft/sent/paid/overdue
    invoice_date DATE,
    due_date DATE,
    paid_date DATE,
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Invoice Line Items
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    amount DECIMAL(20, 2),
    fee_rate DECIMAL(5, 4),
    fee_charged DECIMAL(20, 2),
    settlement_date DATE
);

-- OTC Trades
CREATE TABLE otc_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID REFERENCES settlements(id),
    desk_name VARCHAR(100),
    usd_amount DECIMAL(20, 2),
    btc_amount DECIMAL(16, 8),
    spread_percentage DECIMAL(5, 4),
    execution_time TIMESTAMP,
    status VARCHAR(50)
);

-- Netting Cycles (ADMIN-ONLY, never exposed via member API)
CREATE TABLE netting_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID REFERENCES settlements(id),
    cycle_members UUID[],
    cycle_amount DECIMAL(20, 2),
    efficiency_gain DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Security Requirements
- **Authentication**: Email/password (MVP), MFA mandatory (Week 6+)
- **Authorization**: Role-based access control (admin vs member)
- **Data Encryption**: AES-256 for data at rest, TLS 1.3 for transit
- **API Security**: Rate limiting, JWT tokens, API key rotation
- **Financial Operations**: Idempotency keys, database transactions, audit trail
- **Compliance**: GDPR-compliant data handling, comprehensive audit logging
- **Circuit Breakers**: Max limits on all critical operations

### Performance Requirements
- **Response Time**: < 200ms for API calls, < 2s for page loads
- **Availability**: 99.5% uptime SLA (MVP), 99.9% (full platform)
- **Scalability**: Support 100 members by Year 1, 1000+ by Year 5
- **Data Retention**: 7 years for financial records (compliance)
- **Backup**: Hourly incremental, daily full backups with tested restore

### API-First Development
**Build and test APIs with Postman before building UI**

```typescript
// Core API endpoints (build these in Week 2)
const CORE_ENDPOINTS = {
  // Settlement operations
  'POST /api/settlements/simulate': 'Test settlement without executing',
  'GET /api/settlements/preview': 'What would happen if we settle now?',
  'POST /api/settlements/execute': 'Run real settlement',
  
  // Admin operations
  'POST /api/admin/override': 'Manual intervention',
  'GET /api/admin/margin-analysis': 'Real-time P&L',
  'GET /api/admin/health': 'System health check',
  
  // Member operations
  'POST /api/transactions': 'Submit transaction',
  'GET /api/transactions/:id': 'View transaction details',
  'GET /api/member/balance': 'Current position',
  
  // Monitoring
  'GET /api/health/otc-desks': 'OTC desk status',
  'GET /api/metrics/settlement': 'Settlement metrics',
};
```

## Regulatory Compliance
- **Dubai DIFC**: Company incorporation
- **VARA License**: Virtual asset regulatory authority approval (begin application Month 2)
- **AML/KYC**: Automated compliance screening (Sumsub, Week 7+)
- **Data Protection**: UAE and international data privacy laws
- **Financial Reporting**: Audit-ready transaction logs

## Market Entry Strategy
- **Year 1**: Dubai/MENA maritime hub (40 members, Dubai-Singapore-China triangle, $9B volume)
- **Year 2**: Singapore (MAS license), Cayman (tax optimization) (90 members, $24.3B volume)
- **Year 3**: Partial US entry (5-10 state MTLs, $200K via InnReg), EU (MiCA framework) (180 members, $58.32B)
- **Year 4-5**: Global expansion, network effects dominance (720 members by Year 5, $333.79B)

## Risk Mitigation
- **Technology**: Start simple (4-week MVP), add complexity gradually, manual overrides for everything
- **Financial**: Circuit breakers on all operations, simulation mode before real execution, comprehensive monitoring
- **Regulatory**: Begin in crypto-friendly jurisdictions, partner with licensed entities, proactive compliance
- **Credit**: 10% collateral requirement, graduated trust based on history
- **Competition**: Network effects create moat, AI development speed advantage, hidden netting optimization
- **Operations**: Measure everything from Day 1, fail safely with circuit breakers, iterate based on data

## Development Philosophy
1. **Week 1-4**: Build minimum viable features to generate first real revenue
2. **Week 5-8**: Automate what worked manually, add advanced features
3. **Ongoing**: Measure everything, optimize based on data, iterate rapidly
4. **Safety**: Manual override for every automated operation, circuit breakers everywhere
5. **Transparency**: Show members value (savings, efficiency) without revealing methodology
6. **Simplicity**: Start simple, add complexity only when proven necessary

## Success Metrics
- **Week 4**: First real settlement with paying customers
- **Week 8**: 10-15 members, $500M+ volume processed
- **Month 6**: 30-40 members, $6B+ volume, cash flow positive
- **Year 1**: 40 members, $9B volume, $72M revenue, 97% gross margin