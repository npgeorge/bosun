// src/lib/utils/circuit-breakers.test.ts
import { describe, it, expect } from 'vitest';
import {
  checkCircuitBreakers,
  formatCircuitBreakerResult,
  DEFAULT_CIRCUIT_BREAKERS,
  type CircuitBreakerConfig,
} from './circuit-breakers';

describe('DEFAULT_CIRCUIT_BREAKERS', () => {
  it('should have correct default values', () => {
    expect(DEFAULT_CIRCUIT_BREAKERS.maxSettlementAmount).toBe(10_000_000);
    expect(DEFAULT_CIRCUIT_BREAKERS.maxMembersPerBatch).toBe(20);
    expect(DEFAULT_CIRCUIT_BREAKERS.minOTCSpread).toBe(0.003);
    expect(DEFAULT_CIRCUIT_BREAKERS.maxOTCSpread).toBe(0.010);
    expect(DEFAULT_CIRCUIT_BREAKERS.settlementTimeout).toBe(3600);
    expect(DEFAULT_CIRCUIT_BREAKERS.maxDailyVolume).toBe(100_000_000);
    expect(DEFAULT_CIRCUIT_BREAKERS.maxSingleMemberExposure).toBe(5_000_000);
  });
});

describe('checkCircuitBreakers - passing scenarios', () => {
  it('should pass with all values within limits', () => {
    const result = checkCircuitBreakers({
      totalVolume: 1_000_000,
      memberCount: 10,
      maxSingleSettlement: 500_000,
      otcSpread: 0.005,
      processingTimeSeconds: 1800,
      dailyVolume: 50_000_000,
      maxMemberExposure: 2_000_000,
    });

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should pass with minimal valid values', () => {
    const result = checkCircuitBreakers({
      totalVolume: 0,
      memberCount: 1,
      maxSingleSettlement: 0,
    });

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should pass when exactly at limits (boundary test)', () => {
    const result = checkCircuitBreakers({
      totalVolume: 100_000_000,
      memberCount: 20,
      maxSingleSettlement: 10_000_000,
      otcSpread: 0.010,
      processingTimeSeconds: 3600,
      dailyVolume: 100_000_000,
      maxMemberExposure: 5_000_000,
    });

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should pass when optional fields are not provided', () => {
    const result = checkCircuitBreakers({
      totalVolume: 1_000_000,
      memberCount: 5,
      maxSingleSettlement: 500_000,
    });

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});

describe('checkCircuitBreakers - max settlement amount violations', () => {
  it('should fail when max settlement exceeds limit', () => {
    const result = checkCircuitBreakers({
      totalVolume: 15_000_000,
      memberCount: 5,
      maxSingleSettlement: 10_000_001,
    });

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].type).toBe('max_settlement_amount');
    expect(result.violations[0].severity).toBe('critical');
    expect(result.violations[0].value).toBe(10_000_001);
    expect(result.violations[0].limit).toBe(10_000_000);
    expect(result.violations[0].message).toContain('10,000,001');
  });

  it('should fail with significantly over limit settlement', () => {
    const result = checkCircuitBreakers({
      totalVolume: 50_000_000,
      memberCount: 5,
      maxSingleSettlement: 50_000_000,
    });

    expect(result.passed).toBe(false);
    expect(result.violations[0].type).toBe('max_settlement_amount');
  });
});

describe('checkCircuitBreakers - max members violations', () => {
  it('should fail when member count exceeds limit', () => {
    const result = checkCircuitBreakers({
      totalVolume: 1_000_000,
      memberCount: 21,
      maxSingleSettlement: 500_000,
    });

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].type).toBe('max_members');
    expect(result.violations[0].severity).toBe('critical');
    expect(result.violations[0].value).toBe(21);
    expect(result.violations[0].limit).toBe(20);
    expect(result.violations[0].message).toContain('21');
  });

  it('should fail with significantly over limit members', () => {
    const result = checkCircuitBreakers({
      totalVolume: 1_000_000,
      memberCount: 100,
      maxSingleSettlement: 500_000,
    });

    expect(result.passed).toBe(false);
    expect(result.violations[0].type).toBe('max_members');
    expect(result.violations[0].value).toBe(100);
  });
});

