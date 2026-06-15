import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectCurrency } from "@/lib/currency";
import { CATEGORY_KEYWORDS } from "@/lib/category-keywords";
import { extractMerchantName, searchMerchantCategory } from "@/lib/merchant-search";

const SUBCATEGORY_TO_PARENT: Record<string, string> = {};

function detectCategoryFromKeywords(text: string): { category: string; subcategory?: string; parentCategory?: string } | null {
  const lower = text.toLowerCase();

  for (const [category, data] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of data.keywords) {
      if (keyword && lower.includes(keyword)) {
        return { category, subcategory: data.subcategory, parentCategory: data.parent };
      }
    }
  }

  return null;
}

async function detectCategory(description: string, type: string): Promise<{ category: string; subcategory?: string; parentCategory?: string }> {
  // Step 1: Try matching full description against keywords
  const fullMatch = detectCategoryFromKeywords(description);
  if (fullMatch) return fullMatch;

  // Step 2: Extract merchant name and try matching that
  const merchant = extractMerchantName(description);
  if (merchant !== description) {
    const merchantMatch = detectCategoryFromKeywords(merchant);
    if (merchantMatch) return merchantMatch;
  }

  // Step 3: Web search fallback for unknown merchants
  if (type === "expense" && merchant.length > 2) {
    const searchResult = await searchMerchantCategory(merchant);
    if (searchResult) return searchResult;
  }

  return { category: type === "income" ? "Income" : "Miscellaneous" };
}

function resolveCategoryId(
  categoryName: string,
  subcategory: string | undefined,
  parentCategory: string | undefined,
  type: string,
  categoryMap: Map<string, string>
): string | undefined {
  if (subcategory) {
    if (parentCategory) {
      const combined = categoryMap.get(`${parentCategory}:${subcategory}`);
      if (combined) return combined;
    }
    const id = categoryMap.get(subcategory);
    if (id) return id;
  }
  if (parentCategory) {
    const id = categoryMap.get(parentCategory);
    if (id) return id;
  }
  if (categoryName) {
    const id = categoryMap.get(categoryName);
    if (id) return id;
  }
  return categoryMap.get(type === "income" ? "Income" : "Miscellaneous");
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

function parseAmount(amountStr: string): number {
  const cleaned = amountStr.trim();

  if (cleaned.includes(",")) {
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    return parseFloat(normalized);
  }

  const dotCount = (cleaned.match(/\./g) || []).length;

  if (dotCount === 0) {
    return parseFloat(cleaned);
  }

  if (dotCount === 1) {
    const parts = cleaned.split(".");
    if (parts[1].length === 3 && parts[0].length <= 3) {
      return parseFloat(cleaned.replace(".", ""));
    }
    return parseFloat(cleaned);
  }

  return parseFloat(cleaned.replace(/\./g, ""));
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

async function parseCSV(text: string, userId: string, categoryMap: Map<string, string>) {
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

    const amount = parseAmount(amountStr);

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
    const { category: categoryName, subcategory, parentCategory } = await detectCategory(description, type);
    const categoryId = resolveCategoryId(categoryName, subcategory, parentCategory, type, categoryMap);
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
      notes: subcategory ? `${parentCategory || categoryName} > ${subcategory}` : categoryName,
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

async function parsePDFText(text: string, userId: string, categoryMap: Map<string, string>) {
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

    const amount = parseAmount(amountStr);

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
    const { category: categoryName, subcategory, parentCategory } = await detectCategory(description, type);
    const categoryId = resolveCategoryId(categoryName, subcategory, parentCategory, type, categoryMap);
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
      notes: subcategory ? `${parentCategory || categoryName} > ${subcategory}` : categoryName,
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
    for (const cat of allCategories) {
      if (cat.parentId) {
        const parent = allCategories.find((p) => p.id === cat.parentId);
        if (parent) {
          categoryMap.set(`${parent.name}:${cat.name}`, cat.id);
        }
      }
    }

    const userId = session.user.id;
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
        const result = await parseCSV(text, userId, categoryMap);
        transactions = result.transactions;
        errors = result.errors;
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const text = await parsePDF(buffer);
        detectedCurrency = detectCurrency(text);
        const result = await parsePDFText(text, userId, categoryMap);
        transactions = result.transactions;
        errors = result.errors;
      }

      if (transactions.length > 0) {
        const created = await prisma.transaction.createMany({
          data: transactions.map((t) => ({
            ...t,
            userId,
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
