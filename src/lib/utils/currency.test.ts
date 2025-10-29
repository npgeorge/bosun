// src/lib/utils/currency.test.ts
import { describe, it, expect } from 'vitest';
import {
  dollarsToCents,
  centsToDollars,
  formatCurrency,
  calculatePercentage,
  sumAmounts,
  isValidAmount
} from './currency';

describe('dollarsToCents', () => {
  it('should convert whole dollars to cents', () => {
    expect(dollarsToCents(1)).toBe(100);
    expect(dollarsToCents(10)).toBe(1000);
    expect(dollarsToCents(100)).toBe(10000);
  });

  it('should convert decimal dollars to cents', () => {
    expect(dollarsToCents(1.50)).toBe(150);
    expect(dollarsToCents(9.99)).toBe(999);
    expect(dollarsToCents(0.01)).toBe(1);
  });

  it('should handle zero', () => {
    expect(dollarsToCents(0)).toBe(0);
  });

  it('should round to nearest cent (handles floating point precision)', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JavaScript
    expect(dollarsToCents(0.1 + 0.2)).toBe(30);

    // Test rounding behavior
    expect(dollarsToCents(1.234)).toBe(123); // rounds down
    expect(dollarsToCents(1.235)).toBe(124); // rounds up
    expect(dollarsToCents(1.236)).toBe(124); // rounds up
  });

  it('should handle large amounts', () => {
    expect(dollarsToCents(1000000)).toBe(100000000);
    expect(dollarsToCents(10000000)).toBe(1000000000);
  });

  it('should handle very small decimal amounts', () => {
    expect(dollarsToCents(0.001)).toBe(0);  // rounds to 0 cents
    expect(dollarsToCents(0.004)).toBe(0);  // rounds to 0 cents
    expect(dollarsToCents(0.005)).toBe(1);  // rounds to 1 cent
    expect(dollarsToCents(0.009)).toBe(1);  // rounds to 1 cent
  });

  it('should handle negative amounts (if applicable)', () => {
    expect(dollarsToCents(-1.50)).toBe(-150);
    expect(dollarsToCents(-100)).toBe(-10000);
  });

  it('should be idempotent with centsToDollars', () => {
    const testAmounts = [0, 1, 9.99, 100, 1234.56];

    testAmounts.forEach(amount => {
      const cents = dollarsToCents(amount);
      const dollars = centsToDollars(cents);
      expect(dollars).toBeCloseTo(amount, 2);
    });
  });
});

describe('centsToDollars', () => {
  it('should convert cents to whole dollars', () => {
    expect(centsToDollars(100)).toBe(1);
    expect(centsToDollars(1000)).toBe(10);
    expect(centsToDollars(10000)).toBe(100);
  });

  it('should convert cents to decimal dollars', () => {
    expect(centsToDollars(150)).toBe(1.50);
    expect(centsToDollars(999)).toBe(9.99);
    expect(centsToDollars(1)).toBe(0.01);
  });

  it('should handle zero', () => {
    expect(centsToDollars(0)).toBe(0);
  });

  it('should handle large amounts', () => {
    expect(centsToDollars(100000000)).toBe(1000000);
    expect(centsToDollars(1000000000)).toBe(10000000);
  });

  it('should handle odd cent amounts', () => {
    expect(centsToDollars(1)).toBe(0.01);
    expect(centsToDollars(99)).toBe(0.99);
    expect(centsToDollars(12345)).toBe(123.45);
  });

  it('should handle negative amounts', () => {
    expect(centsToDollars(-150)).toBe(-1.50);
    expect(centsToDollars(-10000)).toBe(-100);
  });
});

describe('formatCurrency', () => {
  it('should format cents as USD currency string', () => {
    expect(formatCurrency(100)).toBe('$1.00');
    expect(formatCurrency(1000)).toBe('$10.00');
    expect(formatCurrency(999)).toBe('$9.99');
  });

  it('should format zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should format cents with proper decimal places', () => {
    expect(formatCurrency(1)).toBe('$0.01');
    expect(formatCurrency(10)).toBe('$0.10');
    expect(formatCurrency(150)).toBe('$1.50');
  });

  it('should format large amounts with thousands separators', () => {
    expect(formatCurrency(100000)).toBe('$1,000.00');
    expect(formatCurrency(1000000)).toBe('$10,000.00');
    expect(formatCurrency(100000000)).toBe('$1,000,000.00');
  });

  it('should handle typical transaction amounts', () => {
    expect(formatCurrency(12345)).toBe('$123.45');
    expect(formatCurrency(50000)).toBe('$500.00');
    expect(formatCurrency(999999)).toBe('$9,999.99');
  });

  it('should format negative amounts', () => {
    expect(formatCurrency(-100)).toBe('-$1.00');
    expect(formatCurrency(-12345)).toBe('-$123.45');
  });

  it('should always show exactly 2 decimal places', () => {
    const formatted1 = formatCurrency(100);
    expect(formatted1).toMatch(/\.\d{2}$/);

    const formatted2 = formatCurrency(123456);
    expect(formatted2).toMatch(/\.\d{2}$/);
  });
});