describe('checkCircuitBreakers - OTC spread violations and warnings', () => {
  it('should warn when OTC spread is below minimum', () => {
    const result = checkCircuitBreakers({
      totalVolume: 1_000_000,
      memberCount: 5,
      maxSingleSettlement: 500_000,
      otcSpread: 0.002, // Below 0.003 minimum
    });

    expect(result.passed).toBe(true); // Warnings don't fail
    expect(result.violations).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].type).toBe('min_otc_spread');
    expect(result.warnings[0].severity).toBe('warning');
    expect(result.warnings[0].value).toBe(0.002);
    expect(result.warnings[0].limit).toBe(0.003);
    expect(result.warnings[0].message).toContain('0.20%');
  });

  it('should fail when OTC spread exceeds maximum', () => {
    const result = checkCircuitBreakers({
      totalVolume: 1_000_000,
      memberCount: 5,
      maxSingleSettlement: 500_000,
      otcSpread: 0.011, // Above 0.010 maximum
    });

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].type).toBe('max_otc_spread');
    expect(result.violations[0].severity).toBe('critical');
    expect(result.violations[0].value).toBe(0.011);
    expect(result.violations[0].limit).toBe(0.010);
    expect(result.violations[0].message).toContain('1.10%');
  });

  it('should handle OTC spread at exact boundaries', () => {
    const minResult = checkCircuitBreakers({
      totalVolume: 1_000_000,
      memberCount: 5,
      maxSingleSettlement: 500_000,
      otcSpread: 0.003, // Exactly at minimum
    });

    expect(minResult.passed).toBe(true);
    expect(minResult.warnings).toHaveLength(0);

    const maxResult = checkCircuitBreakers({
      totalVolume: 1_000_000,
      memberCount: 5,
      maxSingleSettlement: 500_000,
      otcSpread: 0.010, // Exactly at maximum
    });

    expect(maxResult.passed).toBe(true);
    expect(maxResult.violations).toHaveLength(0);
  });

  it('should pass when OTC spread is within range', () => {
    const result = checkCircuitBreakers({
      totalVolume: 1_000_000,
      memberCount: 5,
      maxSingleSettlement: 500_000,
      otcSpread: 0.005, // Within 0.003-0.010 range
    });

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});

describe('checkCircuitBreakers - processing timeout violations', () => {
  it('should fail when processing time exceeds timeout', () => {
    const result = checkCircuitBreakers({
      totalVolume: 1_000_000,
      memberCount: 5,
      maxSingleSettlement: 500_000,
      processingTimeSeconds: 3601, // Over 3600s (1 hour)
    });

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].type).toBe('processing_timeout');
    expect(result.violations[0].severity).toBe('critical');
    expect(result.violations[0].value).toBe(3601);
    expect(result.violations[0].limit).toBe(3600);
  });

  it('should pass when processing time is at limit', () => {
    const result = checkCircuitBreakers({
      totalVolume: 1_000_000,
      memberCount: 5,
      maxSingleSettlement: 500_000,
      processingTimeSeconds: 3600,
    });

    expect(result.passed).toBe(true);
  });
});

describe('checkCircuitBreakers - daily volume violations', () => {
  it('should fail when daily volume exceeds limit', () => {
    const result = checkCircuitBreakers({
      totalVolume: 110_000_000,
      memberCount: 5,
      maxSingleSettlement: 5_000_000,
      dailyVolume: 110_000_000, // Over $100M
    });

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].type).toBe('max_daily_volume');
    expect(result.violations[0].severity).toBe('critical');
    expect(result.violations[0].value).toBe(110_000_000);
    expect(result.violations[0].limit).toBe(100_000_000);
    expect(result.violations[0].message).toContain('110,000,000');
  });

  it('should pass when daily volume is at limit', () => {
    const result = checkCircuitBreakers({
      totalVolume: 100_000_000,
      memberCount: 5,
      maxSingleSettlement: 5_000_000,
      dailyVolume: 100_000_000,
    });

    expect(result.passed).toBe(true);
  });
});

