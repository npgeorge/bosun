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
        amount_usd: 100
      }
    ];

    const positions = calculateNetPositions(transactions);

    expect(positions.size).toBe(2);
    expect(positions.get('alice')?.netAmount).toBe(-100);
    expect(positions.get('bob')?.netAmount).toBe(100);
  });

  it('should calculate net positions for multiple transactions between same parties', () => {
    const transactions = [
      {
        id: '1',
        from_member_id: 'alice',
        to_member_id: 'bob',
        amount_usd: 100
      },
      {
        id: '2',
        from_member_id: 'bob',
        to_member_id: 'alice',
        amount_usd: 60
      }
    ];

    const positions = calculateNetPositions(transactions);

    expect(positions.size).toBe(2);
    // Alice pays 100, receives 60 = -40 net
    expect(positions.get('alice')?.netAmount).toBe(-40);
    // Bob receives 100, pays 60 = +40 net
    expect(positions.get('bob')?.netAmount).toBe(40);
  });

  it('should handle circular transactions (A->B->C->A)', () => {
    const transactions = [
      {
        id: '1',
        from_member_id: 'alice',
        to_member_id: 'bob',
        amount_usd: 100
      },
      {
        id: '2',
        from_member_id: 'bob',
        to_member_id: 'charlie',
        amount_usd: 100
      },
      {
        id: '3',
        from_member_id: 'charlie',
        to_member_id: 'alice',
        amount_usd: 100
      }
    ];

    const positions = calculateNetPositions(transactions);

    expect(positions.size).toBe(3);
    // In a perfect circular flow, all net to zero
    expect(positions.get('alice')?.netAmount).toBe(0);
    expect(positions.get('bob')?.netAmount).toBe(0);
    expect(positions.get('charlie')?.netAmount).toBe(0);
  });

  it('should handle complex multi-party scenario', () => {
    const transactions = [
      { id: '1', from_member_id: 'alice', to_member_id: 'bob', amount_usd: 100 },
      { id: '2', from_member_id: 'alice', to_member_id: 'charlie', amount_usd: 50 },
      { id: '3', from_member_id: 'bob', to_member_id: 'charlie', amount_usd: 75 },
      { id: '4', from_member_id: 'charlie', to_member_id: 'david', amount_usd: 200 },
      { id: '5', from_member_id: 'david', to_member_id: 'alice', amount_usd: 25 }
    ];

    const positions = calculateNetPositions(transactions);

    expect(positions.size).toBe(4);

    // Alice: pays 100+50, receives 25 = -125
    expect(positions.get('alice')?.netAmount).toBe(-125);

    // Bob: receives 100, pays 75 = +25
    expect(positions.get('bob')?.netAmount).toBe(25);

    // Charlie: receives 50+75, pays 200 = -75
    expect(positions.get('charlie')?.netAmount).toBe(-75);

    // David: receives 200, pays 25 = +175
    expect(positions.get('david')?.netAmount).toBe(175);

    // Verify the sum of all net positions is zero (conservation)
    const sum = Array.from(positions.values()).reduce((acc, p) => acc + p.netAmount, 0);
    expect(sum).toBe(0);
  });

  it('should handle empty transaction array', () => {
    const transactions: any[] = [];
    const positions = calculateNetPositions(transactions);
    expect(positions.size).toBe(0);
  });

  it('should handle decimal amounts correctly', () => {
    const transactions = [
      {
        id: '1',
        from_member_id: 'alice',
        to_member_id: 'bob',
        amount_usd: 100.50
      },
      {
        id: '2',
        from_member_id: 'bob',
        to_member_id: 'alice',
        amount_usd: 50.25
      }
    ];

    const positions = calculateNetPositions(transactions);

    expect(positions.get('alice')?.netAmount).toBe(-50.25);
    expect(positions.get('bob')?.netAmount).toBe(50.25);
  });

  it('should track transactions for each member', () => {
    const transactions = [
      { id: '1', from_member_id: 'alice', to_member_id: 'bob', amount_usd: 100 },
      { id: '2', from_member_id: 'alice', to_member_id: 'charlie', amount_usd: 50 }
    ];

    const positions = calculateNetPositions(transactions);

    const alicePosition = positions.get('alice');
    expect(alicePosition?.transactions).toHaveLength(2);
    expect(alicePosition?.transactions.map(t => t.id)).toEqual(['1', '2']);
  });
});

