// src/lib/validations/transaction.test.ts
import { describe, it, expect } from 'vitest';
import { createTransactionSchema, processSettlementSchema } from './transaction';
import { ZodError } from 'zod';

describe('createTransactionSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid transaction with all fields', () => {
      const validInput = {
        direction: 'owed' as const,
        counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 1000.50,
        referenceNumber: 'REF-12345',
        tradeDate: '2024-01-15',
        description: 'Payment for services rendered',
      };

      const result = createTransactionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it('should accept valid transaction with minimal fields', () => {
      const validInput = {
        direction: 'owing' as const,
        counterpartyId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        amount: 500,
        tradeDate: '2024-03-20',
      };

      const result = createTransactionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should accept both "owed" and "owing" directions', () => {
      const owedInput = {
        direction: 'owed',
        counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 100,
        tradeDate: '2024-01-01',
      };

      const owingInput = {
        direction: 'owing',
        counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 100,
        tradeDate: '2024-01-01',
      };

      expect(createTransactionSchema.safeParse(owedInput).success).toBe(true);
      expect(createTransactionSchema.safeParse(owingInput).success).toBe(true);
    });

    it('should accept amounts with 0, 1, or 2 decimal places', () => {
      const baseInput = {
        direction: 'owed' as const,
        counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
        tradeDate: '2024-01-01',
      };

      expect(createTransactionSchema.safeParse({ ...baseInput, amount: 100 }).success).toBe(true);
      expect(createTransactionSchema.safeParse({ ...baseInput, amount: 100.5 }).success).toBe(true);
      expect(createTransactionSchema.safeParse({ ...baseInput, amount: 100.99 }).success).toBe(true);
    });

    it('should accept amount at maximum limit', () => {
      const input = {
        direction: 'owed' as const,
        counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 10_000_000,
        tradeDate: '2024-01-01',
      };

      const result = createTransactionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept null for optional fields', () => {
      const input = {
        direction: 'owed' as const,
        counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 100,
        tradeDate: '2024-01-01',
        referenceNumber: null,
        description: null,
      };

      const result = createTransactionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept various valid date formats', () => {
      const baseInput = {
        direction: 'owed' as const,
        counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 100,
      };

      const validDates = [
        '2024-01-15',
        '2024-12-31',
        '2024-01-15T10:30:00Z',
        '2024-01-15T10:30:00.000Z',
      ];

      validDates.forEach(date => {
        const result = createTransactionSchema.safeParse({ ...baseInput, tradeDate: date });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('direction validation', () => {
    it('should reject invalid direction', () => {
      const input = {
        direction: 'invalid',
        counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 100,
        tradeDate: '2024-01-01',
      };

      const result = createTransactionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject missing direction', () => {
      const input = {
        counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 100,
        tradeDate: '2024-01-01',
      };

      const result = createTransactionSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('option');
      }
    });
  });

  describe('counterpartyId validation', () => {
    it('should reject invalid UUID format', () => {
      const input = {
        direction: 'owed' as const,
        counterpartyId: 'not-a-uuid',
        amount: 100,
        tradeDate: '2024-01-01',
      };

      const result = createTransactionSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid counterparty ID');
      }
    });

    it('should reject missing counterpartyId', () => {
      const input = {
        direction: 'owed' as const,
        amount: 100,
        tradeDate: '2024-01-01',
      };

      const result = createTransactionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty string counterpartyId', () => {
      const input = {
        direction: 'owed' as const,
        counterpartyId: '',
        amount: 100,
        tradeDate: '2024-01-01',
      };

      const result = createTransactionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('amount validation', () => {
    const baseInput = {
      direction: 'owed' as const,
      counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
      tradeDate: '2024-01-01',
    };

    it('should reject zero amount', () => {
      const result = createTransactionSchema.safeParse({ ...baseInput, amount: 0 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('greater than 0');
      }
    });

    it('should reject negative amount', () => {
      const result = createTransactionSchema.safeParse({ ...baseInput, amount: -100 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('greater than 0');
      }
    });

    it('should reject amount exceeding maximum', () => {
      const result = createTransactionSchema.safeParse({ ...baseInput, amount: 10_000_001 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('10,000,000');
      }
    });

    it('should reject amount with more than 2 decimal places', () => {
      const result = createTransactionSchema.safeParse({ ...baseInput, amount: 100.123 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('2 decimal places');
      }
    });

    it('should reject amounts with 3+ decimal places', () => {
      const invalidAmounts = [1.234, 99.999, 1000.1234];

      invalidAmounts.forEach(amount => {
        const result = createTransactionSchema.safeParse({ ...baseInput, amount });
        expect(result.success).toBe(false);
      });
    });

    it('should reject missing amount', () => {
      const input = {
        direction: 'owed' as const,
        counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
        tradeDate: '2024-01-01',
      };

      const result = createTransactionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric amount', () => {
      const input = {
        direction: 'owed' as const,
        counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
        amount: '100',
        tradeDate: '2024-01-01',
      };

      const result = createTransactionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('referenceNumber validation', () => {
    const baseInput = {
      direction: 'owed' as const,
      counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
      amount: 100,
      tradeDate: '2024-01-01',
    };

    it('should accept reference number at max length (100)', () => {
      const refNumber = 'A'.repeat(100);
      const result = createTransactionSchema.safeParse({ ...baseInput, referenceNumber: refNumber });
      expect(result.success).toBe(true);
    });

    it('should reject reference number exceeding max length', () => {
      const refNumber = 'A'.repeat(101);
      const result = createTransactionSchema.safeParse({ ...baseInput, referenceNumber: refNumber });
      expect(result.success).toBe(false);
    });

    it('should accept omitted reference number', () => {
      const result = createTransactionSchema.safeParse(baseInput);
      expect(result.success).toBe(true);
    });
  });

  describe('tradeDate validation', () => {
    const baseInput = {
      direction: 'owed' as const,
      counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
      amount: 100,
    };

    it('should reject invalid date strings', () => {
      const invalidDates = [
        'not-a-date',
        'invalid',
        'abc123',
      ];

      invalidDates.forEach(date => {
        const result = createTransactionSchema.safeParse({ ...baseInput, tradeDate: date });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid trade date');
        }
      });
    });

    it('should reject empty trade date', () => {
      const result = createTransactionSchema.safeParse({ ...baseInput, tradeDate: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing trade date', () => {
      const result = createTransactionSchema.safeParse(baseInput);
      expect(result.success).toBe(false);
    });
  });

  describe('description validation', () => {
    const baseInput = {
      direction: 'owed' as const,
      counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
      amount: 100,
      tradeDate: '2024-01-01',
    };

    it('should accept description at max length (500)', () => {
      const description = 'A'.repeat(500);
      const result = createTransactionSchema.safeParse({ ...baseInput, description });
      expect(result.success).toBe(true);
    });

    it('should reject description exceeding max length', () => {
      const description = 'A'.repeat(501);
      const result = createTransactionSchema.safeParse({ ...baseInput, description });
      expect(result.success).toBe(false);
    });

    it('should accept omitted description', () => {
      const result = createTransactionSchema.safeParse(baseInput);
      expect(result.success).toBe(true);
    });
  });

  describe('multiple validation errors', () => {
    it('should report multiple errors when input has multiple issues', () => {
      const invalidInput = {
        direction: 'invalid',
        counterpartyId: 'not-a-uuid',
        amount: -100,
        tradeDate: 'invalid-date',
      };

      const result = createTransactionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('real-world scenarios', () => {
    it('should validate typical OTC trade transaction', () => {
      const input = {
        direction: 'owed' as const,
        counterpartyId: '550e8400-e29b-41d4-a716-446655440000',
        amount: 50000.00,
        referenceNumber: 'TRD-2024-001',
        tradeDate: '2024-01-15',
        description: 'OTC USD/USDC trade settlement',
      };

      const result = createTransactionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should validate small transaction', () => {
      const input = {
        direction: 'owing' as const,
        counterpartyId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        amount: 0.01,
        tradeDate: '2024-03-20',
      };

      const result = createTransactionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should validate large transaction at limit', () => {
      const input = {
        direction: 'owed' as const,
        counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 9999999.99,
        tradeDate: '2024-01-01',
        description: 'Large institutional trade',
      };

      const result = createTransactionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});

describe('processSettlementSchema', () => {
  it('should accept simulation as true', () => {
    const input = { simulation: true };
    const result = processSettlementSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.simulation).toBe(true);
    }
  });

  it('should accept simulation as false', () => {
    const input = { simulation: false };
    const result = processSettlementSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.simulation).toBe(false);
    }
  });

  it('should default simulation to false when omitted', () => {
    const input = {};
    const result = processSettlementSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.simulation).toBe(false);
    }
  });

  it('should accept empty object (all fields optional)', () => {
    const result = processSettlementSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should reject non-boolean simulation value', () => {
    const inputs = [
      { simulation: 'true' },
      { simulation: 1 },
      { simulation: null },
    ];

    inputs.forEach(input => {
      const result = processSettlementSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  it('should ignore extra fields not in schema', () => {
    const input = {
      simulation: true,
      extraField: 'should be ignored',
    };

    const result = processSettlementSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      // Extra fields should be stripped
      expect('extraField' in result.data).toBe(false);
    }
  });
});

describe('validation schema integration', () => {
  it('should validate complete transaction workflow', () => {
    // Step 1: Create transaction
    const transactionInput = {
      direction: 'owed' as const,
      counterpartyId: '123e4567-e89b-42d3-a456-426614174000',
      amount: 1000.00,
      referenceNumber: 'REF-001',
      tradeDate: '2024-01-15',
      description: 'Test transaction',
    };

    const txResult = createTransactionSchema.safeParse(transactionInput);
    expect(txResult.success).toBe(true);

    // Step 2: Process settlement (simulation mode)
    const settlementInput = { simulation: true };
    const settleResult = processSettlementSchema.safeParse(settlementInput);
    expect(settleResult.success).toBe(true);
  });

  it('should provide helpful error messages for validation failures', () => {
    const invalidInput = {
      direction: 'invalid',
      counterpartyId: 'not-uuid',
      amount: -50,
      tradeDate: 'bad-date',
    };

    const result = createTransactionSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);

    if (!result.success) {
      const errors = result.error.issues;
      expect(errors.some(e => e.message.includes('option') || e.message.includes('owed') || e.message.includes('owing'))).toBe(true);
      expect(errors.some(e => e.message.includes('counterparty'))).toBe(true);
      expect(errors.some(e => e.message.includes('Amount') || e.message.includes('greater than'))).toBe(true);
      expect(errors.some(e => e.message.includes('trade date'))).toBe(true);
    }
  });
});