describe('checkCircuitBreakers - member exposure warnings', () => {
  it('should warn when member exposure exceeds recommended limit', () => {
    const result = checkCircuitBreakers({
      totalVolume: 10_000_000,
      memberCount: 5,
      maxSingleSettlement: 6_000_000,
      maxMemberExposure: 6_000_000, // Over $5M
    });

    expect(result.passed).toBe(true); // Warnings don't fail
    expect(result.violations).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].type).toBe('max_member_exposure');
    expect(result.warnings[0].severity).toBe('warning');
    expect(result.warnings[0].value).toBe(6_000_000);
    expect(result.warnings[0].limit).toBe(5_000_000);
    expect(result.warnings[0].message).toContain('6,000,000');
  });

  it('should pass when member exposure is at recommended limit', () => {
    const result = checkCircuitBreakers({
      totalVolume: 10_000_000,
      memberCount: 5,
      maxSingleSettlement: 5_000_000,
      maxMemberExposure: 5_000_000,
    });

    expect(result.passed).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});

describe('checkCircuitBreakers - multiple violations', () => {
  it('should report multiple critical violations', () => {
    const result = checkCircuitBreakers({
      totalVolume: 150_000_000,
      memberCount: 25,
      maxSingleSettlement: 15_000_000,
      otcSpread: 0.015,
      processingTimeSeconds: 4000,
      dailyVolume: 150_000_000,
    });

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(4);

    const violationTypes = result.violations.map(v => v.type);
    expect(violationTypes).toContain('max_settlement_amount');
    expect(violationTypes).toContain('max_members');
    expect(violationTypes).toContain('max_otc_spread');
    expect(violationTypes).toContain('processing_timeout');
    expect(violationTypes).toContain('max_daily_volume');
  });

  it('should report both violations and warnings', () => {
    const result = checkCircuitBreakers({
      totalVolume: 10_000_000,
      memberCount: 25, // Critical violation
      maxSingleSettlement: 5_000_000,
      otcSpread: 0.002, // Warning
      maxMemberExposure: 6_000_000, // Warning
    });

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].type).toBe('max_members');
    expect(result.warnings).toHaveLength(2);

    const warningTypes = result.warnings.map(w => w.type);
    expect(warningTypes).toContain('min_otc_spread');
    expect(warningTypes).toContain('max_member_exposure');
  });
});

describe('checkCircuitBreakers - custom configuration', () => {
  it('should use custom limits when provided', () => {
    const customConfig: CircuitBreakerConfig = {
      maxSettlementAmount: 5_000_000, // Lower than default
      maxMembersPerBatch: 10,
      minOTCSpread: 0.005,
      maxOTCSpread: 0.008,
      settlementTimeout: 1800,
      maxDailyVolume: 50_000_000,
      maxSingleMemberExposure: 2_000_000,
    };

    const result = checkCircuitBreakers(
      {
        totalVolume: 10_000_000,
        memberCount: 15, // Would pass with default, fails with custom
        maxSingleSettlement: 6_000_000, // Would pass with default, fails with custom
      },
      customConfig
    );

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(2);
    expect(result.violations.find(v => v.type === 'max_settlement_amount')?.limit).toBe(5_000_000);
    expect(result.violations.find(v => v.type === 'max_members')?.limit).toBe(10);
  });

  it('should allow more permissive custom limits', () => {
    const permissiveConfig: CircuitBreakerConfig = {
      maxSettlementAmount: 50_000_000,
      maxMembersPerBatch: 100,
      minOTCSpread: 0.001,
      maxOTCSpread: 0.020,
      settlementTimeout: 7200,
      maxDailyVolume: 500_000_000,
      maxSingleMemberExposure: 20_000_000,
    };

    const result = checkCircuitBreakers(
      {
        totalVolume: 150_000_000,
        memberCount: 50,
        maxSingleSettlement: 25_000_000,
      },
      permissiveConfig
    );

    expect(result.passed).toBe(true);
  });
});