describe('generateSettlements', () => {
  it('should generate single settlement for simple scenario', () => {
    const positions = new Map([
      ['alice', { memberId: 'alice', netAmount: -100, transactions: [] }],
      ['bob', { memberId: 'bob', netAmount: 100, transactions: [] }]
    ]);

    const settlements = generateSettlements(positions);

    expect(settlements).toHaveLength(1);
    expect(settlements[0]).toEqual({
      fromMemberId: 'alice',
      toMemberId: 'bob',
      amount: 100
    });
  });

  it('should generate multiple settlements for complex scenario', () => {
    const positions = new Map([
      ['alice', { memberId: 'alice', netAmount: -150, transactions: [] }],
      ['bob', { memberId: 'bob', netAmount: 50, transactions: [] }],
      ['charlie', { memberId: 'charlie', netAmount: 100, transactions: [] }]
    ]);

    const settlements = generateSettlements(positions);

    // Should generate 2 settlements: alice pays both bob and charlie
    expect(settlements).toHaveLength(2);

    // Verify total amounts match
    const alicePays = settlements
      .filter(s => s.fromMemberId === 'alice')
      .reduce((sum, s) => sum + s.amount, 0);
    expect(alicePays).toBe(150);

    const bobReceives = settlements
      .filter(s => s.toMemberId === 'bob')
      .reduce((sum, s) => sum + s.amount, 0);
    expect(bobReceives).toBe(50);

    const charlieReceives = settlements
      .filter(s => s.toMemberId === 'charlie')
      .reduce((sum, s) => sum + s.amount, 0);
    expect(charlieReceives).toBe(100);
  });

  it('should handle scenario with multiple payers and receivers', () => {
    const positions = new Map([
      ['alice', { memberId: 'alice', netAmount: -100, transactions: [] }],
      ['bob', { memberId: 'bob', netAmount: -50, transactions: [] }],
      ['charlie', { memberId: 'charlie', netAmount: 75, transactions: [] }],
      ['david', { memberId: 'david', netAmount: 75, transactions: [] }]
    ]);

    const settlements = generateSettlements(positions);

    // Verify conservation: total paid equals total received
    const totalPaid = settlements.reduce((sum, s) => sum + s.amount, 0);
    const totalReceived = Array.from(positions.values())
      .filter(p => p.netAmount > 0)
      .reduce((sum, p) => sum + p.netAmount, 0);

    expect(totalPaid).toBe(totalReceived);
    expect(totalPaid).toBe(150);
  });

  it('should generate no settlements when all positions are zero', () => {
    const positions = new Map([
      ['alice', { memberId: 'alice', netAmount: 0, transactions: [] }],
      ['bob', { memberId: 'bob', netAmount: 0, transactions: [] }]
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
      ['alice', { memberId: 'alice', netAmount: -200, transactions: [] }],
      ['bob', { memberId: 'bob', netAmount: -100, transactions: [] }],
      ['charlie', { memberId: 'charlie', netAmount: 150, transactions: [] }],
      ['david', { memberId: 'david', netAmount: 150, transactions: [] }]
    ]);

    const settlements = generateSettlements(positions);

    const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0);
    const totalDebts = Array.from(positions.values())
      .filter(p => p.netAmount < 0)
      .reduce((sum, p) => sum + Math.abs(p.netAmount), 0);

    expect(totalSettled).toBe(totalDebts);
    expect(totalSettled).toBe(300);
  });

  it('should minimize number of settlements compared to original transactions', () => {
    // Circular flow: A->B->C->A (3 original transactions)
    const transactions = [
      { id: '1', from_member_id: 'alice', to_member_id: 'bob', amount_usd: 100 },
      { id: '2', from_member_id: 'bob', to_member_id: 'charlie', amount_usd: 100 },
      { id: '3', from_member_id: 'charlie', to_member_id: 'alice', amount_usd: 100 }
    ];

    const positions = calculateNetPositions(transactions);
    const settlements = generateSettlements(positions);

    // After netting, should need 0 settlements (all net to zero)
    expect(settlements).toHaveLength(0);
    expect(settlements.length).toBeLessThan(transactions.length);
  });

  it('should handle decimal amounts in settlements', () => {
    const positions = new Map([
      ['alice', { memberId: 'alice', netAmount: -100.50, transactions: [] }],
      ['bob', { memberId: 'bob', netAmount: 100.50, transactions: [] }]
    ]);

    const settlements = generateSettlements(positions);

    expect(settlements).toHaveLength(1);
    expect(settlements[0].amount).toBe(100.50);
  });
});

