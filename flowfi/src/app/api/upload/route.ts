import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectCurrency } from "@/lib/currency";

const CATEGORY_KEYWORDS: Record<string, { keywords: string[]; subcategory?: string }> = {
  // Housing & Utilities
  "Housing": {
    keywords: ["rent", "mortgage", "sewa", "cicilan rumah"],
    subcategory: "Rent/Mortgage"
  },
  "Electricity": {
    keywords: ["listrik", "pln", "token listrik"],
    subcategory: "Electricity"
  },
  "Water": {
    keywords: ["air", "pdam", "air bersih"],
    subcategory: "Water"
  },
  "Internet": {
    keywords: ["internet", "wifi", "telkom", "indihome", "biznet", "cbn"],
    subcategory: "Internet"
  },
  "Gas": {
    keywords: ["gas", "elpiji", "lpg", "gas alam"],
    subcategory: "Gas"
  },

  // Food & Dining
  "Groceries": {
    keywords: ["grocery", "supermarket", "pasar", "sayur", "buah", "daging", "ikan", "ayam", "beras", "minyak", "gula", "tepung", "susu"],
    subcategory: "Groceries"
  },
  "Restaurants": {
    keywords: ["restaurant", "resto", "warung", "kantin", "rumah makan", "padang", "warteg", "bakmie", "bakmi", "nasi", "sate", "soto", "bakso", "siomay", "rendang", "pecel", "gado", "rujak", "mcdonald", "kfc", "pizza", "burger", "jco", "starbucks", "kopitiam", "warkop", "foodsomnia", "guldens", "tahu", "kwetiau", "mie", "sambal", "makan"],
    subcategory: "Restaurants"
  },
  "Coffee & Snacks": {
    keywords: ["coffee", "kopi", "cafe", "snack", "gorengan", "roti", "cake", "donut", "es teh", "jus", "teh", "minuman", "drink"],
    subcategory: "Coffee & Snacks"
  },
  "Food Delivery": {
    keywords: ["gofood", "grabfood", "shopeefood", "delivery", "antaran"],
    subcategory: "Food Delivery"
  },

  // Transportation
  "Fuel": {
    keywords: ["bensin", "fuel", "spbu", "pertamina", "shell", "bp", "vivo"],
    subcategory: "Fuel"
  },
  "Public Transport": {
    keywords: ["bus", "kereta", "train", "mrt", "lrt", "transjakarta", "krl", "commuter"],
    subcategory: "Public Transport"
  },
  "Ride-Hailing": {
    keywords: ["gojek", "grab", "uber", "gocar", "grabcar", "gopay", "ovo", "dana", "shopeepay"],
    subcategory: "Ride-Hailing"
  },
  "Parking": {
    keywords: ["parkir", "parking"],
    subcategory: "Parking"
  },
  "Toll Fees": {
    keywords: ["toll", "tol", "e-toll", "mandiri e-toll"],
    subcategory: "Toll Fees"
  },

  // Shopping
  "Online Shopping": {
    keywords: ["shopee", "tokopedia", "lazada", "blibli", "bukalapak", "tiktok shop", "amazon", "online"],
    subcategory: "Online Shopping"
  },
  "Clothing": {
    keywords: ["baju", "fashion", "sepatu", "tas", "clothing", "pakaian", "celana", "jaket"],
    subcategory: "Clothing"
  },
  "Electronics": {
    keywords: ["elektronik", "handphone", "laptop", "komputer", "gadget", "hp", "tablet"],
    subcategory: "Electronics"
  },
  "Convenience Store": {
    keywords: ["alfamart", "alfa_", "indomaret", "minimarket", "convenience store", "7-eleven", "family mart", "circle k", "lawson"],
    subcategory: "Convenience Store"
  },

  // Entertainment
  "Streaming Services": {
    keywords: ["netflix", "spotify", "youtube", "disney", "hbo", "vidio", "wetv", "iqiyi", "bstation"],
    subcategory: "Streaming Services"
  },
  "Movies": {
    keywords: ["bioskop", "cinema", "xxi", "cgv", "cinemaxx", "film", "movie"],
    subcategory: "Movies"
  },
  "Games": {
    keywords: ["game", "steam", "playstation", "xbox", "nintendo", "mobile legends", "pubg", "genshin"],
    subcategory: "Games"
  },
  "Events": {
    keywords: ["konser", "event", "tiket", "concert", "festival", "exhibition"],
    subcategory: "Events"
  },

  // Health & Medical
  "Doctor Visits": {
    keywords: ["dokter", "doctor", "rumah sakit", "hospital", "klinik", "clinic", "puskesmas"],
    subcategory: "Doctor Visits"
  },
  "Medicine": {
    keywords: ["apotek", "farmasi", "obat", "medicine", "vitamin", "suplemen", "pharmacy"],
    subcategory: "Medicine"
  },
  "Insurance": {
    keywords: ["asuransi", "insurance", "bpjs", "prudential", "allianz", "manulife"],
    subcategory: "Insurance"
  },
  "Fitness/Gym": {
    keywords: ["gym", "fitness", "olahraga", "sport", "senam", "yoga"],
    subcategory: "Fitness/Gym"
  },

  // Education
  "School Fees": {
    keywords: ["sekolah", "school", "universitas", "university", "kuliah", "spp", "uang sekolah"],
    subcategory: "School Fees"
  },
  "Courses": {
    keywords: ["kursus", "course", "training", "seminar", "workshop", "bootcamp", "udemy", "coursera"],
    subcategory: "Courses"
  },
  "Books": {
    keywords: ["buku", "book", "gramedia", "tokobuku", "ebook"],
    subcategory: "Books"
  },

  // Subscriptions
  "Software Licenses": {
    keywords: ["chatgpt", "openai", "microsoft", "adobe", "canva", "figma", "notion", "software", "license"],
    subcategory: "Software Licenses"
  },
  "Cloud Storage": {
    keywords: ["google drive", "icloud", "dropbox", "onedrive", "cloud storage", "storage"],
    subcategory: "Cloud Storage"
  },

  // Financial
  "Loan Payments": {
    keywords: ["cicilan", "loan", "kredit", "angsuran", "installment"],
    subcategory: "Loan Payments"
  },
  "Credit Card Payments": {
    keywords: ["kartu kredit", "credit card", "cc payment", "tagihan kartu kredit"],
    subcategory: "Credit Card Payments"
  },
  "Taxes": {
    keywords: ["pajak", "tax", "pph", "ppn", "e-billing"],
    subcategory: "Taxes"
  },
  "Bank Fees": {
    keywords: ["biaya admin", "admin fee", "bank fee", "transfer fee", "biaya transfer"],
    subcategory: "Bank Fees"
  },

  // Travel
  "Flights": {
    keywords: ["pesawat", "flight", "airline", "garuda", "lion air", "airasia", "citilink", "tiket.com", "traveloka"],
    subcategory: "Flights"
  },
  "Hotels": {
    keywords: ["hotel", "penginapan", "homestay", "villa", "airbnb", "booking.com", "agoda"],
    subcategory: "Hotels"
  },

  // Family & Gifts
  "Gifts": {
    keywords: ["gift", "hadiah", "kado", "parcel", "bingkisan"],
    subcategory: "Gifts"
  },
  "Donations": {
    keywords: ["donasi", "donation", "sedekah", "zakat", "infaq", "amal"],
    subcategory: "Donations"
  },
  "Family Support": {
    keywords: ["transfer ke", "kirim uang", "family", "keluarga", "ortu", "anak", "support"],
    subcategory: "Family Support"
  },

  // Income categories
  "Salary": {
    keywords: ["gaji", "salary", "payroll", "upah", "tunjangan", "bonus", "THR"],
    subcategory: "Salary"
  },
  "Freelance": {
    keywords: ["freelance", "project", "konsultasi", "consulting", "jasa", "service", "client"],
    subcategory: "Freelance"
  },
  "Investments": {
    keywords: ["investasi", "saham", "stock", "reksadana", "mutual fund", "deposito", "dividend", "return", "bunga", "interest"],
    subcategory: "Investments"
  },
  "Refunds": {
    keywords: ["refund", "return", "cashback", "pengembalian", "retur"],
    subcategory: "Refunds"
  },
};

