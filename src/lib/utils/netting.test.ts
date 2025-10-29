// src/lib/utils/netting.test.ts
import { describe, it, expect } from 'vitest';
import { calculateNetPositions, generateSettlements, calculateSavings } from './netting';

describe('calculateNetPositions', () => {
  it('should calculate net positions for a single transaction', () => {
    const transactions = [
      {
        id: '1',
        from_member_id: 'alice',
        to_member_id: 'bob',
        amount_cents: 10000 // $100.00
      }
    ];

    const positions = calculateNetPositions(transactions);

    expect(positions.size).toBe(2);
    expect(positions.get('alice')?.netAmountCents).toBe(-10000);
    expect(positions.get('bob')?.netAmountCents).toBe(10000);
  });

  it('should calculate net positions for multiple transactions between same parties', () => {
    const transactions = [
      {
        id: '1',
        from_member_id: 'alice',
        to_member_id: 'bob',
        amount_cents: 10000 // $100.00
      },
      {
        id: '2',
        from_member_id: 'bob',
        to_member_id: 'alice',
        amount_cents: 6000 // $60.00
      }
    ];

    const positions = calculateNetPositions(transactions);

    expect(positions.size).toBe(2);
    // Alice pays $100, receives $60 = -$40 net
    expect(positions.get('alice')?.netAmountCents).toBe(-4000);
    // Bob receives $100, pays $60 = +$40 net
    expect(positions.get('bob')?.netAmountCents).toBe(4000);
  });

  it('should handle circular transactions (A->B->C->A)', () => {
    const transactions = [
      {
        id: '1',
        from_member_id: 'alice',
        to_member_id: 'bob',
        amount_cents: 10000
      },
      {
        id: '2',
        from_member_id: 'bob',
        to_member_id: 'charlie',
        amount_cents: 10000
      },
      {
        id: '3',
        from_member_id: 'charlie',
        to_member_id: 'alice',
        amount_cents: 10000
      }
    ];

    const positions = calculateNetPositions(transactions);

    expect(positions.size).toBe(3);
    // In a perfect circular flow, all net to zero
    expect(positions.get('alice')?.netAmountCents).toBe(0);
    expect(positions.get('bob')?.netAmountCents).toBe(0);
    expect(positions.get('charlie')?.netAmountCents).toBe(0);
  });

  it('should handle complex multi-party scenario', () => {
    const transactions = [
      { id: '1', from_member_id: 'alice', to_member_id: 'bob', amount_cents: 10000 },
      { id: '2', from_member_id: 'alice', to_member_id: 'charlie', amount_cents: 5000 },
      { id: '3', from_member_id: 'bob', to_member_id: 'charlie', amount_cents: 7500 },
      { id: '4', from_member_id: 'charlie', to_member_id: 'david', amount_cents: 20000 },
      { id: '5', from_member_id: 'david', to_member_id: 'alice', amount_cents: 2500 }
    ];

    const positions = calculateNetPositions(transactions);

    expect(positions.size).toBe(4);

    // Alice: pays $100+$50, receives $25 = -$125
    expect(positions.get('alice')?.netAmountCents).toBe(-12500);

    // Bob: receives $100, pays $75 = +$25
    expect(positions.get('bob')?.netAmountCents).toBe(2500);

    // Charlie: receives $50+$75, pays $200 = -$75
    expect(positions.get('charlie')?.netAmountCents).toBe(-7500);

    // David: receives $200, pays $25 = +$175
    expect(positions.get('david')?.netAmountCents).toBe(17500);

    // Verify the sum of all net positions is zero (conservation)
    const sum = Array.from(positions.values()).reduce((acc, p) => acc + p.netAmountCents, 0);
    expect(sum).toBe(0);
  });

  it('should handle empty transaction array', () => {
    const transactions: any[] = [];
    const positions = calculateNetPositions(transactions);
    expect(positions.size).toBe(0);
  });

  it('should handle decimal amounts correctly (using cents)', () => {
    const transactions = [
      {
        id: '1',
        from_member_id: 'alice',
        to_member_id: 'bob',
        amount_cents: 10050 // $100.50
      },
      {
        id: '2',
        from_member_id: 'bob',
        to_member_id: 'alice',
        amount_cents: 5025 // $50.25
      }
    ];

    const positions = calculateNetPositions(transactions);

    expect(positions.get('alice')?.netAmountCents).toBe(-5025); // -$50.25
    expect(positions.get('bob')?.netAmountCents).toBe(5025); // +$50.25
  });

  it('should track transactions for each member', () => {
    const transactions = [
      { id: '1', from_member_id: 'alice', to_member_id: 'bob', amount_cents: 10000 },
      { id: '2', from_member_id: 'alice', to_member_id: 'charlie', amount_cents: 5000 }
    ];

    const positions = calculateNetPositions(transactions);

    const alicePosition = positions.get('alice');
    expect(alicePosition?.transactions).toHaveLength(2);
    expect(alicePosition?.transactions.map(t => t.id)).toEqual(['1', '2']);
  });

  it('should prevent floating-point errors with integer arithmetic', () => {
    // This would cause floating-point errors with decimal math
    const transactions = [
      { id: '1', from_member_id: 'alice', to_member_id: 'bob', amount_cents: 10 }, // $0.10
      { id: '2', from_member_id: 'alice', to_member_id: 'bob', amount_cents: 20 }, // $0.20
    ];

    const positions = calculateNetPositions(transactions);

    // With integer math: -10 + -20 = -30 (exact)
    // With float math: -0.1 + -0.2 = -0.30000000000000004 (imprecise)
    expect(positions.get('alice')?.netAmountCents).toBe(-30);
    expect(positions.get('bob')?.netAmountCents).toBe(30);
  });
});

