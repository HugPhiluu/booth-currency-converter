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
  
  test('should match various Japanese price formats', () => {
    const regex = /([¥￥]?\s*[0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?\s*(?:JPY|円|yen)?\b)|([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?\s*(?:JPY|円|yen)\b)/gi;
    
    testPrices.forEach(price => {
      expect(price.match(regex)).toBeTruthy();
    });
  });
});