function detectCategory(description: string, type: string): { category: string; subcategory?: string } {
  const desc = description.toLowerCase();

  for (const [category, data] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of data.keywords) {
      if (desc.includes(keyword)) {
        return { category, subcategory: data.subcategory };
      }
    }
  }

  return { category: type === "income" ? "Other Income" : "Other" };
}

function detectPaymentMethod(description: string): string {
  const desc = description.toLowerCase();

  if (desc.includes("qris")) return "QRIS";
  if (desc.includes("debit")) return "Debit Card";
  if (desc.includes("credit")) return "Credit Card";
  if (desc.includes("transfer")) return "Bank Transfer";
  if (desc.includes("gopay") || desc.includes("ovo") || desc.includes("dana") || desc.includes("shopeepay"))
    return "E-Wallet";
  if (desc.includes("cash") || desc.includes("tunai")) return "Cash";

  return "Bank Transfer";
}

function parseIndonesianDate(dateStr: string): Date {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  return new Date();
}

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < row.length && row[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);

  return result;
}

function parseCSV(text: string, userId: string, categoryMap: Map<string, string>) {
  const cleanText = text.replace(/^\uFEFF/, "");
  const lines = cleanText.split("\n").filter((line) => line.trim());
  const transactions: Array<{
    amount: number;
    type: string;
    description: string;
    date: Date;
    categoryId: string;
    paymentMethod: string;
    notes: string;
  }> = [];
  const errors: string[] = [];

  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes("tanggal") || line.includes("date") || line.includes("keterangan")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes("description") || line.includes("amount")) {
        headerIndex = i;
        break;
      }
    }
  }

  if (headerIndex === -1) {
    return { transactions, errors: ["Could not find header row in CSV"] };
  }

  const headers = parseCSVRow(lines[headerIndex]).map((h) =>
    h.trim().toLowerCase().replace(/"/g, "")
  );

  const dateIdx = headers.findIndex((h) => h.includes("tanggal") || h.includes("date"));
  const descIdx = headers.findIndex((h) => h.includes("keterangan") || h.includes("remarks") || h.includes("description"));
  const amountIdx = headers.findIndex((h) => h.includes("nominal") || h.includes("amount"));
  const typeIdx = headers.findIndex((h) => h.includes("tipe") || h.includes("type"));

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    if (row.length < 3) continue;

    const dateStr = dateIdx >= 0 ? row[dateIdx]?.trim() : "";
    const description = descIdx >= 0 ? row[descIdx]?.trim() : "";
    const amountStr = amountIdx >= 0 ? row[amountIdx]?.trim() : "";
    const typeStr = typeIdx >= 0 ? row[typeIdx]?.trim() : "";

    if (!amountStr || amountStr === "") continue;

    const summaryKeywords = ["saldo awal", "total pemasukan", "total pengeluaran", "saldo akhir", "initial balance", "ending balance"];
    if (summaryKeywords.some((kw) => lines[i].toLowerCase().includes(kw))) continue;

    const cleanAmount = amountStr.replace(/[.\s]/g, "").replace(",", ".");
    const amount = parseFloat(cleanAmount);

    if (isNaN(amount)) continue;

    let type: string;
    if (typeStr) {
      const typeLower = typeStr.toLowerCase();
      if (typeLower.includes("pemasukan") || typeLower.includes("income") || typeLower === "credit") {
        type = "income";
      } else {
        type = "expense";
      }
    } else {
      type = amount >= 0 ? "income" : "expense";
    }

    const absAmount = Math.abs(amount);
    const date = dateStr ? parseIndonesianDate(dateStr) : new Date();
    const { category: categoryName, subcategory } = detectCategory(description, type);
    const categoryId = categoryMap.get(subcategory || categoryName) || categoryMap.get(categoryName) || categoryMap.get(type === "income" ? "Other Income" : "Other");
    const paymentMethod = detectPaymentMethod(description);

    if (!categoryId) {
      errors.push(`Row ${i + 1}: No matching category for "${subcategory || categoryName}"`);
      continue;
    }

    transactions.push({
      amount: absAmount,
      type,
      description: description || "Imported transaction",
      date,
      categoryId,
      paymentMethod,
      notes: subcategory ? `${categoryName} > ${subcategory}` : categoryName,
    });
  }

  return { transactions, errors };
}