describe('formatCircuitBreakerResult', () => {
  it('should format passing result', () => {
    const result = {
      passed: true,
      violations: [],
      warnings: [],
    };

    const formatted = formatCircuitBreakerResult(result);
    expect(formatted).toBe('✅ All circuit breakers passed');
  });

  it('should format critical violations', () => {
    const result = {
      passed: false,
      violations: [
        {
          type: 'max_settlement_amount',
          message: 'Settlement amount too high',
          severity: 'critical' as const,
          value: 15_000_000,
          limit: 10_000_000,
        },
      ],
      warnings: [],
    };

    const formatted = formatCircuitBreakerResult(result);
    expect(formatted).toContain('🚨 CRITICAL VIOLATIONS:');
    expect(formatted).toContain('Settlement amount too high');
  });

  it('should format warnings', () => {
    const result = {
      passed: true,
      violations: [],
      warnings: [
        {
          type: 'min_otc_spread',
          message: 'OTC spread below minimum',
          severity: 'warning' as const,
          value: 0.002,
          limit: 0.003,
        },
      ],
    };

    const formatted = formatCircuitBreakerResult(result);
    expect(formatted).toContain('⚠️ WARNINGS:');
    expect(formatted).toContain('OTC spread below minimum');
  });

  it('should format both violations and warnings', () => {
    const result = {
      passed: false,
      violations: [
        {
          type: 'max_members',
          message: 'Too many members',
          severity: 'critical' as const,
          value: 25,
          limit: 20,
        },
      ],
      warnings: [
        {
          type: 'max_member_exposure',
          message: 'High member exposure',
          severity: 'warning' as const,
          value: 6_000_000,
          limit: 5_000_000,
        },
      ],
    };

    const formatted = formatCircuitBreakerResult(result);
    expect(formatted).toContain('🚨 CRITICAL VIOLATIONS:');
    expect(formatted).toContain('Too many members');
    expect(formatted).toContain('⚠️ WARNINGS:');
    expect(formatted).toContain('High member exposure');
  });

  it('should format multiple violations', () => {
    const result = {
      passed: false,
      violations: [
        {
          type: 'max_settlement_amount',
          message: 'Settlement too high',
          severity: 'critical' as const,
          value: 15_000_000,
          limit: 10_000_000,
        },
        {
          type: 'max_members',
          message: 'Too many members',
          severity: 'critical' as const,
          value: 25,
          limit: 20,
        },
      ],
      warnings: [],
    };

    const formatted = formatCircuitBreakerResult(result);
    expect(formatted).toContain('Settlement too high');
    expect(formatted).toContain('Too many members');
  });
});

describe('circuit breaker integration tests', () => {
  it('should validate a realistic settlement scenario', () => {
    // Realistic scenario: 8 members, $3.5M total volume
    const result = checkCircuitBreakers({
      totalVolume: 3_500_000,
      memberCount: 8,
      maxSingleSettlement: 1_200_000,
      otcSpread: 0.006,
      processingTimeSeconds: 450,
      dailyVolume: 25_000_000,
      maxMemberExposure: 1_500_000,
    });

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should catch dangerous edge case scenarios', () => {
    // Edge case: Just barely passing all limits
    const result = checkCircuitBreakers({
      totalVolume: 99_999_999,
      memberCount: 20,
      maxSingleSettlement: 9_999_999,
      otcSpread: 0.0031,
      processingTimeSeconds: 3599,
      dailyVolume: 99_999_999,
      maxMemberExposure: 4_999_999,
    });

    expect(result.passed).toBe(true);
  });

  it('should prevent catastrophic failures', () => {
    // Catastrophic scenario: Everything way over limits
    const result = checkCircuitBreakers({
      totalVolume: 500_000_000,
      memberCount: 100,
      maxSingleSettlement: 100_000_000,
      otcSpread: 0.050,
      processingTimeSeconds: 10_000,
      dailyVolume: 500_000_000,
      maxMemberExposure: 50_000_000,
    });

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(5);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
  });
});
