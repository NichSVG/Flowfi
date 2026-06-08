import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Food & Dining": [
    "makan", "food", "restaurant", "cafe", "warung", "kantin", "bakmie", "nasi",
    "sate", "ayam", "ikan", "gorengan", "grocery", "supermarket", "pasar",
    "bread", "cake", "donut", "jco", "mcdonald", "kfc", "pizza", "burger",
    "starbucks", "kopitiam", "warkop", "sambal", "padang", "warteg",
    "foodsomnia", "guldens", "tahu", "bakmi", "kwetiau", "mie", "soto",
    "bakso", "siomay", "rendang", "pecel", "gado", "rujak", "es teh",
    "jus", "kopi", "teh", "minuman", "drink", "rumah makan"
  ],
  "Transportation": [
    "gojek", "grab", "gopay", "ovo", "dana", "shopeepay", "transport",
    "bensin", "fuel", "parkir", "toll", "taksi", "taxi", "bus", "kereta",
    "pesawat", "flight", "travel", "decathlon"
  ],
  "Bills & Utilities": [
    "listrik", "pln", "air", "pdam", "gas", "internet", "wifi", "telkom",
    "indosat", "telkomsel", "xl", "tri", "iour", "pulsa", "token",
    "telepon", "phone", "bill", "tagihan", "utility"
  ],
  "Entertainment": [
    "netflix", "spotify", "youtube", "disney", "hbo", "game", "steam",
    "playstation", "xbox", "nintendo", "bioskop", "cinema", "tiket",
    "konser", "event", "subscription"
  ],
  "Shopping": [
    "shopee", "tokopedia", "lazada", "blibli", "bukalapak", "tiktok shop",
    "amazon", "elektronik", "fashion", "baju", "sepatu", "tas",
    "handphone", "laptop", "komputer", "alfamart", "alfa_", "indomaret",
    "minimarket", "convenience store", "7-eleven", "family mart", "circle k"
  ],
  "Health": [
    "apotek", "farmasi", "dokter", "rumah sakit", "hospital", "klinik",
    "obat", "medicine", "vitamin", "gym", "fitness", "health"
  ],
  "Education": [
    "sekolah", "universitas", "kuliah", "kursus", "buku", "book",
    "course", "training", "seminar", "workshop", "pendidikan"
  ],
  "Salary": [
    "gaji", "salary", "payroll", "upah", "bonus", "tunjangan", "dana masuk"
  ],
  "Freelance": [
    "freelance", "project", "konsultasi", "consulting", "jasa", "service"
  ],
  "Investments": [
    "investasi", "saham", "stock", "reksadana", "mutual fund", "deposito",
    "tabungan", "saving", "bunga", "interest", "dividend", "return"
  ],
};

function detectCategory(description: string, type: string): string {
  const desc = description.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (desc.includes(keyword)) {
        return category;
      }
    }
  }

  return type === "income" ? "Other Income" : "Other";
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
    const categoryName = detectCategory(description, type);
    const categoryId = categoryMap.get(categoryName) || categoryMap.get(type === "income" ? "Other Income" : "Other");
    const paymentMethod = detectPaymentMethod(description);

    if (!categoryId) {
      errors.push(`Row ${i + 1}: No matching category for "${categoryName}"`);
      continue;
    }

    transactions.push({
      amount: absAmount,
      type,
      description: description || "Imported transaction",
      date,
      categoryId,
      paymentMethod,
      notes: `Imported from bank statement`,
    });
  }

  return { transactions, errors };
}

async function parsePDF(buffer: Buffer) {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
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
    const categoryName = detectCategory(description, type);
    const categoryId = categoryMap.get(categoryName) || categoryMap.get(type === "income" ? "Other Income" : "Other");
    const paymentMethod = detectPaymentMethod(description);

    if (!categoryId) {
      errors.push(`Line ${i + 1}: No matching category for "${categoryName}"`);
      continue;
    }

    transactions.push({
      amount: absAmount,
      type,
      description: description || "Imported transaction",
      date,
      categoryId,
      paymentMethod,
      notes: `Imported from PDF statement`,
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

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith(".csv");
    const isPDF = fileName.endsWith(".pdf");

    if (!isCSV && !isPDF) {
      return NextResponse.json(
        { error: "Only CSV and PDF files are supported" },
        { status: 400 }
      );
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
      const result = parseCSV(text, session.user.id, categoryMap);
      transactions = result.transactions;
      errors = result.errors;
    } else {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const text = await parsePDF(buffer);
      const result = parsePDFText(text, session.user.id, categoryMap);
      transactions = result.transactions;
      errors = result.errors;
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: "No valid transactions found", details: errors },
        { status: 400 }
      );
    }

    const created = await prisma.transaction.createMany({
      data: transactions.map((t) => ({
        ...t,
        userId: session.user.id,
      })),
    });

    return NextResponse.json({
      message: `Imported ${created.count} transactions`,
      count: created.count,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error uploading statement:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
