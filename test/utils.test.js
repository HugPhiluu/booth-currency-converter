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