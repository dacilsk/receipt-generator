export function formatCurrencyMXN(
  amount: number | bigint,
  padEnd = 5,
  padStart = 15,
) {
  return formatCurrency(amount, 'MXN', 'es-MX', padEnd, padStart);
}

export function formatCurrency(
  amount: number | bigint,
  currencyCode: string | undefined,
  locale = 'en-US',
  padEnd = 5,
  padStart = 15,
) {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  });
  const formatted = formatter.format(amount);
  const [symbol, number] = formatted.split(/\s+/);
  return `${symbol.padEnd(padEnd)}${number.padStart(padStart)}`;
}
