/**
 * Unit Test Example: Slug Generator
 * 
 * This is a simple test to verify Jest setup works correctly.
 * Tests a pure utility function with no dependencies.
 */

import { slugify, uniqueSlug } from '../../../utils/slug';

describe('slugify', () => {
  describe('Basic functionality', () => {
    it('should convert string to lowercase slug', () => {
      const result = slugify('Hello World');
      expect(result).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      const result = slugify('My Test Organization');
      expect(result).toBe('my-test-organization');
    });

    it('should remove special characters', () => {
      const result = slugify('Test & Company!');
      expect(result).toBe('test-company');
    });

    it('should handle multiple spaces', () => {
      const result = slugify('Too   Many    Spaces');
      expect(result).toBe('too-many-spaces');
    });

    it('should trim leading and trailing spaces', () => {
      const result = slugify('  Trimmed  ');
      expect(result).toBe('trimmed');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const result = slugify('');
      expect(result).toBe('');
    });

    it('should handle string with only special characters', () => {
      const result = slugify('!@#$%^&*()');
      expect(result).toBe('');
    });

    it('should handle unicode characters', () => {
      const result = slugify('Café Münchën');
      // Unicode normalization might produce different results
      expect(result).toContain('cafe');
      expect(result).not.toContain('é');
      expect(result).not.toContain('ü');
    });

    it('should handle numbers', () => {
      const result = slugify('Test 123 Organization');
      expect(result).toBe('test-123-organization');
    });

    it('should truncate to maxLength when provided', () => {
      const result = slugify('This is a very long organization name', 15);
      expect(result.length).toBeLessThanOrEqual(15);
      expect(result).not.toMatch(/-$/); // Should not end with hyphen
    });
  });

  describe('Real-world examples', () => {
    it('should handle typical organization names', () => {
      expect(slugify('Acme Corporation')).toBe('acme-corporation');
      expect(slugify('The Wellness Company')).toBe('the-wellness-company');
      expect(slugify('Smith & Associates, LLC')).toBe('smith-associates-llc');
    });

    it('should create valid URL-safe slugs', () => {
      const result = slugify('My "Amazing" Company (2024)');
      // Should not contain quotes or parentheses
      expect(result).not.toContain('"');
      expect(result).not.toContain('(');
      expect(result).not.toContain(')');
      // Should be lowercase
      expect(result).toBe(result.toLowerCase());
    });

    it('should handle consecutive hyphens', () => {
      const result = slugify('Test --- Multiple --- Hyphens');
      expect(result).toBe('test-multiple-hyphens');
      expect(result).not.toContain('--'); // No consecutive hyphens
    });
  });
});

