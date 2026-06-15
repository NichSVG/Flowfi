const MERCHANT_CACHE = new Map<string, { category: string; subcategory?: string; parentCategory?: string }>();

export function extractMerchantName(description: string): string {
  const desc = description.trim();

  // QRIS: "Pembayaran QRIS | MERCHANT_NAME | ref"
  const qrisMatch = desc.match(/Pembayaran QRIS\s*\|\s*(.+?)(?:\s*\|\s*\S+)?$/i);
  if (qrisMatch) {
    let merchant = qrisMatch[1].trim();
    merchant = merchant.replace(/\s+[A-Za-z0-9]{6,}$/, "").trim();
    merchant = merchant.replace(/\s+\d{5,}$/, "").trim();
    merchant = merchant.replace(/,\s*(?:CP|QR|G\d+|ID\d+).*/i, "").trim();
    return merchant;
  }

  // Debit: "Transaksi Debit di MERCHANT | card | ref"
  const debitMatch = desc.match(/Transaksi Debit di\s+(.+?)(?:\s*\|\s*(?:blu|BCA|Mandiri))/i);
  if (debitMatch) {
    const rawMerchant = debitMatch[1].trim();

    // GoPayID is just a payment processor - not the actual merchant
    // We can't determine the actual merchant from GoPayID alone
    if (/^GoPayID$/i.test(rawMerchant)) {
      return "GoPayID";
    }

    // GOJEK RECURRING = Gojek ride-hailing
    if (/GOJEK/i.test(rawMerchant)) {
      return "Gojek";
    }

    // TTS by TKPD = Tokopedia
    if (/TTS.*TKPD|TKPD/i.test(rawMerchant)) {
      return "Tokopedia";
    }

    // Google TikTok = TikTok subscription
    if (/Google.*TikTok|TikTok.*Google/i.test(rawMerchant)) {
      return "TikTok";
    }

    // Google Themes = Google Themes purchase
    if (/Google.*Themes/i.test(rawMerchant)) {
      return "Google Themes";
    }

    // Google Wallet
    if (/GOOGLE.*WALLET/i.test(rawMerchant)) {
      return "Google Wallet";
    }

    // Steam Purchase / STEAMGAMES
    if (/STEAM|STEAMGAMES/i.test(rawMerchant)) {
      return "Steam";
    }

    // CANVA
    if (/CANVA/i.test(rawMerchant)) {
      return "Canva";
    }

    // COURSIV
    if (/COURSIV/i.test(rawMerchant)) {
      return "Coursiv";
    }

    // PM *Loklok = Loklok streaming
    if (/Loklok/i.test(rawMerchant)) {
      return "Loklok";
    }

    // Grab*
    if (/Grab/i.test(rawMerchant)) {
      return "Grab";
    }

    // Clean up card number suffixes
    const cleaned = rawMerchant
      .replace(/\s*-\s*•+.*$/, "")
      .replace(/\s*\|\s*blu.*$/i, "")
      .trim();

    return cleaned;
  }

  // Refund: "Refund Transaksi Debit di MERCHANT | card | ref"
  const refundMatch = desc.match(/Refund Transaksi Debit di\s+(.+?)(?:\s*\|\s*(?:blu|BCA|Mandiri))/i);
  if (refundMatch) {
    return "Refund: " + extractMerchantName(desc.replace("Refund ", ""));
  }

  // Transfer: "Transfer ke NAME | BANK | ref"
  const transferMatch = desc.match(/Transfer ke\s+(.+?)(?:\s*\|\s*\w)/i);
  if (transferMatch) {
    return transferMatch[1].trim();
  }

  // Dana Masuk: "Dana Masuk dari NAME | BANK"
  const danaMatch = desc.match(/Dana Masuk dari\s+(.+?)(?:\s*\||$)/i);
  if (danaMatch) {
    return danaMatch[1].trim();
  }

  // Top Up: "Top Up E-Wallet | PROVIDER"
  const topupMatch = desc.match(/Top Up E-Wallet\s*\|\s*(.+?)(?:\s*\d|$)/i);
  if (topupMatch) {
    return topupMatch[1].trim();
  }

  // Tarik Tunai (ATM withdrawal)
  if (desc.includes("Tarik Tunai")) {
    return "ATM Withdrawal";
  }

  // Biaya (fees)
  if (desc.includes("Biaya Transfer")) {
    return "Transfer Fee";
  }
  if (desc.includes("Biaya Tarik Tunai")) {
    return "ATM Fee";
  }
  if (desc.includes("Biaya Decline")) {
    return "ATM Decline Fee";
  }
  if (desc.includes("Biaya Top Up")) {
    return "Top Up Fee";
  }
  if (desc.includes("Biaya Pembuatan")) {
    return "Card Fee";
  }

  // Bunga (interest)
  if (desc.includes("Bunga")) {
    return "Bank Interest";
  }

  // Cashback
  if (desc.includes("Cashback")) {
    return "Cashback";
  }

  // Transjakarta
  if (desc.includes("Transjakarta") || desc.includes("TJAPP")) {
    return "Transjakarta";
  }

  // Gopay (direct, not GoPayID)
  if (/^Gopay\b/i.test(desc)) {
    return "GoPay";
  }

  return desc;
}

