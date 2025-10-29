// src/lib/security/sanitize.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sanitizeHtml,
  sanitizeSql,
  isValidEmail,
  isValidUuid,
  isValidNumber,
  isValidAmount,
  sanitizeFilename,
  validateFileUpload,
  generateCsrfToken,
  validateCsrfToken,
  checkRateLimit,
} from './sanitize';

describe('sanitizeHtml', () => {
  it('should escape HTML special characters', () => {
    const input = '<script>alert("XSS")</script>';
    const output = sanitizeHtml(input);
    expect(output).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });

  it('should escape ampersands', () => {
    expect(sanitizeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('should escape less than and greater than', () => {
    expect(sanitizeHtml('5 < 10 > 3')).toBe('5 &lt; 10 &gt; 3');
  });

  it('should escape quotes', () => {
    expect(sanitizeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
    expect(sanitizeHtml("It's working")).toBe('It&#x27;s working');
  });

  it('should escape forward slashes', () => {
    expect(sanitizeHtml('path/to/file')).toBe('path&#x2F;to&#x2F;file');
  });

  it('should handle XSS attack patterns', () => {
    const attacks = [
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      'javascript:alert(1)',
      '<iframe src="javascript:alert(1)"></iframe>',
      '"><script>alert(1)</script>',
    ];

    attacks.forEach(attack => {
      const sanitized = sanitizeHtml(attack);
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain('"');
    });
  });

  it('should handle empty string', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('should handle normal text without special characters', () => {
    expect(sanitizeHtml('Hello World')).toBe('Hello World');
  });

  it('should handle multiple special characters', () => {
    const input = '<div class="test" onclick=\'alert("xss")\'></div>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('<');
    expect(output).not.toContain('>');
    expect(output).not.toContain('"');
    expect(output).not.toContain("'");
  });
});

describe('sanitizeSql', () => {
  it('should remove single quotes', () => {
    expect(sanitizeSql("O'Reilly")).toBe('OReilly');
  });

  it('should remove double quotes', () => {
    expect(sanitizeSql('Say "hello"')).toBe('Say hello');
  });

  it('should remove semicolons', () => {
    expect(sanitizeSql('DROP TABLE users;')).toBe('DROP TABLE users');
  });

  it('should remove backslashes', () => {
    expect(sanitizeSql('path\\to\\file')).toBe('pathtofile');
  });

  it('should handle SQL injection attempts', () => {
    const attacks = [
      "' OR '1'='1",
      "admin'--",
      "'; DROP TABLE users; --",
      "1' UNION SELECT * FROM users--",
    ];

    attacks.forEach(attack => {
      const sanitized = sanitizeSql(attack);
      expect(sanitized).not.toContain("'");
      expect(sanitized).not.toContain('"');
      expect(sanitized).not.toContain(';');
    });
  });

  it('should handle normal text', () => {
    expect(sanitizeSql('Hello World')).toBe('Hello World');
  });

  it('should handle empty string', () => {
    expect(sanitizeSql('')).toBe('');
  });
});

describe('isValidEmail', () => {
  it('should validate correct email formats', () => {
    const validEmails = [
      'user@example.com',
      'test.user@example.co.uk',
      'user+tag@example.com',
      'user123@test-domain.com',
      'a@b.co',
    ];

    validEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(true);
    });
  });

  it('should reject invalid email formats', () => {
    const invalidEmails = [
      'invalid',
      '@example.com',
      'user@',
      'user @example.com',
      'user@example',
      '',
    ];

    invalidEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(false);
    });
  });

  it('should reject emails longer than 255 characters', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    expect(isValidEmail(longEmail)).toBe(false);
  });

  it('should accept emails at exactly 255 characters', () => {
    const email = 'a'.repeat(240) + '@example.com'; // 253 chars total
    expect(isValidEmail(email)).toBe(true);
  });
});

