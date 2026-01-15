/**
 * Unit Test Example: Slug Generator
 * 
 * This is a simple test to verify Jest setup works correctly.
 * Tests a pure utility function with no dependencies.
 */

import { slugify } from '../../../utils/slug';

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