describe('calculateSavings', () => {
  it('should calculate savings correctly for typical scenario', () => {
    const result = calculateSavings(
      10, // original 10 transactions
      3,  // netted to 3 settlements
      1000 // total volume $1000
    );

    // Wire fees: 1000 * 0.025 = 25
    expect(result.originalFees).toBe(25);

    // Bosun fees: 1000 * 0.008 = 8
    expect(result.nettedFees).toBe(8);

    // Savings: 25 - 8 = 17
    expect(result.savings).toBe(17);

    // Savings percentage: (17 / 25) * 100 = 68%
    expect(result.savingsPercentage).toBe(68);
  });

  it('should handle zero volume', () => {
    const result = calculateSavings(5, 2, 0);

    expect(result.originalFees).toBe(0);
    expect(result.nettedFees).toBe(0);
    expect(result.savings).toBe(0);
    expect(result.savingsPercentage).toBeNaN(); // 0/0 = NaN
  });

  it('should calculate savings for high volume scenario', () => {
    const result = calculateSavings(
      100,
      10,
      1000000 // $1M volume
    );

    expect(result.originalFees).toBe(25000); // 2.5% of 1M
    expect(result.nettedFees).toBe(8000);    // 0.8% of 1M
    expect(result.savings).toBe(17000);
    expect(result.savingsPercentage).toBe(68);
  });

  it('should handle decimal volumes correctly', () => {
    const result = calculateSavings(
      5,
      2,
      1234.56
    );

    expect(result.originalFees).toBeCloseTo(30.864, 3);
    expect(result.nettedFees).toBeCloseTo(9.87648, 5);
    expect(result.savings).toBeCloseTo(20.98752, 5);
  });

  it('should show consistent savings percentage regardless of volume', () => {
    const result1 = calculateSavings(10, 3, 1000);
    const result2 = calculateSavings(10, 3, 10000);
    const result3 = calculateSavings(10, 3, 100000);

    // Savings percentage should be the same (68%) for all
    expect(result1.savingsPercentage).toBe(result2.savingsPercentage);
    expect(result2.savingsPercentage).toBe(result3.savingsPercentage);
    expect(result1.savingsPercentage).toBe(68);
  });

  it('should verify wire fee is 2.5% and bosun fee is 0.8%', () => {
    const volume = 1000;
    const result = calculateSavings(1, 1, volume);

    expect(result.originalFees).toBe(volume * 0.025);
    expect(result.nettedFees).toBe(volume * 0.008);
  });
});

describe('netting integration tests', () => {
  it('should demonstrate full netting workflow', () => {
    // Real-world scenario: 4 members with cross transactions
    const transactions = [
      { id: '1', from_member_id: 'alice', to_member_id: 'bob', amount_usd: 1000 },
      { id: '2', from_member_id: 'bob', to_member_id: 'charlie', amount_usd: 800 },
      { id: '3', from_member_id: 'charlie', to_member_id: 'david', amount_usd: 600 },
      { id: '4', from_member_id: 'david', to_member_id: 'alice', amount_usd: 400 },
      { id: '5', from_member_id: 'alice', to_member_id: 'charlie', amount_usd: 200 }
    ];

    // Step 1: Calculate net positions
    const positions = calculateNetPositions(transactions);

    // Verify positions
    expect(positions.get('alice')?.netAmount).toBe(-800);  // pays 1200, receives 400
    expect(positions.get('bob')?.netAmount).toBe(200);     // receives 1000, pays 800
    expect(positions.get('charlie')?.netAmount).toBe(400); // receives 1000, pays 600
    expect(positions.get('david')?.netAmount).toBe(200);   // receives 600, pays 400

    // Step 2: Generate settlements
    const settlements = generateSettlements(positions);

    // Should reduce from 5 transactions to fewer settlements
    expect(settlements.length).toBeLessThan(transactions.length);

    // Verify conservation
    const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0);
    const totalDebts = Array.from(positions.values())
      .filter(p => p.netAmount < 0)
      .reduce((sum, p) => sum + Math.abs(p.netAmount), 0);
    expect(totalSettled).toBe(totalDebts);

    // Step 3: Calculate savings
    const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount_usd, 0);
    const savings = calculateSavings(
      transactions.length,
      settlements.length,
      totalVolume
    );

    expect(savings.savings).toBeGreaterThan(0);
    expect(savings.savingsPercentage).toBeGreaterThan(0);
  });

  it('should handle perfect netting scenario (all cancel out)', () => {
    const transactions = [
      { id: '1', from_member_id: 'alice', to_member_id: 'bob', amount_usd: 100 },
      { id: '2', from_member_id: 'bob', to_member_id: 'alice', amount_usd: 100 }
    ];

    const positions = calculateNetPositions(transactions);
    const settlements = generateSettlements(positions);

    // Perfect netting: both members net to zero
    expect(positions.get('alice')?.netAmount).toBe(0);
    expect(positions.get('bob')?.netAmount).toBe(0);

    // No settlements needed!
    expect(settlements).toHaveLength(0);
  });
});