describe('calculatePercentage', () => {
  it('should calculate percentage of amount', () => {
    expect(calculatePercentage(100, 0.1)).toBe(10);    // 10%
    expect(calculatePercentage(1000, 0.25)).toBe(250); // 25%
    expect(calculatePercentage(500, 0.5)).toBe(250);   // 50%
  });

  it('should handle decimal percentages', () => {
    expect(calculatePercentage(1000, 0.025)).toBe(25);  // 2.5%
    expect(calculatePercentage(10000, 0.008)).toBe(80); // 0.8% (Bosun fee)
  });

  it('should round to nearest integer', () => {
    expect(calculatePercentage(100, 0.333)).toBe(33);  // 33.3 rounds to 33
    expect(calculatePercentage(100, 0.335)).toBe(34);  // 33.5 rounds to 34
    expect(calculatePercentage(100, 0.336)).toBe(34);  // 33.6 rounds to 34
  });

  it('should handle zero amount', () => {
    expect(calculatePercentage(0, 0.1)).toBe(0);
  });

  it('should handle zero percentage', () => {
    expect(calculatePercentage(1000, 0)).toBe(0);
  });

  it('should handle 100% percentage', () => {
    expect(calculatePercentage(1000, 1.0)).toBe(1000);
  });

  it('should handle percentages greater than 100%', () => {
    expect(calculatePercentage(100, 2.0)).toBe(200);  // 200%
    expect(calculatePercentage(500, 1.5)).toBe(750);  // 150%
  });

  it('should calculate wire transfer fees (2.5%)', () => {
    expect(calculatePercentage(10000, 0.025)).toBe(250);
    expect(calculatePercentage(100000, 0.025)).toBe(2500);
  });

  it('should calculate Bosun fees (0.8%)', () => {
    expect(calculatePercentage(10000, 0.008)).toBe(80);
    expect(calculatePercentage(100000, 0.008)).toBe(800);
  });
});

describe('sumAmounts', () => {
  it('should sum multiple amounts', () => {
    expect(sumAmounts(100, 200, 300)).toBe(600);
    expect(sumAmounts(10, 20, 30, 40)).toBe(100);
  });

  it('should handle single amount', () => {
    expect(sumAmounts(100)).toBe(100);
  });

  it('should handle zero amounts', () => {
    expect(sumAmounts(0, 0, 0)).toBe(0);
    expect(sumAmounts(100, 0, 200)).toBe(300);
  });

  it('should handle empty array', () => {
    expect(sumAmounts()).toBe(0);
  });

  it('should handle negative amounts', () => {
    expect(sumAmounts(100, -50, 200)).toBe(250);
    expect(sumAmounts(-100, -200)).toBe(-300);
  });

  it('should handle large arrays', () => {
    const amounts = Array(100).fill(10);
    expect(sumAmounts(...amounts)).toBe(1000);
  });

  it('should maintain precision for cent calculations', () => {
    const cents = [12345, 67890, 11111, 22222];
    expect(sumAmounts(...cents)).toBe(113568);
  });

  it('should handle mixed positive and negative amounts', () => {
    expect(sumAmounts(1000, -200, 500, -300)).toBe(1000);
  });
});

