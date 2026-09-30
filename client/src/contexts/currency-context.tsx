import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

export type Currency = "USD" | "EUR" | "GBP" | "AUD" | "INR" | "BRL";

export type CurrencyOption = {
  code: Currency;
  symbol: string;
  label: string;
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "USD", symbol: "$", label: "USD — US Dollar" },
  { code: "EUR", symbol: "€", label: "EUR — Euro" },
  { code: "GBP", symbol: "£", label: "GBP — British Pound" },
  { code: "AUD", symbol: "A$", label: "AUD — Australian Dollar" },
  { code: "INR", symbol: "₹", label: "INR — Indian Rupee" },
  { code: "BRL", symbol: "R$", label: "BRL — Brazilian Real" },
];

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  currencySymbol: string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = "h2h_currency";

function detectInitialCurrency(): Currency {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Currency | null;
    if (stored && CURRENCY_OPTIONS.some((o) => o.code === stored)) return stored;
  } catch {}
  return "USD";
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(detectInitialCurrency);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch {}
  }, [currency]);

  function setCurrency(c: Currency) {
    setCurrencyState(c);
  }

  const currencySymbol =
    CURRENCY_OPTIONS.find((o) => o.code === currency)?.symbol ?? "$";

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencySymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