async function parsePDF(buffer: Buffer) {
  const pdfjsLib = await import("pdfjs-dist");
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = "";
  
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ");
    text += pageText + "\n";
  }
  
  return text;
}

function parsePDFText(text: string, userId: string, categoryMap: Map<string, string>) {
  const lines = text.split("\n").filter((line) => line.trim());
  const transactions: Array<{
    amount: number;
    type: string;
    description: string;
    date: Date;
    categoryId: string;
    paymentMethod: string;
    notes: string;
  }> = [];
  const errors: string[] = [];

  const datePattern = /(\d{2}\/\d{2}\/\d{4})/;
  const amountPattern = /([+-]?[\d.,]+)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const dateMatch = line.match(datePattern);

    if (!dateMatch) continue;

    const dateStr = dateMatch[1];
    const date = parseIndonesianDate(dateStr);

    const afterDate = line.substring(line.indexOf(dateStr) + dateStr.length).trim();
    const parts = afterDate.split(/\s{2,}|\t/);

    if (parts.length < 2) continue;

    let description = parts[0].trim();
    let amountStr = "";

    for (let j = 1; j < parts.length; j++) {
      const cleaned = parts[j].replace(/[.,\s]/g, "");
      if (/^-?\d+$/.test(cleaned) || /^-?\d+\.\d+$/.test(parts[j].trim())) {
        amountStr = parts[j].trim();
        break;
      }
    }

    if (!amountStr) {
      const amountMatch = afterDate.match(/([+-]?[\d.,]+)\s*$/);
      if (amountMatch) {
        amountStr = amountMatch[1];
      }
    }

    if (!amountStr) continue;

    const cleanAmount = amountStr.replace(/[.\s]/g, "").replace(",", ".");
    const amount = parseFloat(cleanAmount);

    if (isNaN(amount)) continue;

    const summaryKeywords = ["saldo awal", "total pemasukan", "total pengeluaran", "saldo akhir", "initial balance", "ending balance"];
    if (summaryKeywords.some((kw) => line.toLowerCase().includes(kw))) continue;

    let type: string;
    if (line.toLowerCase().includes("pemasukan") || line.toLowerCase().includes("income")) {
      type = "income";
    } else if (line.toLowerCase().includes("pengeluaran") || line.toLowerCase().includes("expense")) {
      type = "expense";
    } else {
      type = amount >= 0 ? "income" : "expense";
    }

    const absAmount = Math.abs(amount);
    const { category: categoryName, subcategory } = detectCategory(description, type);
    const categoryId = categoryMap.get(subcategory || categoryName) || categoryMap.get(categoryName) || categoryMap.get(type === "income" ? "Other Income" : "Other");
    const paymentMethod = detectPaymentMethod(description);

    if (!categoryId) {
      errors.push(`Line ${i + 1}: No matching category for "${subcategory || categoryName}"`);
      continue;
    }

    transactions.push({
      amount: absAmount,
      type,
      description: description || "Imported transaction",
      date,
      categoryId,
      paymentMethod,
      notes: subcategory ? `${categoryName} > ${subcategory}` : categoryName,
    });
  }

  return { transactions, errors };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please log out and log in again." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const allCategories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { isDefault: true },
        ],
      },
    });

    const categoryMap = new Map<string, string>();
    for (const cat of allCategories) {
      categoryMap.set(cat.name, cat.id);
    }

    let totalCreated = 0;
    const allErrors: string[] = [];
    let detectedCurrency = "USD";

    for (const file of files) {
      const fileName = file.name.toLowerCase();
      const isCSV = fileName.endsWith(".csv");
      const isPDF = fileName.endsWith(".pdf");

      if (!isCSV && !isPDF) {
        allErrors.push(`${file.name}: Unsupported file type`);
        continue;
      }

      let transactions: Array<{
        amount: number;
        type: string;
        description: string;
        date: Date;
        categoryId: string;
        paymentMethod: string;
        notes: string;
      }>;
      let errors: string[];

      if (isCSV) {
        const text = await file.text();
        detectedCurrency = detectCurrency(text);
        const result = parseCSV(text, session.user.id, categoryMap);
        transactions = result.transactions;
        errors = result.errors;
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const text = await parsePDF(buffer);
        detectedCurrency = detectCurrency(text);
        const result = parsePDFText(text, session.user.id, categoryMap);
        transactions = result.transactions;
        errors = result.errors;
      }

      if (transactions.length > 0) {
        const created = await prisma.transaction.createMany({
          data: transactions.map((t) => ({
            ...t,
            userId: session.user.id,
          })),
        });
        totalCreated += created.count;
      }

      if (errors.length > 0) {
        allErrors.push(...errors.map((e) => `${file.name}: ${e}`));
      }
    }

    if (totalCreated === 0) {
      return NextResponse.json(
        { error: "No valid transactions found", details: allErrors },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { currency: detectedCurrency },
    });

    return NextResponse.json({
      message: `Imported ${totalCreated} transactions from ${files.length} file(s)`,
      count: totalCreated,
      currency: detectedCurrency,
      errors: allErrors.length > 0 ? allErrors : undefined,
    });
  } catch (error) {
    console.error("Error uploading statement:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