describe('isValidAmount', () => {
  it('should return true for valid positive integers', () => {
    expect(isValidAmount(0)).toBe(true);
    expect(isValidAmount(1)).toBe(true);
    expect(isValidAmount(100)).toBe(true);
    expect(isValidAmount(1000000)).toBe(true);
  });

  it('should return false for negative amounts', () => {
    expect(isValidAmount(-1)).toBe(false);
    expect(isValidAmount(-100)).toBe(false);
  });

  it('should return false for non-integers', () => {
    expect(isValidAmount(1.5)).toBe(false);
    expect(isValidAmount(0.1)).toBe(false);
    expect(isValidAmount(99.99)).toBe(false);
  });

  it('should return false for NaN', () => {
    expect(isValidAmount(NaN)).toBe(false);
  });

  it('should return false for Infinity', () => {
    expect(isValidAmount(Infinity)).toBe(false);
    expect(isValidAmount(-Infinity)).toBe(false);
  });

  it('should validate amounts within MAX_SAFE_INTEGER', () => {
    expect(isValidAmount(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(isValidAmount(Number.MAX_SAFE_INTEGER - 1)).toBe(true);
  });

  it('should reject amounts beyond MAX_SAFE_INTEGER', () => {
    expect(isValidAmount(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
    expect(isValidAmount(Number.MAX_SAFE_INTEGER * 2)).toBe(false);
  });

  it('should validate typical transaction amounts', () => {
    // $10M in cents = 1,000,000,000
    expect(isValidAmount(1000000000)).toBe(true);

    // $100M in cents = 10,000,000,000
    expect(isValidAmount(10000000000)).toBe(true);
  });

  it('should validate zero', () => {
    expect(isValidAmount(0)).toBe(true);
  });
});

describe('currency utilities integration tests', () => {
  it('should maintain precision through conversion cycle', () => {
    const testAmounts = [
      { dollars: 0, cents: 0 },
      { dollars: 1, cents: 100 },
      { dollars: 9.99, cents: 999 },
      { dollars: 100.50, cents: 10050 },
      { dollars: 1234.56, cents: 123456 }
    ];

    testAmounts.forEach(({ dollars, cents }) => {
      // Dollars -> Cents
      const convertedCents = dollarsToCents(dollars);
      expect(convertedCents).toBe(cents);
      expect(isValidAmount(convertedCents)).toBe(true);

      // Cents -> Dollars
      const convertedDollars = centsToDollars(cents);
      expect(convertedDollars).toBeCloseTo(dollars, 2);

      // Format
      const formatted = formatCurrency(cents);
      expect(formatted).toContain('$');
      expect(formatted).toMatch(/\d+\.\d{2}$/);
    });
  });

  it('should calculate transaction fees correctly', () => {
    const transactionAmountCents = dollarsToCents(10000); // $10,000

    // Calculate wire transfer fee (2.5%)
    const wireFee = calculatePercentage(transactionAmountCents, 0.025);
    expect(wireFee).toBe(25000); // 250 dollars in cents
    expect(formatCurrency(wireFee)).toBe('$250.00');

    // Calculate Bosun fee (0.8%)
    const bosunFee = calculatePercentage(transactionAmountCents, 0.008);
    expect(bosunFee).toBe(8000); // 80 dollars in cents
    expect(formatCurrency(bosunFee)).toBe('$80.00');

    // Calculate savings
    const savings = wireFee - bosunFee;
    expect(savings).toBe(17000); // $170 savings
    expect(formatCurrency(savings)).toBe('$170.00');
  });

  it('should handle batch transaction calculations', () => {
    const transactions = [
      dollarsToCents(1000),
      dollarsToCents(2500),
      dollarsToCents(750.50),
      dollarsToCents(3999.99)
    ];

    // Verify all amounts are valid
    transactions.forEach(cents => {
      expect(isValidAmount(cents)).toBe(true);
    });

    // Sum transactions
    const total = sumAmounts(...transactions);
    expect(total).toBe(825049); // $8,250.49 in cents

    // Format total
    expect(formatCurrency(total)).toBe('$8,250.49');

    // Calculate fee on total
    const fee = calculatePercentage(total, 0.008);
    expect(formatCurrency(fee)).toBe('$66.00');
  });

  it('should prevent floating point errors in financial calculations', () => {
    // JavaScript floating point issue: 0.1 + 0.2 !== 0.3
    const a = 0.1;
    const b = 0.2;
    expect(a + b).not.toBe(0.3); // This is the problem we're solving

    // Using our currency utilities
    const aCents = dollarsToCents(a);
    const bCents = dollarsToCents(b);
    const sumCents = sumAmounts(aCents, bCents);
    const sumDollars = centsToDollars(sumCents);

    expect(sumCents).toBe(30); // exact
    expect(sumDollars).toBe(0.3); // exact
  });

  it('should handle circuit breaker limit ($10M)', () => {
    const maxSettlementDollars = 10000000;
    const maxSettlementCents = dollarsToCents(maxSettlementDollars);

    expect(maxSettlementCents).toBe(1000000000);
    expect(isValidAmount(maxSettlementCents)).toBe(true);
    expect(formatCurrency(maxSettlementCents)).toBe('$10,000,000.00');
  });

  it('should handle daily volume limit ($100M)', () => {
    const maxDailyDollars = 100000000;
    const maxDailyCents = dollarsToCents(maxDailyDollars);

    expect(maxDailyCents).toBe(10000000000);
    expect(isValidAmount(maxDailyCents)).toBe(true);
    expect(formatCurrency(maxDailyCents)).toBe('$100,000,000.00');
  });
});