export async function searchMerchantCategory(
  merchantName: string
): Promise<{ category: string; subcategory?: string; parentCategory?: string } | null> {
  const cacheKey = merchantName.toLowerCase().trim();
  if (MERCHANT_CACHE.has(cacheKey)) {
    return MERCHANT_CACHE.get(cacheKey!)!;
  }

  try {
    const query = encodeURIComponent(`${merchantName} Indonesia restaurant cafe shop`);
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const result = categorizeFromSearchResults(html, merchantName);

    if (result) {
      MERCHANT_CACHE.set(cacheKey, result);
    }

    return result;
  } catch {
    return null;
  }
}

function categorizeFromSearchResults(
  html: string,
  merchantName: string
): { category: string; subcategory?: string; parentCategory?: string } | null {
  const lower = html.toLowerCase();

  const snippets = extractSnippets(html, merchantName);

  const foodKeywords = [
    "restaurant", "restoran", "rumah makan", "warung", "kantin", "cafe", "kedai",
    "food", "makanan", "masakan", "menu", "dish", "meal", "rice", "nasi",
    "chicken", "ayam", "fish", "ikan", "beef", "sapi", "noodle", "mie",
    "bakso", "sate", "soto", "rendang", "pecel", "padang", "sunda", "jawa",
    "bakery", "roti", "cake", "dessert", "pastry", "bread",
    "coffee", "kopi", "tea", "teh", "drink", "beverage", "juice",
    "donut", "pizza", "burger", "sushi", "ramen", "dimsum",
    "warteg", "warung", "food court", "foodcourt",
  ];

  const convenienceKeywords = [
    "convenience store", "minimarket", "alfamart", "indomaret", "familymart",
    "grocery", "supermarket", "market", "mart", "toko",
  ];

  const entertainmentKeywords = [
    "gaming", "game", "esports", "internet cafe", "warnet", "play",
    "cinema", "bioskop", "xxi", "cgv", "movie", "film",
    "karaoke", "billiard", "arcade", "vr", "virtual reality",
  ];

  const shoppingKeywords = [
    "shop", "store", "retail", "mall", "plaza", "marketplace",
    "clothing", "fashion", "apparel", "electronics", "gadget",
    "shopee", "tokopedia", "lazada", "blibli",
  ];

  const healthcareKeywords = [
    "pharmacy", "apotek", "hospital", "rumah sakit", "clinic", "klinik",
    "doctor", "dokter", "medical", "health", "obat", "medicine",
    "gym", "fitness", "workout", "exercise",
  ];

  const beautyKeywords = [
    "barbershop", "salon", "barber", "haircut", "hair", "grooming",
    "beauty", "spa", "facial", "nail", "makeup",
  ];

  const travelKeywords = [
    "travel", "tour", "hotel", "penginapan", "villa", "resort",
    "flight", "pesawat", "airline", "airport", "bandara",
    "traveloka", "tiket", "booking",
  ];

  const donationKeywords = [
    "church", "gereja", "paroki", "masjid", "mosque", "temple",
    "donation", "donasi", "charity", "zakat", "infaq", "sedekah",
  ];

  const educationKeywords = [
    "school", "sekolah", "university", "universitas", "course",
    "training", "education", "pendidikan", "tutorial", "class",
    "copy", "print", "fotocopy", "percetakan",
  ];

  const subscriptionKeywords = [
    "subscription", "streaming", "netflix", "spotify", "youtube",
    "software", "app", "cloud", "storage", "domain", "hosting",
    "canva", "figma", "adobe", "google", "microsoft", "apple",
  ];

  const allText = snippets.join(" ") + " " + lower;

  const checks: [string[], { category: string; subcategory?: string; parentCategory?: string }][] = [
    [foodKeywords, { category: "Food & Dining", subcategory: "Food & Dining" }],
    [convenienceKeywords, { category: "Food & Dining", subcategory: "Food & Dining" }],
    [entertainmentKeywords, { category: "Entertainment", subcategory: "Entertainment" }],
    [beautyKeywords, { category: "Shopping", subcategory: "Beauty" }],
    [healthcareKeywords, { category: "Healthcare", subcategory: "Medical" }],
    [travelKeywords, { category: "Travel", subcategory: "Transport", parentCategory: "Travel" }],
    [donationKeywords, { category: "Gifts & Donations", subcategory: "Gifts & Donations" }],
    [educationKeywords, { category: "Education", subcategory: "Education" }],
    [subscriptionKeywords, { category: "Bills & Subscriptions", subcategory: "Software", parentCategory: "Bills & Subscriptions" }],
    [shoppingKeywords, { category: "Shopping", subcategory: "Clothing", parentCategory: "Shopping" }],
  ];

  let bestMatch: { category: string; subcategory?: string; parentCategory?: string } | null = null;
  let bestScore = 0;

  for (const [keywords, result] of checks) {
    let score = 0;
    for (const kw of keywords) {
      if (allText.includes(kw)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = result;
    }
  }

  if (bestScore >= 2) {
    return bestMatch;
  }

  if (bestScore === 1 && bestMatch) {
    return bestMatch;
  }

  return null;
}

function extractSnippets(html: string, merchantName: string): string[] {
  const snippets: string[] = [];
  const nameLower = merchantName.toLowerCase();

  const regex = new RegExp(`[^<>]{0,200}${escapeRegex(nameLower)}[^<>]{0,200}`, "gi");
  const matches = html.match(regex);

  if (matches) {
    for (const match of matches.slice(0, 5)) {
      snippets.push(match.toLowerCase());
    }
  }

  const snippetRegex = /class="result__snippet"[^>]*>([^<]+)</gi;
  let match;
  while ((match = snippetRegex.exec(html)) !== null) {
    snippets.push(match[1].toLowerCase());
  }

  return snippets;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