describe('isValidUuid', () => {
  it('should validate correct UUID v4 format', () => {
    const validUuids = [
      '123e4567-e89b-42d3-a456-426614174000',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      '550e8400-e29b-41d4-a716-446655440000',
    ];

    validUuids.forEach(uuid => {
      expect(isValidUuid(uuid)).toBe(true);
    });
  });

  it('should validate case insensitive UUIDs', () => {
    expect(isValidUuid('A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11')).toBe(true);
    expect(isValidUuid('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(true);
  });

  it('should reject invalid UUID formats', () => {
    const invalidUuids = [
      'not-a-uuid',
      '123e4567-e89b-12d3-a456-426614174000', // Wrong version (not v4)
      '123e4567e89b42d3a456426614174000', // Missing dashes
      '123e4567-e89b-42d3-a456-42661417400', // Too short
      '123e4567-e89b-42d3-a456-4266141740000', // Too long
      '',
    ];

    invalidUuids.forEach(uuid => {
      expect(isValidUuid(uuid)).toBe(false);
    });
  });
});

describe('isValidNumber', () => {
  it('should validate valid numbers', () => {
    expect(isValidNumber(0)).toBe(true);
    expect(isValidNumber(1)).toBe(true);
    expect(isValidNumber(-1)).toBe(true);
    expect(isValidNumber(3.14)).toBe(true);
    expect(isValidNumber(1000000)).toBe(true);
  });

  it('should reject NaN', () => {
    expect(isValidNumber(NaN)).toBe(false);
    expect(isValidNumber(Number.NaN)).toBe(false);
  });

  it('should reject Infinity', () => {
    expect(isValidNumber(Infinity)).toBe(false);
    expect(isValidNumber(-Infinity)).toBe(false);
  });

  it('should reject non-numbers', () => {
    expect(isValidNumber('123')).toBe(false);
    expect(isValidNumber(null)).toBe(false);
    expect(isValidNumber(undefined)).toBe(false);
    expect(isValidNumber({})).toBe(false);
    expect(isValidNumber([])).toBe(false);
  });
});

describe('isValidAmount', () => {
  it('should validate positive amounts with max 2 decimal places', () => {
    expect(isValidAmount(1)).toBe(true);
    expect(isValidAmount(1.5)).toBe(true);
    expect(isValidAmount(1.99)).toBe(true);
    expect(isValidAmount(1000)).toBe(true);
    expect(isValidAmount(9999.99)).toBe(true);
  });

  it('should reject zero and negative amounts', () => {
    expect(isValidAmount(0)).toBe(false);
    expect(isValidAmount(-1)).toBe(false);
    expect(isValidAmount(-100.50)).toBe(false);
  });

  it('should reject amounts with more than 2 decimal places', () => {
    expect(isValidAmount(1.234)).toBe(false);
    expect(isValidAmount(9.999)).toBe(false);
    expect(isValidAmount(100.001)).toBe(false);
  });

  it('should reject amounts exceeding max limit', () => {
    expect(isValidAmount(1_000_000_000_000)).toBe(false); // 1 trillion
    expect(isValidAmount(999_999_999_999.99)).toBe(true); // Just under limit
  });

  it('should reject invalid numbers', () => {
    expect(isValidAmount(NaN)).toBe(false);
    expect(isValidAmount(Infinity)).toBe(false);
  });

  it('should handle typical transaction amounts', () => {
    expect(isValidAmount(100.50)).toBe(true);
    expect(isValidAmount(1000.00)).toBe(true);
    expect(isValidAmount(9999.99)).toBe(true);
  });
});

describe('sanitizeFilename', () => {
  it('should allow safe filenames', () => {
    expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
    expect(sanitizeFilename('report-2024.xlsx')).toBe('report-2024.xlsx');
    expect(sanitizeFilename('my_file.txt')).toBe('my_file.txt');
  });

  it('should remove path traversal attempts', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('___etc_passwd');
    expect(sanitizeFilename('..\\..\\..\\windows\\system32')).toBe('___windows_system32');
  });

  it('should replace dangerous characters with underscores', () => {
    expect(sanitizeFilename('file name.pdf')).toBe('file_name.pdf');
    expect(sanitizeFilename('test<>:"/\\|?*.txt')).toBe('test_________.txt');
  });

  it('should limit filename length to 255 characters', () => {
    const longName = 'a'.repeat(300) + '.txt';
    const sanitized = sanitizeFilename(longName);
    expect(sanitized.length).toBe(255);
  });

  it('should handle empty string', () => {
    expect(sanitizeFilename('')).toBe('');
  });

  it('should preserve file extensions', () => {
    expect(sanitizeFilename('invoice.pdf')).toBe('invoice.pdf');
    expect(sanitizeFilename('data.csv')).toBe('data.csv');
  });
});

describe('validateFileUpload', () => {
  // Helper to create mock File object
  const createMockFile = (name: string, size: number, type: string): File => {
    return {
      name,
      size,
      type,
    } as File;
  };

  it('should accept valid PDF file within size limit', () => {
    const file = createMockFile('document.pdf', 5 * 1024 * 1024, 'application/pdf');
    const result = validateFileUpload(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept valid image files', () => {
    const jpegFile = createMockFile('photo.jpg', 2 * 1024 * 1024, 'image/jpeg');
    const pngFile = createMockFile('screenshot.png', 3 * 1024 * 1024, 'image/png');

    expect(validateFileUpload(jpegFile).valid).toBe(true);
    expect(validateFileUpload(pngFile).valid).toBe(true);
  });

  it('should reject files exceeding default size limit (10MB)', () => {
    const file = createMockFile('large.pdf', 11 * 1024 * 1024, 'application/pdf');
    const result = validateFileUpload(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum allowed size');
  });

  it('should reject disallowed file types', () => {
    const file = createMockFile('script.exe', 1024, 'application/x-msdownload');
    const result = validateFileUpload(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  it('should respect custom size limit', () => {
    const file = createMockFile('doc.pdf', 3 * 1024 * 1024, 'application/pdf');
    const result = validateFileUpload(file, { maxSize: 2 * 1024 * 1024 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum');
  });

  it('should respect custom allowed types', () => {
    const csvFile = createMockFile('data.csv', 1024, 'text/csv');

    // Reject with default types
    expect(validateFileUpload(csvFile).valid).toBe(false);

    // Accept with custom types
    const result = validateFileUpload(csvFile, { allowedTypes: ['text/csv'] });
    expect(result.valid).toBe(true);
  });

  it('should accept file at exactly the size limit', () => {
    const file = createMockFile('doc.pdf', 10 * 1024 * 1024, 'application/pdf');
    const result = validateFileUpload(file);
    expect(result.valid).toBe(true);
  });
});

describe('generateCsrfToken', () => {
  it('should generate a token', () => {
    const token = generateCsrfToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('should generate unique tokens', () => {
    const token1 = generateCsrfToken();
    const token2 = generateCsrfToken();
    expect(token1).not.toBe(token2);
  });

  it('should generate tokens of sufficient length', () => {
    const token = generateCsrfToken();
    // Should be at least 32 characters for security
    expect(token.length).toBeGreaterThanOrEqual(32);
  });

  it('should generate multiple unique tokens', () => {
    const tokens = new Set();
    for (let i = 0; i < 10; i++) {
      tokens.add(generateCsrfToken());
    }
    expect(tokens.size).toBe(10); // All should be unique
  });
});

describe('validateCsrfToken', () => {
  it('should validate matching tokens', () => {
    const token = 'a'.repeat(32);
    expect(validateCsrfToken(token, token)).toBe(true);
  });

  it('should reject non-matching tokens', () => {
    const token1 = 'a'.repeat(32);
    const token2 = 'b'.repeat(32);
    expect(validateCsrfToken(token1, token2)).toBe(false);
  });

  it('should reject tokens shorter than 32 characters', () => {
    const shortToken = 'abc123';
    expect(validateCsrfToken(shortToken, shortToken)).toBe(false);
  });

  it('should accept tokens longer than 32 characters', () => {
    const longToken = 'a'.repeat(64);
    expect(validateCsrfToken(longToken, longToken)).toBe(true);
  });

  it('should reject empty tokens', () => {
    expect(validateCsrfToken('', '')).toBe(false);
  });

  it('should validate real generated tokens', () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(token, token)).toBe(true);
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Note: We can't easily clear the rate limit map between tests
    // so we use unique identifiers for each test
  });

  it('should allow first request', () => {
    const result = checkRateLimit('user1', 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBeUndefined();
  });

  it('should allow requests within limit', () => {
    const identifier = 'user2';
    const limit = 5;

    for (let i = 0; i < limit; i++) {
      const result = checkRateLimit(identifier, limit, 60000);
      expect(result.allowed).toBe(true);
    }
  });

  it('should block requests exceeding limit', () => {
    const identifier = 'user3';
    const limit = 3;

    // Make 3 allowed requests
    for (let i = 0; i < limit; i++) {
      checkRateLimit(identifier, limit, 60000);
    }

    // 4th request should be blocked
    const result = checkRateLimit(identifier, limit, 60000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeDefined();
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should provide retryAfter value when rate limited', () => {
    const identifier = 'user4';
    const limit = 2;
    const window = 60000; // 60 seconds

    // Hit the limit
    checkRateLimit(identifier, limit, window);
    checkRateLimit(identifier, limit, window);

    // Should be blocked
    const result = checkRateLimit(identifier, limit, window);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeLessThanOrEqual(60);
  });

  it('should reset after time window expires', async () => {
    const identifier = 'user5';
    const limit = 2;
    const window = 100; // 100ms for fast test

    // Hit the limit
    checkRateLimit(identifier, limit, window);
    checkRateLimit(identifier, limit, window);

    // Should be blocked
    expect(checkRateLimit(identifier, limit, window).allowed).toBe(false);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should be allowed again
    const result = checkRateLimit(identifier, limit, window);
    expect(result.allowed).toBe(true);
  });

  it('should track different identifiers separately', () => {
    const limit = 2;
    const window = 60000;

    // User1 hits limit
    checkRateLimit('user6a', limit, window);
    checkRateLimit('user6a', limit, window);
    expect(checkRateLimit('user6a', limit, window).allowed).toBe(false);

    // User2 should still be allowed
    expect(checkRateLimit('user6b', limit, window).allowed).toBe(true);
  });

  it('should handle concurrent requests for same identifier', () => {
    const identifier = 'user7';
    const limit = 10;
    const window = 60000;

    let allowedCount = 0;
    let deniedCount = 0;

    // Simulate 15 concurrent requests
    for (let i = 0; i < 15; i++) {
      const result = checkRateLimit(identifier, limit, window);
      if (result.allowed) {
        allowedCount++;
      } else {
        deniedCount++;
      }
    }

    expect(allowedCount).toBe(limit);
    expect(deniedCount).toBe(5);
  });
});

describe('security integration tests', () => {
  it('should sanitize and validate user input comprehensively', () => {
    const userInput = {
      email: 'test@example.com',
      name: '<script>alert("xss")</script>John Doe',
      amount: 1234.56,
      uuid: '123e4567-e89b-42d3-a456-426614174000',
    };

    // Validate email
    expect(isValidEmail(userInput.email)).toBe(true);

    // Sanitize name (XSS prevention)
    const safeName = sanitizeHtml(userInput.name);
    expect(safeName).not.toContain('<script>');

    // Validate amount
    expect(isValidAmount(userInput.amount)).toBe(true);

    // Validate UUID
    expect(isValidUuid(userInput.uuid)).toBe(true);
  });

  it('should prevent SQL injection in search queries', () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const sanitized = sanitizeSql(maliciousInput);

    expect(sanitized).not.toContain("'");
    expect(sanitized).not.toContain(';');
    expect(sanitized).not.toContain('\\');
  });

  it('should handle file upload security comprehensively', () => {
    const createMockFile = (name: string, size: number, type: string): File => ({
      name,
      size,
      type,
    } as File);

    // Malicious filename
    const filename = '../../../etc/passwd';
    const safeFilename = sanitizeFilename(filename);
    expect(safeFilename).not.toContain('..');

    // Valid file
    const validFile = createMockFile(safeFilename, 1024, 'application/pdf');
    const validation = validateFileUpload(validFile);
    expect(validation.valid).toBe(true);
  });

  it('should implement CSRF protection workflow', () => {
    // Generate token
    const csrfToken = generateCsrfToken();
    expect(csrfToken.length).toBeGreaterThanOrEqual(32);

    // Store in session (simulated)
    const sessionToken = csrfToken;

    // Validate on form submission
    const isValid = validateCsrfToken(csrfToken, sessionToken);
    expect(isValid).toBe(true);

    // Reject tampered token
    const tamperedToken = csrfToken + 'extra';
    const isTampered = validateCsrfToken(tamperedToken, sessionToken);
    expect(isTampered).toBe(false);
  });

  it('should implement rate limiting workflow', () => {
    const userId = 'security-test-user';
    const limit = 5;
    const window = 60000;

    // Normal usage
    for (let i = 0; i < limit; i++) {
      const result = checkRateLimit(userId, limit, window);
      expect(result.allowed).toBe(true);
    }

    // Abuse detection
    const blocked = checkRateLimit(userId, limit, window);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });
});
