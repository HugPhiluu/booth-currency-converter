const { formatCurrency } = require('../src/utils');

describe('formatCurrency', () => {
  test('formats with dot notation (en-US)', () => {
    expect(formatCurrency(1234.56, 'dot')).toBe('1,234.56');
  });

  test('formats with comma notation (de-DE)', () => {
    expect(formatCurrency(1234.56, 'comma')).toBe('1.234,56');
  });

  test('formats zero correctly', () => {
    expect(formatCurrency(0, 'dot')).toBe('0.00');
    expect(formatCurrency(0, 'comma')).toBe('0,00');
  });

  test('formats large numbers', () => {
    expect(formatCurrency(1234567.89, 'dot')).toBe('1,234,567.89');
    expect(formatCurrency(1234567.89, 'comma')).toBe('1.234.567,89');
  });
});

// Test price detection regex patterns
describe('Price Detection Patterns', () => {
  const testPrices = [
    '1000 JPY',
    '1,000 JPY', 
    '¥1000',
    '￥1,000',
    '1000円',
    '1,000円',
    '1000 yen',
    '1,000 yen'
  ];
  
  const nonPrices = [
    '7',           // Single digit
    '1430',        // Like count or other number without currency
    '123',         // Random number
    '2024',        // Year
    '100%',        // Percentage
    '3.5 stars',   // Rating
    'Chapter 10'   // Text with number
  ];
  
  test('should match various Japanese price formats', () => {
    // Updated regex to be more restrictive - requires clear currency indicators
    const regex = /([¥￥]\s*[0-9]+(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?)|([0-9]+(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?\s*(?:JPY|円|yen))/gi;
    
    testPrices.forEach(price => {
      expect(price.match(regex)).toBeTruthy();
    });
  });
  
  test('should NOT match non-price numbers', () => {
    // Updated regex to be more restrictive - requires clear currency indicators
    const regex = /([¥￥]\s*[0-9]+(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?)|([0-9]+(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?\s*(?:JPY|円|yen))/gi;
    
    nonPrices.forEach(text => {
      expect(text.match(regex)).toBeFalsy();
    });
  });
});