describe('generateSettlements', () => {
  it('should generate single settlement for simple scenario', () => {
    const positions = new Map([
      ['alice', { memberId: 'alice', netAmountCents: -10000, transactions: [] }],
      ['bob', { memberId: 'bob', netAmountCents: 10000, transactions: [] }]
    ]);

    const settlements = generateSettlements(positions);

    expect(settlements).toHaveLength(1);
    expect(settlements[0].fromMemberId).toBe('alice');
    expect(settlements[0].toMemberId).toBe('bob');
    expect(settlements[0].amountCents).toBe(10000);
  });

  it('should include settlement metadata', () => {
    const positions = new Map([
      ['alice', { memberId: 'alice', netAmountCents: -10000, transactions: [
        { id: 'tx1', from_member_id: 'alice', to_member_id: 'bob', amount_cents: 10000 }
      ] }],
      ['bob', { memberId: 'bob', netAmountCents: 10000, transactions: [
        { id: 'tx1', from_member_id: 'alice', to_member_id: 'bob', amount_cents: 10000 }
      ] }]
    ]);

    const settlements = generateSettlements(positions);

    expect(settlements).toHaveLength(1);

    // Check settlement ID format: STL-YYYYMMDD-NNNN
    expect(settlements[0].settlementId).toMatch(/^STL-\d{8}-\d{4}$/);

    // Check source transaction tracking
    expect(settlements[0].sourceTransactionIds).toEqual(['tx1']);

    // Check timestamp is ISO format
    expect(settlements[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should generate multiple settlements for complex scenario', () => {
    const positions = new Map([
      ['alice', { memberId: 'alice', netAmountCents: -15000, transactions: [] }],
      ['bob', { memberId: 'bob', netAmountCents: 5000, transactions: [] }],
      ['charlie', { memberId: 'charlie', netAmountCents: 10000, transactions: [] }]
    ]);

    const settlements = generateSettlements(positions);

    // Should generate 2 settlements: alice pays both bob and charlie
    expect(settlements).toHaveLength(2);

    // Verify total amounts match
    const alicePays = settlements
      .filter(s => s.fromMemberId === 'alice')
      .reduce((sum, s) => sum + s.amountCents, 0);
    expect(alicePays).toBe(15000);

    const bobReceives = settlements
      .filter(s => s.toMemberId === 'bob')
      .reduce((sum, s) => sum + s.amountCents, 0);
    expect(bobReceives).toBe(5000);

    const charlieReceives = settlements
      .filter(s => s.toMemberId === 'charlie')
      .reduce((sum, s) => sum + s.amountCents, 0);
    expect(charlieReceives).toBe(10000);
  });

  it('should track source transactions across multiple settlements', () => {
    const positions = new Map([
      ['alice', { memberId: 'alice', netAmountCents: -10000, transactions: [
        { id: 'tx1', from_member_id: 'alice', to_member_id: 'bob', amount_cents: 5000 },
        { id: 'tx2', from_member_id: 'alice', to_member_id: 'charlie', amount_cents: 5000 }
      ] }],
      ['bob', { memberId: 'bob', netAmountCents: 5000, transactions: [
        { id: 'tx1', from_member_id: 'alice', to_member_id: 'bob', amount_cents: 5000 }
      ] }],
      ['charlie', { memberId: 'charlie', netAmountCents: 5000, transactions: [
        { id: 'tx2', from_member_id: 'alice', to_member_id: 'charlie', amount_cents: 5000 }
      ] }]
    ]);

    const settlements = generateSettlements(positions);

    expect(settlements).toHaveLength(2);

    // Each settlement should track its relevant source transactions
    const settlement1 = settlements.find(s => s.toMemberId === 'bob');
    const settlement2 = settlements.find(s => s.toMemberId === 'charlie');

    expect(settlement1?.sourceTransactionIds).toContain('tx1');
    expect(settlement2?.sourceTransactionIds).toContain('tx2');
  });

  it('should handle scenario with multiple payers and receivers', () => {
    const positions = new Map([
      ['alice', { memberId: 'alice', netAmountCents: -10000, transactions: [] }],
      ['bob', { memberId: 'bob', netAmountCents: -5000, transactions: [] }],
      ['charlie', { memberId: 'charlie', netAmountCents: 7500, transactions: [] }],
      ['david', { memberId: 'david', netAmountCents: 7500, transactions: [] }]
    ]);

    const settlements = generateSettlements(positions);

    // Verify conservation: total paid equals total received
    const totalPaid = settlements.reduce((sum, s) => sum + s.amountCents, 0);
    const totalReceived = Array.from(positions.values())
      .filter(p => p.netAmountCents > 0)
      .reduce((sum, p) => sum + p.netAmountCents, 0);

    expect(totalPaid).toBe(totalReceived);
    expect(totalPaid).toBe(15000);
  });

  it('should generate no settlements when all positions are zero', () => {
    const positions = new Map([
      ['alice', { memberId: 'alice', netAmountCents: 0, transactions: [] }],
      ['bob', { memberId: 'bob', netAmountCents: 0, transactions: [] }]
    ]);

    const settlements = generateSettlements(positions);
    expect(settlements).toHaveLength(0);
  });

  it('should handle empty positions map', () => {
    const positions = new Map();
    const settlements = generateSettlements(positions);
    expect(settlements).toHaveLength(0);
  });

  it('should verify conservation property (sum of settlements equals sum of debts)', () => {
    const positions = new Map([
      ['alice', { memberId: 'alice', netAmountCents: -20000, transactions: [] }],
      ['bob', { memberId: 'bob', netAmountCents: -10000, transactions: [] }],
      ['charlie', { memberId: 'charlie', netAmountCents: 15000, transactions: [] }],
      ['david', { memberId: 'david', netAmountCents: 15000, transactions: [] }]
    ]);

    const settlements = generateSettlements(positions);

    const totalSettled = settlements.reduce((sum, s) => sum + s.amountCents, 0);
    const totalDebts = Array.from(positions.values())
      .filter(p => p.netAmountCents < 0)
      .reduce((sum, p) => sum + Math.abs(p.netAmountCents), 0);

    expect(totalSettled).toBe(totalDebts);
    expect(totalSettled).toBe(30000);
  });

  it('should minimize number of settlements compared to original transactions', () => {
    // Circular flow: A->B->C->A (3 original transactions)
    const transactions = [
      { id: '1', from_member_id: 'alice', to_member_id: 'bob', amount_cents: 10000 },
      { id: '2', from_member_id: 'bob', to_member_id: 'charlie', amount_cents: 10000 },
      { id: '3', from_member_id: 'charlie', to_member_id: 'alice', amount_cents: 10000 }
    ];

    const positions = calculateNetPositions(transactions);
    const settlements = generateSettlements(positions);

    // After netting, should need 0 settlements (all net to zero)
    expect(settlements).toHaveLength(0);
    expect(settlements.length).toBeLessThan(transactions.length);
  });

  it('should handle decimal amounts in settlements (using cents)', () => {
    const positions = new Map([
      ['alice', { memberId: 'alice', netAmountCents: -10050, transactions: [] }], // -$100.50
      ['bob', { memberId: 'bob', netAmountCents: 10050, transactions: [] }] // +$100.50
    ]);

    const settlements = generateSettlements(positions);

    expect(settlements).toHaveLength(1);
    expect(settlements[0].amountCents).toBe(10050);
  });

  it('should generate sequential settlement IDs', () => {
    const positions = new Map([
      ['alice', { memberId: 'alice', netAmountCents: -15000, transactions: [] }],
      ['bob', { memberId: 'bob', netAmountCents: 5000, transactions: [] }],
      ['charlie', { memberId: 'charlie', netAmountCents: 10000, transactions: [] }]
    ]);

    const settlements = generateSettlements(positions);

    expect(settlements).toHaveLength(2);
    expect(settlements[0].settlementId).toMatch(/-0001$/);
    expect(settlements[1].settlementId).toMatch(/-0002$/);
  });
});

describe('calculateSavings', () => {
  it('should calculate savings correctly for typical scenario', () => {
    const result = calculateSavings(
      10, // original 10 transactions
      3,  // netted to 3 settlements
      100000 // total volume $1000 = 100000 cents
    );

    // Wire fees: 100000 * 0.025 = 2500 cents = $25
    expect(result.originalFeesCents).toBe(2500);

    // Bosun fees: 100000 * 0.008 = 800 cents = $8
    expect(result.nettedFeesCents).toBe(800);

    // Savings: 2500 - 800 = 1700 cents = $17
    expect(result.savingsCents).toBe(1700);

    // Savings percentage: (1700 / 2500) * 100 = 68%
    expect(result.savingsPercentage).toBe(68);
  });

  it('should handle zero volume', () => {
    const result = calculateSavings(5, 2, 0);

    expect(result.originalFeesCents).toBe(0);
    expect(result.nettedFeesCents).toBe(0);
    expect(result.savingsCents).toBe(0);
    expect(result.savingsPercentage).toBe(0);
  });

  it('should calculate savings for high volume scenario', () => {
    const result = calculateSavings(
      100,
      10,
      100000000 // $1M = 100,000,000 cents
    );

    expect(result.originalFeesCents).toBe(2500000); // $25,000
    expect(result.nettedFeesCents).toBe(800000);    // $8,000
    expect(result.savingsCents).toBe(1700000);      // $17,000
    expect(result.savingsPercentage).toBe(68);
  });

  it('should handle decimal volumes correctly with rounding', () => {
    const result = calculateSavings(
      5,
      2,
      123456 // $1234.56
    );

    expect(result.originalFeesCents).toBe(3086); // Math.round(123456 * 0.025)
    expect(result.nettedFeesCents).toBe(988);    // Math.round(123456 * 0.008)
    expect(result.savingsCents).toBe(2098);
  });

  it('should show consistent savings percentage regardless of volume', () => {
    const result1 = calculateSavings(10, 3, 100000);    // $1,000
    const result2 = calculateSavings(10, 3, 1000000);   // $10,000
    const result3 = calculateSavings(10, 3, 10000000);  // $100,000

    // Savings percentage should be the same (68%) for all
    expect(result1.savingsPercentage).toBe(result2.savingsPercentage);
    expect(result2.savingsPercentage).toBe(result3.savingsPercentage);
    expect(result1.savingsPercentage).toBe(68);
  });

  it('should verify wire fee is 2.5% and bosun fee is 0.8%', () => {
    const volume = 100000; // $1000
    const result = calculateSavings(1, 1, volume);

    expect(result.originalFeesCents).toBe(Math.round(volume * 0.025));
    expect(result.nettedFeesCents).toBe(Math.round(volume * 0.008));
  });
});

describe('netting integration tests', () => {
  it('should demonstrate full netting workflow with cents', () => {
    // Real-world scenario: 4 members with cross transactions
    const transactions = [
      { id: '1', from_member_id: 'alice', to_member_id: 'bob', amount_cents: 100000 },     // $1000
      { id: '2', from_member_id: 'bob', to_member_id: 'charlie', amount_cents: 80000 },    // $800
      { id: '3', from_member_id: 'charlie', to_member_id: 'david', amount_cents: 60000 },  // $600
      { id: '4', from_member_id: 'david', to_member_id: 'alice', amount_cents: 40000 },    // $400
      { id: '5', from_member_id: 'alice', to_member_id: 'charlie', amount_cents: 20000 }   // $200
    ];

    // Step 1: Calculate net positions
    const positions = calculateNetPositions(transactions);

    // Verify positions
    expect(positions.get('alice')?.netAmountCents).toBe(-80000);  // pays $1200, receives $400
    expect(positions.get('bob')?.netAmountCents).toBe(20000);     // receives $1000, pays $800
    expect(positions.get('charlie')?.netAmountCents).toBe(40000); // receives $1000, pays $600
    expect(positions.get('david')?.netAmountCents).toBe(20000);   // receives $600, pays $400

    // Step 2: Generate settlements
    const settlements = generateSettlements(positions);

    // Should reduce from 5 transactions to fewer settlements
    expect(settlements.length).toBeLessThan(transactions.length);

    // Verify all settlements have metadata
    settlements.forEach(settlement => {
      expect(settlement.settlementId).toBeDefined();
      expect(settlement.sourceTransactionIds).toBeDefined();
      expect(settlement.createdAt).toBeDefined();
    });

    // Verify conservation
    const totalSettled = settlements.reduce((sum, s) => sum + s.amountCents, 0);
    const totalDebts = Array.from(positions.values())
      .filter(p => p.netAmountCents < 0)
      .reduce((sum, p) => sum + Math.abs(p.netAmountCents), 0);
    expect(totalSettled).toBe(totalDebts);

    // Step 3: Calculate savings
    const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount_cents, 0);
    const savings = calculateSavings(
      transactions.length,
      settlements.length,
      totalVolume
    );

    expect(savings.savingsCents).toBeGreaterThan(0);
    expect(savings.savingsPercentage).toBeGreaterThan(0);
  });

  it('should handle perfect netting scenario (all cancel out)', () => {
    const transactions = [
      { id: '1', from_member_id: 'alice', to_member_id: 'bob', amount_cents: 10000 },
      { id: '2', from_member_id: 'bob', to_member_id: 'alice', amount_cents: 10000 }
    ];

    const positions = calculateNetPositions(transactions);
    const settlements = generateSettlements(positions);

    // Perfect netting: both members net to zero
    expect(positions.get('alice')?.netAmountCents).toBe(0);
    expect(positions.get('bob')?.netAmountCents).toBe(0);

    // No settlements needed!
    expect(settlements).toHaveLength(0);
  });

  it('should provide complete audit trail through settlement metadata', () => {
    const transactions = [
      { id: 'TX001', from_member_id: 'alice', to_member_id: 'bob', amount_cents: 50000 },
      { id: 'TX002', from_member_id: 'alice', to_member_id: 'charlie', amount_cents: 30000 },
    ];

    const positions = calculateNetPositions(transactions);
    const settlements = generateSettlements(positions);

    // Verify we can trace back to original transactions
    settlements.forEach(settlement => {
      expect(settlement.sourceTransactionIds.length).toBeGreaterThan(0);

      // All source transaction IDs should exist in original transactions
      settlement.sourceTransactionIds.forEach(txId => {
        expect(transactions.some(t => t.id === txId)).toBe(true);
      });
    });
  });
});