describe('uniqueSlug', () => {
  describe('Basic functionality', () => {
    it('should return base slug when it does not exist', async () => {
      const existsFn = jest.fn().mockResolvedValue(false);
      const result = await uniqueSlug('Test Organization', existsFn);
      
      expect(result).toBe('test-organization');
      expect(existsFn).toHaveBeenCalledTimes(1);
      expect(existsFn).toHaveBeenCalledWith('test-organization');
    });

    it('should append -2 when base slug exists', async () => {
      const existsFn = jest.fn()
        .mockResolvedValueOnce(true)  // test-organization exists
        .mockResolvedValueOnce(false); // test-organization-2 does not exist
      
      const result = await uniqueSlug('Test Organization', existsFn);
      
      expect(result).toBe('test-organization-2');
      expect(existsFn).toHaveBeenCalledTimes(2);
      expect(existsFn).toHaveBeenNthCalledWith(1, 'test-organization');
      expect(existsFn).toHaveBeenNthCalledWith(2, 'test-organization-2');
    });

    it('should increment suffix until unique slug is found', async () => {
      const existsFn = jest.fn()
        .mockResolvedValueOnce(true)  // test-org exists
        .mockResolvedValueOnce(true)  // test-org-2 exists
        .mockResolvedValueOnce(true)  // test-org-3 exists
        .mockResolvedValueOnce(false); // test-org-4 does not exist
      
      const result = await uniqueSlug('Test Org', existsFn);
      
      expect(result).toBe('test-org-4');
      expect(existsFn).toHaveBeenCalledTimes(4);
    });

    it('should handle empty base string', async () => {
      const existsFn = jest.fn().mockResolvedValue(false);
      const result = await uniqueSlug('', existsFn);
      
      expect(result).toBe('');
      expect(existsFn).not.toHaveBeenCalled();
    });

    it('should handle special characters in base string', async () => {
      const existsFn = jest.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      
      const result = await uniqueSlug('Test & Company!', existsFn);
      
      expect(result).toBe('test-company-2');
    });
  });

  describe('Edge cases', () => {
    it('should respect maxAttempts parameter', async () => {
      // Always return true, simulating all slugs exist
      const existsFn = jest.fn().mockResolvedValue(true);
      
      const result = await uniqueSlug('Test Org', existsFn, 5);
      
      // Should try 5 times, then fall back to timestamp
      expect(existsFn).toHaveBeenCalledTimes(5);
      expect(result).toMatch(/^test-org-\d+$/);
      expect(result).not.toBe('test-org-5'); // Should use timestamp
    });

    it('should use default maxAttempts of 1000', async () => {
      // Mock to fail after many attempts
      const existsFn = jest.fn().mockResolvedValue(true);
      
      const result = await uniqueSlug('Test', existsFn);
      
      // Should try 1000 times by default
      expect(existsFn).toHaveBeenCalledTimes(1000);
      expect(result).toMatch(/^test-\d+$/);
    });

    it('should handle suffix starting from 2', async () => {
      const existsFn = jest.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      
      const result = await uniqueSlug('Example', existsFn);
      
      expect(result).toBe('example-2');
      expect(existsFn).toHaveBeenNthCalledWith(1, 'example');
      expect(existsFn).toHaveBeenNthCalledWith(2, 'example-2');
    });

    it('should handle large suffix numbers', async () => {
      const existsFn = jest.fn()
        .mockResolvedValue(true) // First 99 calls
        .mockResolvedValueOnce(false); // 100th call
      
      // Mock only first 99 as true, 100th as false
      existsFn.mockReset();
      for (let i = 0; i < 99; i++) {
        existsFn.mockResolvedValueOnce(true);
      }
      existsFn.mockResolvedValueOnce(false);
      
      const result = await uniqueSlug('Test', existsFn);
      
      expect(result).toBe('test-100');
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical organization name collision', async () => {
      // Simulate "Acme Corp" and "Acme Corp 2" already exist
      const existingNames = ['acme-corp', 'acme-corp-2'];
      const existsFn = jest.fn((slug: string) => 
        Promise.resolve(existingNames.includes(slug))
      );
      
      const result = await uniqueSlug('Acme Corp', existsFn);
      
      expect(result).toBe('acme-corp-3');
    });

    it('should work with async database check', async () => {
      // Simulate real database lookup with delay
      const existsFn = jest.fn(async (slug: string) => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return slug === 'my-company';
      });
      
      const result = await uniqueSlug('My Company', existsFn);
      
      expect(result).toBe('my-company-2');
      expect(existsFn).toHaveBeenCalledTimes(2);
    });

    it('should handle unicode normalization in uniqueSlug', async () => {
      const existsFn = jest.fn().mockResolvedValue(false);
      
      const result = await uniqueSlug('Café Münchën', existsFn);
      
      expect(result).toContain('cafe');
      expect(existsFn).toHaveBeenCalledWith(expect.stringContaining('cafe'));
    });
  });

  describe('Fallback behavior', () => {
    it('should generate timestamp-based slug when all attempts fail', async () => {
      const existsFn = jest.fn().mockResolvedValue(true);
      const beforeTimestamp = Date.now();
      
      const result = await uniqueSlug('Test', existsFn, 3);
      
      const afterTimestamp = Date.now();
      expect(result).toMatch(/^test-\d+$/);
      
      // Extract timestamp from result
      const timestamp = parseInt(result.split('-')[1] || '0');
      expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(timestamp).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should ensure fallback slug is always returned', async () => {
      const existsFn = jest.fn().mockResolvedValue(true);
      
      const result = await uniqueSlug('Organization', existsFn, 1);
      
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
      expect(result).toMatch(/^organization-\d+$/);
    });
  });
});
