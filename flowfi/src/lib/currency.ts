export interface Currency {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: Currency[] = [
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", locale: "id-ID" },
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", locale: "zh-CN" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP" },
  { code: "EUR", name: "Euro", symbol: "€", locale: "de-DE" },
  { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", locale: "en-SG" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", locale: "ms-MY" },
  { code: "THB", name: "Thai Baht", symbol: "฿", locale: "th-TH" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", locale: "fil-PH" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", locale: "vi-VN" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", locale: "ko-KR" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "en-IN" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", locale: "en-AU" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", locale: "en-CA" },
];

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);

  if (currencyCode === "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
  }).format(amount);
}

export function detectCurrency(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes("rp") || lower.includes("idr") || lower.includes("rupiah")) {
    return "IDR";
  }
  if (lower.includes("$") || lower.includes("usd") || lower.includes("dollar")) {
    return "USD";
  }
  if (lower.includes("¥") && (lower.includes("cny") || lower.includes("yuan") || lower.includes("rmb"))) {
    return "CNY";
  }
  if (lower.includes("¥") || lower.includes("jpy") || lower.includes("yen")) {
    return "JPY";
  }
  if (lower.includes("€") || lower.includes("eur") || lower.includes("euro")) {
    return "EUR";
  }
  if (lower.includes("£") || lower.includes("gbp") || lower.includes("pound")) {
    return "GBP";
  }
  if (lower.includes("s$") || lower.includes("sgd")) {
    return "SGD";
  }
  if (lower.includes("rm") || lower.includes("myr")) {
    return "MYR";
  }
  if (lower.includes("฿") || lower.includes("thb") || lower.includes("baht")) {
    return "THB";
  }
  if (lower.includes("₱") || lower.includes("php") || lower.includes("peso")) {
    return "PHP";
  }
  if (lower.includes("₫") || lower.includes("vnd") || lower.includes("dong")) {
    return "VND";
  }
  if (lower.includes("₩") || lower.includes("krw") || lower.includes("won")) {
    return "KRW";
  }
  if (lower.includes("₹") || lower.includes("inr") || lower.includes("rupee")) {
    return "INR";
  }

  return "USD";
}
