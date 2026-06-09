import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/currency";

export function useCurrency() {
  const [currency, setCurrency] = useState("IDR");

  useEffect(() => {
    async function fetchCurrency() {
      try {
        const res = await fetch("/api/user/currency");
        if (res.ok) {
          const data = await res.json();
          setCurrency(data.currency || "IDR");
        }
      } catch (error) {
        console.error("Failed to fetch currency:", error);
      }
    }
    fetchCurrency();
  }, []);

  const format = (amount: number) => formatCurrency(amount, currency);

  return { currency, format };
}
