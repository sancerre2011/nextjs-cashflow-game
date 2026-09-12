"use client";

import {
  Building2,
  CircleDollarSign,
  Landmark,
  LayoutDashboard,
  Menu,
  Plus,
  Scale,
  TrendingDown,
  UserCircle2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "income", label: "Income", icon: CircleDollarSign },
  { id: "expenses", label: "Expenses", icon: TrendingDown },
  { id: "assets", label: "Assets", icon: Landmark },
  { id: "liabilities", label: "Liabilities", icon: Building2 },
  { id: "account", label: "Account", icon: UserCircle2 },
] as const;

type TabId = (typeof tabs)[number]["id"];

type ExpenseKey =
  | "taxes"
  | "mortgageRent"
  | "studentLoan"
  | "carLoan"
  | "creditCard"
  | "others"
  | "bankLoan";

type ChildCount = "0" | "1" | "2" | "3";

type LiabilityKey =
  | "homeMortgage"
  | "studentLoan"
  | "carLoan"
  | "creditCardLoan"
  | "bankLoan";

type PreciousMetalEntry = {
  id: string;
  name: string;
  pieces: string;
  pricePerPiece: string;
  value: string;
};

type FundEntry = {
  id: string;
  name: string;
  shares: string;
  costPerShare: string;
  value: string;
  cashFlow: string;
};

type RealEstateAssetEntry = {
  id: string;
  name: string;
  downPayment: string;
  cost: string;
  cashFlow: string;
};

type IncomeEntry = {
  id: string;
  name: string;
  amount: string;
};

type TransactionEntry = {
  id: string;
  type: "earn" | "spend";
  amount: number;
  label: string;
  createdAt: number;
};

type BusinessEntry = {
  id: string;
  name: string;
  cashFlow: string;
};

type AvatarPreset = {
  id: string;
  name: string;
  salary: string;
  expenses: Record<ExpenseKey, string>;
  liabilities: Record<LiabilityKey, string>;
  childCount: ChildCount;
  childCost: string;
  savings: string;
  initialBalance: number;
};

const fixedExpenses: { key: ExpenseKey; label: string }[] = [
  { key: "taxes", label: "Taxes" },
  { key: "mortgageRent", label: "Home mortgage / Rent" },
  { key: "studentLoan", label: "Student Loan" },
  { key: "carLoan", label: "Car Loan" },
  { key: "creditCard", label: "Credit Card" },
  { key: "others", label: "Others" },
  { key: "bankLoan", label: "Bank Loan: (10% of Total Bank Loan)" },
];

const fixedLiabilities: { key: LiabilityKey; label: string }[] = [
  { key: "homeMortgage", label: "Home Mortgage" },
  { key: "studentLoan", label: "Student Loan" },
  { key: "carLoan", label: "Car Loan" },
  { key: "creditCardLoan", label: "Credit Card Loan" },
  { key: "bankLoan", label: "Bank Loan" },
];

const liabilityExpenseMapping: Partial<Record<LiabilityKey, ExpenseKey>> = {
  homeMortgage: "mortgageRent",
  studentLoan: "studentLoan",
  carLoan: "carLoan",
  creditCardLoan: "creditCard",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const initialExpenseValues: Record<ExpenseKey, string> = {
  taxes: "",
  mortgageRent: "",
  studentLoan: "",
  carLoan: "",
  creditCard: "",
  others: "",
  bankLoan: "",
};

const initialLiabilityValues: Record<LiabilityKey, string> = {
  homeMortgage: "",
  studentLoan: "",
  carLoan: "",
  creditCardLoan: "",
  bankLoan: "",
};

const avatarPresets: AvatarPreset[] = [
  {
    id: "attorney",
    name: "Attorney",
    salary: "7500",
    expenses: {
      taxes: "1800",
      mortgageRent: "1100",
      studentLoan: "300",
      carLoan: "200",
      creditCard: "200",
      others: "1500",
      bankLoan: "",
    },
    liabilities: {
      homeMortgage: "115000",
      studentLoan: "78000",
      carLoan: "11000",
      creditCardLoan: "7000",
      bankLoan: "",
    },
    childCount: "0",
    childCost: "400",
    savings: "2000",
    initialBalance: 2000,
  },
];

const STORAGE_KEY = "cashflow-game-state-v1";

const getDefaultGameState = () => ({
  selectedAvatarId: null as string | null,
  activeTab: "dashboard" as TabId,
  savings: "",
  salary: "",
  expenseValues: initialExpenseValues,
  childCount: "0" as ChildCount,
  childCost: "0",
  liabilityValues: initialLiabilityValues,
  preciousMetals: [] as PreciousMetalEntry[],
  funds: [] as FundEntry[],
  fundIncomeEntries: [] as IncomeEntry[],
  realEstateIncomeEntries: [] as IncomeEntry[],
  realEstateAssets: [] as RealEstateAssetEntry[],
  accountBalance: 0,
  transactions: [] as TransactionEntry[],
  isRatraceMode: false,
  businessEntries: [] as BusinessEntry[],
});

const readStoredGameState = () => {
  if (typeof window === "undefined") {
    return getDefaultGameState();
  }

  try {
    const storedState = window.localStorage.getItem(STORAGE_KEY);
    if (!storedState) {
      return getDefaultGameState();
    }

    const parsed = JSON.parse(storedState) as Partial<ReturnType<typeof getDefaultGameState>>;
    return {
      ...getDefaultGameState(),
      ...parsed,
      expenseValues: { ...initialExpenseValues, ...(parsed.expenseValues ?? {}) },
      liabilityValues: { ...initialLiabilityValues, ...(parsed.liabilityValues ?? {}) },
      childCount: parsed.childCount ?? "0",
      activeTab: parsed.activeTab ?? "dashboard",
    };
  } catch {
    return getDefaultGameState();
  }
};

const parseNumericValue = (value: string) => {
  if (value === "") return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isMultipleOfThousand = (value: number) => Number.isInteger(value) && value % 1000 === 0;

const createEntryId = () => Math.random().toString(36).slice(2, 10);

const getAvatarIcon = (avatarId: string): LucideIcon => {
  if (avatarId === "attorney") return Scale;
  return UserCircle2;
};

const getTotalExpenses = (
  expenseValues: Record<ExpenseKey, string>,
  childCount: ChildCount,
  childCost: string
) => {
  const fixedTotal = fixedExpenses.reduce((sum, expense) => {
    return sum + parseNumericValue(expenseValues[expense.key]);
  }, 0);

  return fixedTotal + (Number.parseInt(childCount, 10) || 0) * parseNumericValue(childCost);
};

function ExpenseSection({
  expenseValues,
  setExpenseValues,
  childCount,
  setChildCount,
  childCost,
  setChildCost,
  totalExpenses,
}: {
  expenseValues: Record<ExpenseKey, string>;
  setExpenseValues: Dispatch<SetStateAction<Record<ExpenseKey, string>>>;
  childCount: ChildCount;
  setChildCount: Dispatch<SetStateAction<ChildCount>>;
  childCost: string;
  setChildCost: Dispatch<SetStateAction<string>>;
  totalExpenses: number;
}) {

  const childTotal = useMemo(() => {
    const count = Number.parseInt(childCount, 10) || 0;
    const cost = Number.parseFloat(childCost) || 0;
    return count * cost;
  }, [childCost, childCount]);

  const updateExpenseValue = (key: ExpenseKey, value: string) => {
    setExpenseValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Total monthly expenses
        </div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {currencyFormatter.format(totalExpenses)}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        {fixedExpenses.map((expense) => (
          <div
            key={expense.key}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2.5"
          >
            <label htmlFor={expense.key} className="flex-1 text-sm font-medium text-foreground">
              {expense.label}
            </label>
            <div className="flex w-[120px] items-center justify-end">
              <Input
                id={expense.key}
                type="number"
                inputMode="decimal"
                min="0"
                step="100"
                value={expenseValues[expense.key]}
                onChange={(event) => updateExpenseValue(expense.key, event.target.value)}
                placeholder="0"
                className="h-9 rounded-lg text-right text-sm"
              />
            </div>
          </div>
        ))}

        <div className="rounded-xl border border-border bg-muted/50 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 text-sm font-medium text-foreground">Child expenses</div>
            <div className="text-sm font-semibold text-foreground">{currencyFormatter.format(childTotal)}</div>
          </div>

          <div className="mt-3 grid grid-cols-[1fr_40px_1fr] items-end gap-2">
            <div>
              <Label
                htmlFor="child-count"
                className="mb-1 block text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
              >
                Children
              </Label>
              <select
                id="child-count"
                value={childCount}
                onChange={(event) => setChildCount(event.target.value as ChildCount)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground shadow-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>

            <div className="pb-2 text-center text-base font-semibold text-muted-foreground">x</div>

            <div>
              <Label
                htmlFor="child-cost"
                className="mb-1 block text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
              >
                Cost
              </Label>
              <Input
                id="child-cost"
                type="number"
                inputMode="decimal"
                min="0"
                step="50"
                value={childCost}
                onChange={(event) => setChildCost(event.target.value)}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetSection({
  accountBalance,
  savings,
  setSavings,
  preciousMetals,
  setPreciousMetals,
  funds,
  setFunds,
  realEstateAssets,
  setRealEstateAssets,
  setFundIncomeEntries,
  setRealEstateIncomeEntries,
  onAssetPurchase,
  onAssetSale,
}: {
  accountBalance: number;
  savings: string;
  setSavings: Dispatch<SetStateAction<string>>;
  preciousMetals: PreciousMetalEntry[];
  setPreciousMetals: Dispatch<SetStateAction<PreciousMetalEntry[]>>;
  funds: FundEntry[];
  setFunds: Dispatch<SetStateAction<FundEntry[]>>;
  realEstateAssets: RealEstateAssetEntry[];
  setRealEstateAssets: Dispatch<SetStateAction<RealEstateAssetEntry[]>>;
  setFundIncomeEntries: Dispatch<SetStateAction<IncomeEntry[]>>;
  setRealEstateIncomeEntries: Dispatch<SetStateAction<IncomeEntry[]>>;
  onAssetPurchase: (amount: number, label: string) => boolean;
  onAssetSale: (amount: number, label: string) => void;
}) {
  const [preciousMetalOpen, setPreciousMetalOpen] = useState(false);
  const [preciousSellOpen, setPreciousSellOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [fundSellOpen, setFundSellOpen] = useState(false);
  const [realEstateOpen, setRealEstateOpen] = useState(false);
  const [realEstateSellOpen, setRealEstateSellOpen] = useState(false);
  const [preciousBuyError, setPreciousBuyError] = useState("");
  const [preciousSellError, setPreciousSellError] = useState("");
  const [fundBuyError, setFundBuyError] = useState("");
  const [fundSellError, setFundSellError] = useState("");
  const [realEstateBuyError, setRealEstateBuyError] = useState("");
  const [realEstateSellError, setRealEstateSellError] = useState("");
  const [sellingPreciousId, setSellingPreciousId] = useState("");
  const [sellPreciousPieces, setSellPreciousPieces] = useState("");
  const [sellPreciousPricePerPiece, setSellPreciousPricePerPiece] = useState("");
  const [sellingFundId, setSellingFundId] = useState("");
  const [sellFundShares, setSellFundShares] = useState("");
  const [sellFundPricePerShare, setSellFundPricePerShare] = useState("");
  const [sellingRealEstateId, setSellingRealEstateId] = useState("");
  const [sellRealEstatePrice, setSellRealEstatePrice] = useState("");
  const sellPreciousValue = useMemo(
    () => parseNumericValue(sellPreciousPieces) * parseNumericValue(sellPreciousPricePerPiece),
    [sellPreciousPieces, sellPreciousPricePerPiece]
  );
  const sellFundValue = useMemo(
    () => parseNumericValue(sellFundShares) * parseNumericValue(sellFundPricePerShare),
    [sellFundShares, sellFundPricePerShare]
  );
  const selectedRealEstateForSale = useMemo(
    () => realEstateAssets.find((entry) => entry.id === sellingRealEstateId) ?? null,
    [realEstateAssets, sellingRealEstateId]
  );
  const selectedRealEstateLiability = useMemo(() => {
    if (!selectedRealEstateForSale) return 0;
    return Math.max(
      parseNumericValue(selectedRealEstateForSale.cost) - parseNumericValue(selectedRealEstateForSale.downPayment),
      0
    );
  }, [selectedRealEstateForSale]);
  const sellRealEstateCredit = useMemo(
    () => parseNumericValue(sellRealEstatePrice) - selectedRealEstateLiability,
    [sellRealEstatePrice, selectedRealEstateLiability]
  );
  const [preciousDraft, setPreciousDraft] = useState<PreciousMetalEntry>({
    id: "",
    name: "",
    pieces: "",
    pricePerPiece: "",
    value: "",
  });

  const [fundDraft, setFundDraft] = useState<FundEntry>({
    id: "",
    name: "",
    shares: "",
    costPerShare: "",
    value: "",
    cashFlow: "",
  });

  const [realEstateDraft, setRealEstateDraft] = useState<RealEstateAssetEntry>({
    id: "",
    name: "",
    downPayment: "",
    cost: "",
    cashFlow: "",
  });
  const preciousPurchaseAmount = useMemo(() => parseNumericValue(preciousDraft.value), [preciousDraft.value]);
  const fundPurchaseAmount = useMemo(() => parseNumericValue(fundDraft.value), [fundDraft.value]);
  const realEstatePurchaseAmount = useMemo(
    () => parseNumericValue(realEstateDraft.downPayment),
    [realEstateDraft.downPayment]
  );

  const updatePreciousDraft = (field: keyof PreciousMetalEntry, value: string) => {
    setPreciousDraft((current) => {
      const next = { ...current, [field]: value } as PreciousMetalEntry;
      const pieces = parseNumericValue(next.pieces);
      const pricePerPiece = parseNumericValue(next.pricePerPiece);
      const itemValue = parseNumericValue(next.value);

      if (field === "pieces" || field === "pricePerPiece") {
        next.value = pieces > 0 && pricePerPiece > 0 ? String(pieces * pricePerPiece) : "";
      }

      if (field === "value") {
        next.pricePerPiece = pieces > 0 && value !== "" ? String(itemValue / pieces) : "";
      }

      return next;
    });
  };

  const savePreciousMetal = () => {
    const trimmedName = preciousDraft.name.trim();
    if (!trimmedName) return;

    const purchaseAmount = parseNumericValue(preciousDraft.value);
    if (purchaseAmount <= 0) {
      setPreciousBuyError("Enter a valid value.");
      return;
    }

    if (!onAssetPurchase(purchaseAmount, `Buy precious metal: ${trimmedName}`)) {
      setPreciousBuyError("Not enough balance.");
      return;
    }

    setPreciousMetals((current) => [
      ...current,
      {
        ...preciousDraft,
        id: createEntryId(),
        name: trimmedName,
      },
    ]);
    setPreciousDraft({ id: "", name: "", pieces: "", pricePerPiece: "", value: "" });
    setPreciousBuyError("");
    setPreciousMetalOpen(false);
  };

  const openSellPreciousMetal = (entry: PreciousMetalEntry) => {
    setSellingPreciousId(entry.id);
    setSellPreciousPieces("");
    setSellPreciousPricePerPiece(entry.pricePerPiece || "");
    setPreciousSellError("");
    setPreciousSellOpen(true);
  };

  const confirmSellPreciousMetal = () => {
    const selected = preciousMetals.find((entry) => entry.id === sellingPreciousId);
    if (!selected) {
      setPreciousSellError("Selected entry is no longer available.");
      return;
    }

    const piecesToSell = parseNumericValue(sellPreciousPieces);
    const sellPricePerPiece = parseNumericValue(sellPreciousPricePerPiece);
    const currentPieces = parseNumericValue(selected.pieces);

    if (piecesToSell <= 0) {
      setPreciousSellError("Enter a valid number of pieces.");
      return;
    }

    if (sellPricePerPiece <= 0) {
      setPreciousSellError("Enter a valid price per piece.");
      return;
    }

    if (piecesToSell > currentPieces) {
      setPreciousSellError("Cannot sell more pieces than you own.");
      return;
    }

    const saleAmount = piecesToSell * sellPricePerPiece;
    const remainingPieces = currentPieces - piecesToSell;

    setPreciousMetals((current) =>
      current
        .map((entry) => {
          if (entry.id !== selected.id) return entry;

          if (remainingPieces <= 0) {
            return null;
          }

          const carryingPricePerPiece = parseNumericValue(entry.pricePerPiece);
          return {
            ...entry,
            pieces: String(remainingPieces),
            value: String(remainingPieces * carryingPricePerPiece),
          };
        })
        .filter((entry): entry is PreciousMetalEntry => entry !== null)
    );

    onAssetSale(saleAmount, `Sell precious metal: ${selected.name || "Unnamed"}`);
    setSellingPreciousId("");
    setSellPreciousPieces("");
    setSellPreciousPricePerPiece("");
    setPreciousSellError("");
    setPreciousSellOpen(false);
  };

  const updateFundDraft = (field: keyof FundEntry, value: string) => {
    setFundDraft((current) => {
      const next = { ...current, [field]: value } as FundEntry;
      const shares = parseNumericValue(next.shares);
      const costPerShare = parseNumericValue(next.costPerShare);

      if (field === "shares" || field === "costPerShare") {
        next.value = shares > 0 && costPerShare > 0 ? String(shares * costPerShare) : "";
      }

      return next;
    });
  };

  const saveFundEntry = () => {
    const trimmedName = fundDraft.name.trim();
    if (!trimmedName) return;

    const purchaseAmount = parseNumericValue(fundDraft.value);
    if (purchaseAmount <= 0) {
      setFundBuyError("Enter a valid value.");
      return;
    }

    if (!onAssetPurchase(purchaseAmount, `Buy shares/funds/CDs: ${trimmedName}`)) {
      setFundBuyError("Not enough balance.");
      return;
    }

    setFunds((current) => {
      const existing = current.find((entry) => entry.name.trim().toLowerCase() === trimmedName.toLowerCase());
      if (!existing) {
        return [
          ...current,
          {
            ...fundDraft,
            id: createEntryId(),
            name: trimmedName,
            cashFlow: fundDraft.cashFlow,
          },
        ];
      }

      const existingShares = parseNumericValue(existing.shares);
      const existingCost = parseNumericValue(existing.costPerShare) * existingShares;
      const nextShares = parseNumericValue(fundDraft.shares);
      const nextCost = parseNumericValue(fundDraft.costPerShare) * nextShares;
      const totalShares = existingShares + nextShares;
      const totalCost = existingCost + nextCost;
      const mixedCost = totalShares > 0 ? totalCost / totalShares : 0;

      return current.map((entry) =>
        entry.id === existing.id
          ? {
              ...entry,
              name: trimmedName,
              shares: String(totalShares),
              costPerShare: String(mixedCost),
              value: String(totalShares * mixedCost),
              cashFlow: String(parseNumericValue(entry.cashFlow) + parseNumericValue(fundDraft.cashFlow)),
            }
          : entry
      );
    });

    setFundIncomeEntries((current) => {
      const trimmedAmount = fundDraft.cashFlow.trim();
      const currentAmount = parseNumericValue(trimmedAmount);
      const existing = current.find((entry) => entry.name.trim().toLowerCase() === trimmedName.toLowerCase());

      if (!trimmedAmount || currentAmount <= 0) {
        return current;
      }

      if (!existing) {
        return [...current, { id: createEntryId(), name: trimmedName, amount: trimmedAmount }];
      }

      return current.map((entry) =>
        entry.id === existing.id
          ? { ...entry, amount: String(parseNumericValue(entry.amount) + currentAmount) }
          : entry
      );
    });

    setFundDraft({ id: "", name: "", shares: "", costPerShare: "", value: "", cashFlow: "" });
    setFundBuyError("");
    setFundOpen(false);
  };

  const openSellFundEntry = (entry: FundEntry) => {
    setSellingFundId(entry.id);
    setSellFundShares("");
    setSellFundPricePerShare(entry.costPerShare || "");
    setFundSellError("");
    setFundSellOpen(true);
  };

  const confirmSellFundEntry = () => {
    const selected = funds.find((entry) => entry.id === sellingFundId);
    if (!selected) {
      setFundSellError("Selected entry is no longer available.");
      return;
    }

    const sharesToSell = parseNumericValue(sellFundShares);
    const sellPricePerShare = parseNumericValue(sellFundPricePerShare);
    const currentShares = parseNumericValue(selected.shares);

    if (sharesToSell <= 0) {
      setFundSellError("Enter a valid number of shares.");
      return;
    }

    if (sellPricePerShare <= 0) {
      setFundSellError("Enter a valid price per share.");
      return;
    }

    if (sharesToSell > currentShares) {
      setFundSellError("Cannot sell more shares than you own.");
      return;
    }

    const saleAmount = sharesToSell * sellPricePerShare;
    const remainingShares = currentShares - sharesToSell;
    const trimmedName = selected.name.trim();

    setFunds((current) =>
      current
        .map((entry) => {
          if (entry.id !== selected.id) return entry;
          if (remainingShares <= 0) return null;

          const carryingCostPerShare = parseNumericValue(entry.costPerShare);
          const currentCashFlow = parseNumericValue(entry.cashFlow);
          const nextCashFlow = currentShares > 0 ? (currentCashFlow * remainingShares) / currentShares : 0;

          return {
            ...entry,
            shares: String(remainingShares),
            value: String(remainingShares * carryingCostPerShare),
            cashFlow: String(nextCashFlow),
          };
        })
        .filter((entry): entry is FundEntry => entry !== null)
    );

    if (trimmedName) {
      if (remainingShares <= 0) {
        setFundIncomeEntries((current) =>
          current.filter((entry) => entry.name.trim().toLowerCase() !== trimmedName.toLowerCase())
        );
      } else {
        const updatedCashFlow = currentShares > 0
          ? (parseNumericValue(selected.cashFlow) * remainingShares) / currentShares
          : 0;

        setFundIncomeEntries((current) =>
          current.map((entry) =>
            entry.name.trim().toLowerCase() === trimmedName.toLowerCase()
              ? { ...entry, amount: String(updatedCashFlow) }
              : entry
          )
        );
      }
    }

    onAssetSale(saleAmount, `Sell shares/funds/CDs: ${selected.name || "Unnamed"}`);
    setSellingFundId("");
    setSellFundShares("");
    setSellFundPricePerShare("");
    setFundSellError("");
    setFundSellOpen(false);
  };

  const updateRealEstateDraft = (field: keyof RealEstateAssetEntry, value: string) => {
    setRealEstateDraft((current) => ({ ...current, [field]: value }));
  };

  const saveRealEstateAsset = () => {
    if (!realEstateDraft.name.trim()) return;

    const trimmedName = realEstateDraft.name.trim();
    const purchaseAmount = parseNumericValue(realEstateDraft.downPayment);
    if (purchaseAmount <= 0) {
      setRealEstateBuyError("Enter a valid down payment.");
      return;
    }

    if (!onAssetPurchase(purchaseAmount, `Buy real estate/business: ${trimmedName}`)) {
      setRealEstateBuyError("Not enough balance.");
      return;
    }

    setRealEstateAssets((current) => [
      ...current,
      {
        ...realEstateDraft,
        id: createEntryId(),
        name: trimmedName,
      },
    ]);

    if (realEstateDraft.cashFlow.trim()) {
      setRealEstateIncomeEntries((current) => {
        const existing = current.find((entry) => entry.name.trim().toLowerCase() === trimmedName.toLowerCase());
        if (!existing) {
          return [...current, { id: createEntryId(), name: trimmedName, amount: realEstateDraft.cashFlow }];
        }

        return current.map((entry) =>
          entry.id === existing.id
            ? { ...entry, amount: String(parseNumericValue(entry.amount) + parseNumericValue(realEstateDraft.cashFlow)) }
            : entry
        );
      });
    }

    setRealEstateDraft({ id: "", name: "", downPayment: "", cost: "", cashFlow: "" });
    setRealEstateBuyError("");
    setRealEstateOpen(false);
  };

  const removeRealEstateAsset = (id: string) => {
    const selected = realEstateAssets.find((entry) => entry.id === id);
    setRealEstateAssets((current) => current.filter((entry) => entry.id !== id));

    if (selected) {
      const trimmedName = selected.name.trim();
      if (trimmedName) {
        setRealEstateIncomeEntries((current) =>
          current.filter((entry) => entry.name.trim().toLowerCase() !== trimmedName.toLowerCase())
        );
      }
    }
  };

  const openSellRealEstateAsset = (entry: RealEstateAssetEntry) => {
    setSellingRealEstateId(entry.id);
    setSellRealEstatePrice("");
    setRealEstateSellError("");
    setRealEstateSellOpen(true);
  };

  const confirmSellRealEstateAsset = () => {
    if (!selectedRealEstateForSale) {
      setRealEstateSellError("Selected entry is no longer available.");
      return;
    }

    const sellPrice = parseNumericValue(sellRealEstatePrice);
    if (sellPrice <= 0) {
      setRealEstateSellError("Enter a valid sell price.");
      return;
    }

    const creditAmount = sellPrice - selectedRealEstateLiability;
    if (creditAmount < 0) {
      setRealEstateSellError("Sell price must be at least the liability amount.");
      return;
    }

    removeRealEstateAsset(selectedRealEstateForSale.id);
    if (creditAmount > 0) {
      onAssetSale(creditAmount, `Sell real estate/business: ${selectedRealEstateForSale.name || "Unnamed"}`);
    }

    setSellingRealEstateId("");
    setSellRealEstatePrice("");
    setRealEstateSellError("");
    setRealEstateSellOpen(false);
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-[1.5rem]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Savings</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3 pt-0">
          <Label htmlFor="savings" className="text-sm font-medium text-foreground">
            Savings
          </Label>
          <Input
            id="savings"
            type="number"
            inputMode="decimal"
            min="0"
            step="100"
            value={savings}
            onChange={(event) => setSavings(event.target.value)}
            placeholder="0"
            className="h-9 w-[160px] text-right"
          />
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Precious Metals etc.</CardTitle>
          <Dialog
            open={preciousMetalOpen}
            onOpenChange={(open) => {
              setPreciousMetalOpen(open);
              if (!open) setPreciousBuyError("");
            }}
          >
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Buy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add precious metal</DialogTitle>
                <DialogDescription>Record a purchase and calculate the total value.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="precious-name">Name</Label>
                  <Input
                    id="precious-name"
                    value={preciousDraft.name}
                    onChange={(event) => updatePreciousDraft("name", event.target.value)}
                    placeholder="Gold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="precious-pieces">Pieces</Label>
                    <Input
                      id="precious-pieces"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="1"
                      value={preciousDraft.pieces}
                      onChange={(event) => updatePreciousDraft("pieces", event.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="precious-price">Price / piece</Label>
                    <Input
                      id="precious-price"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={preciousDraft.pricePerPiece}
                      onChange={(event) => updatePreciousDraft("pricePerPiece", event.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="precious-value">Value</Label>
                  <Input
                    id="precious-value"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={preciousDraft.value}
                    onChange={(event) => updatePreciousDraft("value", event.target.value)}
                    placeholder="0"
                  />
                </div>
                {preciousBuyError ? <p className="text-sm text-destructive">{preciousBuyError}</p> : null}
                {!preciousBuyError && preciousPurchaseAmount > accountBalance ? (
                  <p className="text-sm text-destructive">Not enough balance.</p>
                ) : null}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setPreciousMetalOpen(false);
                    setPreciousBuyError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={savePreciousMetal}
                  disabled={!preciousDraft.name.trim() || preciousPurchaseAmount <= 0 || preciousPurchaseAmount > accountBalance}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {preciousMetals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
              No entries yet.
            </div>
          ) : (
            preciousMetals.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">{entry.name || "Unnamed"}</div>
                  <div className="text-xs text-muted-foreground">
                    {entry.pieces || "0"} pcs · {currencyFormatter.format(parseNumericValue(entry.pricePerPiece || "0"))} / piece
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-foreground">
                    {currencyFormatter.format(parseNumericValue(entry.value || "0"))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => openSellPreciousMetal(entry)}>
                    Sell
                  </Button>
                </div>
              </div>
            ))
          )}

          <Dialog
            open={preciousSellOpen}
            onOpenChange={(open) => {
              setPreciousSellOpen(open);
              if (!open) {
                setPreciousSellError("");
                setSellingPreciousId("");
                setSellPreciousPieces("");
                setSellPreciousPricePerPiece("");
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sell precious metal</DialogTitle>
                <DialogDescription>Enter number of pieces and price per piece.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="sell-precious-pieces">Pieces</Label>
                  <Input
                    id="sell-precious-pieces"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    value={sellPreciousPieces}
                    onChange={(event) => {
                      setSellPreciousPieces(event.target.value);
                      if (preciousSellError) setPreciousSellError("");
                    }}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sell-precious-price">Price / piece</Label>
                  <Input
                    id="sell-precious-price"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={sellPreciousPricePerPiece}
                    onChange={(event) => {
                      setSellPreciousPricePerPiece(event.target.value);
                      if (preciousSellError) setPreciousSellError("");
                    }}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sell-precious-value">Sell value</Label>
                  <Input id="sell-precious-value" value={currencyFormatter.format(sellPreciousValue)} readOnly />
                </div>

                {preciousSellError ? <p className="text-sm text-destructive">{preciousSellError}</p> : null}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setPreciousSellOpen(false);
                    setPreciousSellError("");
                    setSellingPreciousId("");
                    setSellPreciousPieces("");
                    setSellPreciousPricePerPiece("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={confirmSellPreciousMetal}>
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Shares / Funds / CDs</CardTitle>
          <Dialog
            open={fundOpen}
            onOpenChange={(open) => {
              setFundOpen(open);
              if (!open) setFundBuyError("");
            }}
          >
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Buy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add fund</DialogTitle>
                <DialogDescription>Add a new fund or merge it into an existing one with the same name.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fund-name">Name</Label>
                  <Input
                    id="fund-name"
                    value={fundDraft.name}
                    onChange={(event) => updateFundDraft("name", event.target.value)}
                    placeholder="Index Fund"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="fund-shares">Shares</Label>
                    <Input
                      id="fund-shares"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="1"
                      value={fundDraft.shares}
                      onChange={(event) => updateFundDraft("shares", event.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fund-cost">Cost / share</Label>
                    <Input
                      id="fund-cost"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={fundDraft.costPerShare}
                      onChange={(event) => updateFundDraft("costPerShare", event.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fund-cashflow">Cashflow amount</Label>
                  <Input
                    id="fund-cashflow"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    value={fundDraft.cashFlow}
                    onChange={(event) => updateFundDraft("cashFlow", event.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fund-value">Value</Label>
                  <Input
                    id="fund-value"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={fundDraft.value}
                    readOnly
                  />
                </div>
                {fundBuyError ? <p className="text-sm text-destructive">{fundBuyError}</p> : null}
                {!fundBuyError && fundPurchaseAmount > accountBalance ? (
                  <p className="text-sm text-destructive">Not enough balance.</p>
                ) : null}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setFundOpen(false);
                    setFundBuyError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={saveFundEntry}
                  disabled={!fundDraft.name.trim() || fundPurchaseAmount <= 0 || fundPurchaseAmount > accountBalance}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {funds.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
              No entries yet.
            </div>
          ) : (
            funds.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">{entry.name || "Unnamed"}</div>
                  <div className="text-xs text-muted-foreground">
                    {entry.shares || "0"} shares · {currencyFormatter.format(parseNumericValue(entry.costPerShare || "0"))} / share
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-foreground">
                    {currencyFormatter.format(parseNumericValue(entry.value || "0"))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => openSellFundEntry(entry)}>
                    Sell
                  </Button>
                </div>
              </div>
            ))
          )}

          <Dialog
            open={fundSellOpen}
            onOpenChange={(open) => {
              setFundSellOpen(open);
              if (!open) {
                setFundSellError("");
                setSellingFundId("");
                setSellFundShares("");
                setSellFundPricePerShare("");
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sell shares/funds/CDs</DialogTitle>
                <DialogDescription>Enter number of shares and price per share.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="sell-fund-shares">Shares</Label>
                  <Input
                    id="sell-fund-shares"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    value={sellFundShares}
                    onChange={(event) => {
                      setSellFundShares(event.target.value);
                      if (fundSellError) setFundSellError("");
                    }}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sell-fund-price">Price / share</Label>
                  <Input
                    id="sell-fund-price"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={sellFundPricePerShare}
                    onChange={(event) => {
                      setSellFundPricePerShare(event.target.value);
                      if (fundSellError) setFundSellError("");
                    }}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sell-fund-value">Sell value</Label>
                  <Input id="sell-fund-value" value={currencyFormatter.format(sellFundValue)} readOnly />
                </div>

                {fundSellError ? <p className="text-sm text-destructive">{fundSellError}</p> : null}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setFundSellOpen(false);
                    setFundSellError("");
                    setSellingFundId("");
                    setSellFundShares("");
                    setSellFundPricePerShare("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={confirmSellFundEntry}>
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Real Estate / Business</CardTitle>
          <Dialog
            open={realEstateOpen}
            onOpenChange={(open) => {
              setRealEstateOpen(open);
              if (!open) setRealEstateBuyError("");
            }}
          >
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Buy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add real estate or business asset</DialogTitle>
                <DialogDescription>Record the property name, down payment, and total costs.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="real-estate-name">Name</Label>
                  <Input
                    id="real-estate-name"
                    value={realEstateDraft.name}
                    onChange={(event) => updateRealEstateDraft("name", event.target.value)}
                    placeholder="Asset name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="real-estate-down">Down payment</Label>
                    <Input
                      id="real-estate-down"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="100"
                      value={realEstateDraft.downPayment}
                      onChange={(event) => updateRealEstateDraft("downPayment", event.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="real-estate-cost">Costs</Label>
                    <Input
                      id="real-estate-cost"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="100"
                      value={realEstateDraft.cost}
                      onChange={(event) => updateRealEstateDraft("cost", event.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="real-estate-cashflow">Cashflow amount</Label>
                  <Input
                    id="real-estate-cashflow"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    value={realEstateDraft.cashFlow}
                    onChange={(event) => updateRealEstateDraft("cashFlow", event.target.value)}
                    placeholder="0"
                  />
                </div>
                {realEstateBuyError ? <p className="text-sm text-destructive">{realEstateBuyError}</p> : null}
                {!realEstateBuyError && realEstatePurchaseAmount > accountBalance ? (
                  <p className="text-sm text-destructive">Not enough balance.</p>
                ) : null}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setRealEstateOpen(false);
                    setRealEstateBuyError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={saveRealEstateAsset}
                  disabled={
                    !realEstateDraft.name.trim()
                    || realEstatePurchaseAmount <= 0
                    || realEstatePurchaseAmount > accountBalance
                  }
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {realEstateAssets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
              No entries yet.
            </div>
          ) : (
            realEstateAssets.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">{entry.name || "Unnamed"}</div>
                  <div className="text-xs text-muted-foreground">
                    DP {currencyFormatter.format(parseNumericValue(entry.downPayment || "0"))} · Costs {currencyFormatter.format(parseNumericValue(entry.cost || "0"))}
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => openSellRealEstateAsset(entry)}>
                  Sell
                </Button>
              </div>
            ))
          )}

          <Dialog
            open={realEstateSellOpen}
            onOpenChange={(open) => {
              setRealEstateSellOpen(open);
              if (!open) {
                setRealEstateSellError("");
                setSellingRealEstateId("");
                setSellRealEstatePrice("");
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sell real estate/business</DialogTitle>
                <DialogDescription>Enter the sell price for this asset.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="sell-real-estate-price">Sell price</Label>
                  <Input
                    id="sell-real-estate-price"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    value={sellRealEstatePrice}
                    onChange={(event) => {
                      setSellRealEstatePrice(event.target.value);
                      if (realEstateSellError) setRealEstateSellError("");
                    }}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sell-real-estate-liability">Liability amount</Label>
                  <Input id="sell-real-estate-liability" value={currencyFormatter.format(selectedRealEstateLiability)} readOnly />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sell-real-estate-credit">Credit to balance</Label>
                  <Input id="sell-real-estate-credit" value={currencyFormatter.format(sellRealEstateCredit)} readOnly />
                </div>

                {realEstateSellError ? <p className="text-sm text-destructive">{realEstateSellError}</p> : null}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setRealEstateSellOpen(false);
                    setRealEstateSellError("");
                    setSellingRealEstateId("");
                    setSellRealEstatePrice("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={confirmSellRealEstateAsset}>
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

function IncomeSection({
  salary,
  setSalary,
  fundIncomeEntries,
  realEstateIncomeEntries,
}: {
  salary: string;
  setSalary: Dispatch<SetStateAction<string>>;
  fundIncomeEntries: IncomeEntry[];
  realEstateIncomeEntries: IncomeEntry[];
}) {
  return (
    <div className="space-y-4">
      <Card className="rounded-[1.5rem]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Salary</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3 pt-0">
          <Label htmlFor="salary" className="text-sm font-medium text-foreground">
            Salary
          </Label>
          <Input
            id="salary"
            type="number"
            inputMode="decimal"
            min="0"
            step="100"
            value={salary}
            onChange={(event) => setSalary(event.target.value)}
            placeholder="0"
            className="h-9 w-[160px] text-right"
          />
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Interest / Dividends</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {fundIncomeEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
              No entries yet.
            </div>
          ) : (
            fundIncomeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
                <div className="min-w-0 flex-1 text-sm font-medium text-foreground">{entry.name || "Unnamed"}</div>
                <div className="text-sm font-semibold text-foreground">
                  {currencyFormatter.format(parseNumericValue(entry.amount || "0"))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Real Estate / Business</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {realEstateIncomeEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
              No entries yet.
            </div>
          ) : (
            realEstateIncomeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
                <div className="min-w-0 flex-1 text-sm font-medium text-foreground">{entry.name || "Unnamed"}</div>
                <div className="text-sm font-semibold text-foreground">
                  {currencyFormatter.format(parseNumericValue(entry.amount || "0"))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSection({
  avatarName,
  AvatarIcon,
  salaryTotal,
  passiveIncomeTotal,
  incomeTotal,
  totalExpenses,
  netCashflow,
  onLeaveRatRace,
}: {
  avatarName: string;
  AvatarIcon: LucideIcon;
  salaryTotal: number;
  passiveIncomeTotal: number;
  incomeTotal: number;
  totalExpenses: number;
  netCashflow: number;
  onLeaveRatRace: () => void;
}) {
  const netCashflowClassName =
    netCashflow < 0
      ? "text-red-600 dark:text-red-400"
      : netCashflow === 0
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-green-600 dark:text-green-400";

  return (
    <Card className="overflow-hidden rounded-[1.75rem]">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-3 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
            <AvatarIcon className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Selected avatar
            </div>
            <div className="text-base font-semibold text-foreground">{avatarName}</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/50 px-3 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-muted-foreground">Salary</div>
            <div className="text-xl font-semibold tracking-tight text-foreground">
              {currencyFormatter.format(salaryTotal)}
            </div>
          </div>

          <div className="flex justify-end py-1">
            <div className="w-fit text-lg font-semibold text-muted-foreground">+</div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-muted-foreground">Passive income</div>
            <div className="text-xl font-semibold tracking-tight text-foreground">
              {currencyFormatter.format(passiveIncomeTotal)}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-muted-foreground">Total income</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-muted-foreground">=</span>
              <span className="text-xl font-semibold tracking-tight text-foreground">
                {currencyFormatter.format(incomeTotal)}
              </span>
            </div>
          </div>

          <div className="flex justify-end py-1">
            <div className="w-fit text-lg font-semibold text-muted-foreground">-</div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-muted-foreground">Total expenses</div>
            <div className="text-xl font-semibold tracking-tight text-foreground">
              {currencyFormatter.format(totalExpenses)}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-muted-foreground">Cashflow</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-muted-foreground">=</span>
              <span className={`text-xl font-semibold tracking-tight ${netCashflowClassName}`}>
                {currencyFormatter.format(netCashflow)}
              </span>
            </div>
          </div>
        </div>

        {passiveIncomeTotal <= totalExpenses ? (
          <div className="rounded-xl border border-border bg-muted/50 px-3 py-3 text-center text-sm font-medium text-foreground">
            You are in the rat race
          </div>
        ) : (
          <Button type="button" className="w-full" onClick={onLeaveRatRace}>
            Leave the ratrace
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function RatRaceDashboardSection({
  cashflowIncome,
  businesses,
  onBuyBusiness,
  targetCashflowIncome,
  differenceToTarget,
}: {
  cashflowIncome: number;
  businesses: BusinessEntry[];
  onBuyBusiness: (name: string, cashFlow: string) => void;
  targetCashflowIncome: number;
  differenceToTarget: number;
}) {
  const [businessName, setBusinessName] = useState("");
  const [businessCashFlow, setBusinessCashFlow] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleConfirm = () => {
    const trimmedName = businessName.trim();
    if (!trimmedName || businessCashFlow.trim() === "") return;

    onBuyBusiness(trimmedName, businessCashFlow);
    setBusinessName("");
    setBusinessCashFlow("");
    setDialogOpen(false);
  };

  return (
    <Card className="overflow-hidden rounded-[1.75rem]">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="rounded-xl border border-border bg-muted/50 px-3 py-4">
          <div className="text-sm font-medium text-muted-foreground">Cashflow income</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {currencyFormatter.format(cashflowIncome)}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/50 px-3 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-muted-foreground">Target cashflow income</span>
              <span className="text-sm font-semibold text-foreground">
                {currencyFormatter.format(targetCashflowIncome)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-muted-foreground">Difference to target</span>
              <span className="text-sm font-semibold text-foreground">
                {currencyFormatter.format(Math.abs(differenceToTarget))}
                {differenceToTarget < 0 ? " above target" : differenceToTarget > 0 ? " remaining" : " reached"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/50 px-3 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-foreground">Businesses</div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" size="sm">
                  Buy business
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buy business</DialogTitle>
                  <DialogDescription>Choose a business name and monthly cashflow.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Business name</Label>
                    <Input
                      id="business-name"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      placeholder="Coffee shop"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business-cashflow">Cashflow</Label>
                    <Input
                      id="business-cashflow"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="100"
                      value={businessCashFlow}
                      onChange={(event) => setBusinessCashFlow(event.target.value)}
                      placeholder="1500"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleConfirm} disabled={!businessName.trim() || businessCashFlow.trim() === ""}>
                    Buy
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {businesses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background/70 px-3 py-3 text-sm text-muted-foreground">
              No businesses yet.
            </div>
          ) : (
            <div className="space-y-2">
              {businesses.map((business) => (
                <div
                  key={business.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/70 px-3 py-2.5"
                >
                  <div className="flex-1 text-sm font-medium text-foreground">{business.name}</div>
                  <div className="text-sm font-semibold text-foreground">
                    {currencyFormatter.format(parseNumericValue(business.cashFlow))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CongratulationsSection({
  onRestart,
}: {
  onRestart: () => void;
}) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem]">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Congratulations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="rounded-2xl border border-border bg-muted/50 px-4 py-6 text-center">
          <div className="text-4xl">🎉</div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">You won the game!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You reached or exceeded the target cashflow income.
          </p>
        </div>

        <Button type="button" className="w-full" onClick={onRestart}>
          Play again
        </Button>
      </CardContent>
    </Card>
  );
}

function AccountSection({
  balance,
  netCashflow,
  transactions,
  onEarnCashflow,
  onSpend,
}: {
  balance: number;
  netCashflow: number;
  transactions: TransactionEntry[];
  onEarnCashflow: () => void;
  onSpend: (amount: number) => void;
}) {
  const [spendOpen, setSpendOpen] = useState(false);
  const [spendAmount, setSpendAmount] = useState("");
  const [spendError, setSpendError] = useState("");

  const submitSpend = () => {
    const amount = parseNumericValue(spendAmount);
    if (amount <= 0) {
      setSpendError("Enter a valid amount.");
      return;
    }

    if (amount > balance) {
      setSpendError("Not enough balance.");
      return;
    }

    onSpend(amount);
    setSpendAmount("");
    setSpendError("");
    setSpendOpen(false);
  };

  return (
    <div className="grid min-h-[62dvh] grid-rows-2 gap-4">
      <Card className="overflow-hidden rounded-[1.75rem]">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="rounded-xl border border-border bg-muted/50 px-3 py-3 text-center">
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Current balance
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {currencyFormatter.format(balance)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="default"
              onClick={onEarnCashflow}
              disabled={netCashflow <= 0}
              className="h-10"
            >
              Earn cashflow
            </Button>

            <Dialog open={spendOpen} onOpenChange={setSpendOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" className="h-10">
                  Spend
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Spend amount</DialogTitle>
                  <DialogDescription>Enter the amount to remove from your balance.</DialogDescription>
                </DialogHeader>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="spend-amount">Amount</Label>
                  <Input
                    id="spend-amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    value={spendAmount}
                    onChange={(event) => {
                      setSpendAmount(event.target.value);
                      if (spendError) setSpendError("");
                    }}
                    placeholder="0"
                  />
                  {spendError ? <p className="text-sm text-destructive">{spendError}</p> : null}
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setSpendOpen(false);
                      setSpendAmount("");
                      setSpendError("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={submitSpend}>
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[1.75rem]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Transactions</CardTitle>
        </CardHeader>
        <CardContent className="h-full pt-0">
          {transactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
              No transactions yet.
            </div>
          ) : (
            <div className="h-full space-y-2 overflow-y-auto pr-1">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{transaction.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      transaction.type === "earn"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {transaction.type === "earn" ? "+" : "-"}
                    {currencyFormatter.format(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AvatarSelectionSection({
  onSelectAvatar,
}: {
  onSelectAvatar: (avatar: AvatarPreset) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem]">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Choose your avatar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-sm text-muted-foreground">Start by selecting a predefined profile.</p>

        {avatarPresets.map((avatar) => (
          <div key={avatar.id} className="rounded-xl border border-border bg-muted/50 px-3 py-3">
            <div className="text-base font-semibold text-foreground">{avatar.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Salary {currencyFormatter.format(parseNumericValue(avatar.salary))}
            </div>
            <Button type="button" className="mt-3 w-full" onClick={() => onSelectAvatar(avatar)}>
              Select {avatar.name}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LiabilitySection({
  realEstateAssets,
  liabilityValues,
  setLiabilityValues,
  onPayBackLiability,
  canPayBackLiability,
  onGetBankLoan,
  onPayBackBankLoan,
  canUseBankLoanPayBack,
}: {
  realEstateAssets: RealEstateAssetEntry[];
  liabilityValues: Record<LiabilityKey, string>;
  setLiabilityValues: Dispatch<SetStateAction<Record<LiabilityKey, string>>>;
  onPayBackLiability: (key: LiabilityKey) => void;
  canPayBackLiability: (key: LiabilityKey) => boolean;
  onGetBankLoan: (amount: number) => string | null;
  onPayBackBankLoan: (amount: number) => string | null;
  canUseBankLoanPayBack: boolean;
}) {
  const [bankLoanOpen, setBankLoanOpen] = useState(false);
  const [bankLoanPayBackOpen, setBankLoanPayBackOpen] = useState(false);
  const [bankLoanRequestAmount, setBankLoanRequestAmount] = useState("");
  const [bankLoanPayBackAmount, setBankLoanPayBackAmount] = useState("");
  const [bankLoanRequestError, setBankLoanRequestError] = useState("");
  const [bankLoanPayBackError, setBankLoanPayBackError] = useState("");

  const autoLiabilities = useMemo(
    () =>
      realEstateAssets.map((entry) => ({
        id: entry.id,
        name: entry.name || "Unnamed asset",
        value: Math.max(parseNumericValue(entry.cost) - parseNumericValue(entry.downPayment), 0),
      })),
    [realEstateAssets]
  );

  const totalLiabilities = useMemo(() => {
    const fixedTotal = fixedLiabilities.reduce((sum, liability) => {
      return sum + (Number.parseFloat(liabilityValues[liability.key]) || 0);
    }, 0);

    const realEstateTotal = autoLiabilities.reduce((sum, liability) => sum + liability.value, 0);

    return fixedTotal + realEstateTotal;
  }, [autoLiabilities, liabilityValues]);

  const updateLiabilityValue = (key: LiabilityKey, value: string) => {
    setLiabilityValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submitGetBankLoan = () => {
    const requestedAmount = parseNumericValue(bankLoanRequestAmount);
    const error = onGetBankLoan(requestedAmount);
    if (error) {
      setBankLoanRequestError(error);
      return;
    }

    setBankLoanRequestAmount("");
    setBankLoanRequestError("");
    setBankLoanOpen(false);
  };

  const submitPayBackBankLoan = () => {
    const payBackAmount = parseNumericValue(bankLoanPayBackAmount);
    const error = onPayBackBankLoan(payBackAmount);
    if (error) {
      setBankLoanPayBackError(error);
      return;
    }

    setBankLoanPayBackAmount("");
    setBankLoanPayBackError("");
    setBankLoanPayBackOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Total liabilities
        </div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {currencyFormatter.format(totalLiabilities)}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        {fixedLiabilities.map((liability) => (
          <div
            key={liability.key}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2.5"
          >
            <label htmlFor={liability.key} className="flex-1 text-sm font-medium text-foreground">
              {liability.label}
            </label>
            <div className="flex w-[120px] items-center justify-end">
              <Input
                id={liability.key}
                type="number"
                inputMode="decimal"
                min="0"
                step="100"
                value={liabilityValues[liability.key]}
                onChange={(event) => updateLiabilityValue(liability.key, event.target.value)}
                placeholder="0"
                readOnly={liability.key === "bankLoan"}
                className="h-9 rounded-lg text-right text-sm"
              />
            </div>
            {liability.key === "bankLoan" ? (
              <div className="flex items-center gap-2">
                <Dialog
                  open={bankLoanOpen}
                  onOpenChange={(open) => {
                    setBankLoanOpen(open);
                    if (!open) {
                      setBankLoanRequestAmount("");
                      setBankLoanRequestError("");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      Get loan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Get bank loan</DialogTitle>
                      <DialogDescription>Enter a loan amount in multiples of 1000.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 pt-2">
                      <Label htmlFor="bank-loan-amount">Loan amount</Label>
                      <Input
                        id="bank-loan-amount"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="1000"
                        value={bankLoanRequestAmount}
                        onChange={(event) => {
                          setBankLoanRequestAmount(event.target.value);
                          if (bankLoanRequestError) setBankLoanRequestError("");
                        }}
                        placeholder="1000"
                      />
                      {bankLoanRequestError ? <p className="text-sm text-destructive">{bankLoanRequestError}</p> : null}
                    </div>

                    <DialogFooter className="pt-2">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                          setBankLoanOpen(false);
                          setBankLoanRequestAmount("");
                          setBankLoanRequestError("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="button" onClick={submitGetBankLoan}>
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={bankLoanPayBackOpen}
                  onOpenChange={(open) => {
                    setBankLoanPayBackOpen(open);
                    if (!open) {
                      setBankLoanPayBackAmount("");
                      setBankLoanPayBackError("");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" disabled={!canUseBankLoanPayBack}>
                      Pay back
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Pay back bank loan</DialogTitle>
                      <DialogDescription>Enter a payback amount in multiples of 1000.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 pt-2">
                      <Label htmlFor="bank-loan-payback-amount">Payback amount</Label>
                      <Input
                        id="bank-loan-payback-amount"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="1000"
                        value={bankLoanPayBackAmount}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setBankLoanPayBackAmount(nextValue);

                          if (nextValue === "") {
                            setBankLoanPayBackError("");
                            return;
                          }

                          const parsed = parseNumericValue(nextValue);
                          if (parsed > 0 && !isMultipleOfThousand(parsed)) {
                            setBankLoanPayBackError("Amount must be a multiple of 1000.");
                            return;
                          }

                          setBankLoanPayBackError("");
                        }}
                        placeholder="1000"
                      />
                      {bankLoanPayBackError ? <p className="text-sm text-destructive">{bankLoanPayBackError}</p> : null}
                    </div>

                    <DialogFooter className="pt-2">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                          setBankLoanPayBackOpen(false);
                          setBankLoanPayBackAmount("");
                          setBankLoanPayBackError("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="button" onClick={submitPayBackBankLoan}>
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : liabilityExpenseMapping[liability.key] ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPayBackLiability(liability.key)}
                disabled={!canPayBackLiability(liability.key)}
              >
                Pay back
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-2 text-base font-semibold text-foreground">Real Estate / Business</div>

        {autoLiabilities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
            Automatically filled from asset entries.
          </div>
        ) : (
          <div className="space-y-2">
            {autoLiabilities.map((liability) => (
              <div
                key={liability.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2.5"
              >
                <div className="flex-1 text-sm font-medium text-foreground">{liability.name}</div>
                <div className="text-sm font-semibold text-foreground">
                  {currencyFormatter.format(liability.value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const initialState = useMemo(() => readStoredGameState(), []);
  const [activeTab, setActiveTab] = useState<TabId>(initialState.activeTab);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(initialState.selectedAvatarId);
  const [savings, setSavings] = useState(initialState.savings);
  const [salary, setSalary] = useState(initialState.salary);
  const [expenseValues, setExpenseValues] = useState<Record<ExpenseKey, string>>(initialState.expenseValues);
  const [childCount, setChildCount] = useState<ChildCount>(initialState.childCount);
  const [childCost, setChildCost] = useState(initialState.childCost);
  const [liabilityValues, setLiabilityValues] = useState<Record<LiabilityKey, string>>(initialState.liabilityValues);
  const [preciousMetals, setPreciousMetals] = useState<PreciousMetalEntry[]>(initialState.preciousMetals);
  const [funds, setFunds] = useState<FundEntry[]>(initialState.funds);
  const [fundIncomeEntries, setFundIncomeEntries] = useState<IncomeEntry[]>(initialState.fundIncomeEntries);
  const [realEstateIncomeEntries, setRealEstateIncomeEntries] = useState<IncomeEntry[]>(initialState.realEstateIncomeEntries);
  const [realEstateAssets, setRealEstateAssets] = useState<RealEstateAssetEntry[]>(initialState.realEstateAssets);
  const [accountBalance, setAccountBalance] = useState(initialState.accountBalance);
  const [transactions, setTransactions] = useState<TransactionEntry[]>(initialState.transactions);
  const [isRatraceMode, setIsRatraceMode] = useState(initialState.isRatraceMode);
  const [businessEntries, setBusinessEntries] = useState<BusinessEntry[]>(initialState.businessEntries);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const hasHydratedRef = useRef(false);
  const selectedAvatar = avatarPresets.find((avatar) => avatar.id === selectedAvatarId) ?? null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedAvatarId,
        activeTab,
        savings,
        salary,
        expenseValues,
        childCount,
        childCost,
        liabilityValues,
        preciousMetals,
        funds,
        fundIncomeEntries,
        realEstateIncomeEntries,
        realEstateAssets,
        accountBalance,
        transactions,
        isRatraceMode,
        businessEntries,
      })
    );
  }, [accountBalance, activeTab, businessEntries, childCost, childCount, expenseValues, funds, fundIncomeEntries, isRatraceMode, liabilityValues, preciousMetals, realEstateAssets, realEstateIncomeEntries, salary, savings, selectedAvatarId, transactions]);

  const salaryTotal = parseNumericValue(salary);
  const interestDividendsTotal = fundIncomeEntries.reduce((sum, entry) => sum + parseNumericValue(entry.amount), 0);
  const realEstateBusinessIncomeTotal = realEstateIncomeEntries.reduce(
    (sum, entry) => sum + parseNumericValue(entry.amount),
    0
  );
  const passiveIncomeTotal = interestDividendsTotal + realEstateBusinessIncomeTotal;
  const totalIncome = salaryTotal + passiveIncomeTotal;
  const totalExpenses = useMemo(
    () => getTotalExpenses(expenseValues, childCount, childCost),
    [expenseValues, childCount, childCost]
  );
  const netCashflow = totalIncome - totalExpenses;
  const ratRaceCashflowIncome = useMemo(() => {
    const businessCashflowTotal = businessEntries.reduce(
      (sum, entry) => sum + parseNumericValue(entry.cashFlow),
      0
    );

    return passiveIncomeTotal * 100 + businessCashflowTotal;
  }, [businessEntries, passiveIncomeTotal]);

  const targetCashflowIncome = useMemo(() => {
    return passiveIncomeTotal * 100 + 50000;
  }, [passiveIncomeTotal]);

  const differenceToTarget = useMemo(() => {
    return targetCashflowIncome - ratRaceCashflowIncome;
  }, [ratRaceCashflowIncome, targetCashflowIncome]);

  const hasReachedTarget = ratRaceCashflowIncome >= targetCashflowIncome;

  const applyAvatarPreset = (avatar: AvatarPreset) => {
    setSelectedAvatarId(avatar.id);
    setSalary(avatar.salary);
    setExpenseValues(avatar.expenses);
    setLiabilityValues(avatar.liabilities);
    setChildCount(avatar.childCount);
    setChildCost(avatar.childCost);
    setSavings(avatar.savings);
    setAccountBalance(avatar.initialBalance);
    setTransactions([]);
    setBusinessEntries([]);
    setIsRatraceMode(false);
    setActiveTab("dashboard");
  };

  const leaveRatRace = () => {
    const startingBalance = passiveIncomeTotal * 100;
    setIsRatraceMode(true);
    setBusinessEntries([]);
    setAccountBalance(startingBalance);
    setTransactions((current) => [
      {
        id: createEntryId(),
        type: "earn",
        amount: startingBalance,
        label: "Leave the rat race",
        createdAt: Date.now(),
      },
      ...current,
    ]);
    setActiveTab("dashboard");
  };

  const restartGame = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    setSelectedAvatarId(null);
    setSalary("");
    setExpenseValues(initialExpenseValues);
    setChildCount("0");
    setChildCost("0");
    setLiabilityValues(initialLiabilityValues);
    setSavings("");
    setPreciousMetals([]);
    setFunds([]);
    setFundIncomeEntries([]);
    setRealEstateIncomeEntries([]);
    setRealEstateAssets([]);
    setAccountBalance(0);
    setTransactions([]);
    setBusinessEntries([]);
    setIsRatraceMode(false);
    setActiveTab("dashboard");
  };

  const buyBusiness = (name: string, cashFlow: string) => {
    const nextBusiness: BusinessEntry = {
      id: createEntryId(),
      name,
      cashFlow,
    };

    const parsedCashFlow = parseNumericValue(cashFlow);

    setBusinessEntries((current) => [...current, nextBusiness]);
    setAccountBalance((current) => current + parsedCashFlow);
    setTransactions((current) => [
      {
        id: createEntryId(),
        type: "earn",
        amount: parsedCashFlow,
        label: `Buy business: ${name}`,
        createdAt: Date.now(),
      },
      ...current,
    ]);
  };

  const earnCashflow = () => {
    if (netCashflow <= 0) return;

    setAccountBalance((current) => current + netCashflow);
    setTransactions((current) => [
      {
        id: createEntryId(),
        type: "earn",
        amount: netCashflow,
        label: "Earn cashflow",
        createdAt: Date.now(),
      },
      ...current,
    ]);
  };

  const spendFromBalance = (amount: number) => {
    if (amount <= 0 || amount > accountBalance) return;

    setAccountBalance((current) => current - amount);

    setTransactions((current) => [
      {
        id: createEntryId(),
        type: "spend",
        amount,
        label: "Spend",
        createdAt: Date.now(),
      },
      ...current,
    ]);
  };

  const spendForAssetPurchase = (amount: number, label: string) => {
    if (amount <= 0 || amount > accountBalance) return false;

    setAccountBalance((current) => current - amount);
    setTransactions((current) => [
      {
        id: createEntryId(),
        type: "spend",
        amount,
        label,
        createdAt: Date.now(),
      },
      ...current,
    ]);
    return true;
  };

  const canPayBackLiability = (key: LiabilityKey) => {
    if (!liabilityExpenseMapping[key]) return false;
    const amount = parseNumericValue(liabilityValues[key]);
    return amount > 0 && accountBalance >= amount;
  };

  const getBankLoan = (amount: number) => {
    if (amount <= 0) return "Enter a valid amount.";
    if (!isMultipleOfThousand(amount)) return "Amount must be a multiple of 1000.";

    const currentBankLoan = parseNumericValue(liabilityValues.bankLoan);
    const nextBankLoan = currentBankLoan + amount;

    setLiabilityValues((current) => ({
      ...current,
      bankLoan: String(nextBankLoan),
    }));
    setExpenseValues((current) => ({
      ...current,
      bankLoan: String(nextBankLoan * 0.1),
    }));
    setAccountBalance((current) => current + amount);
    setTransactions((current) => [
      {
        id: createEntryId(),
        type: "earn",
        amount,
        label: "Get bank loan",
        createdAt: Date.now(),
      },
      ...current,
    ]);
    return null;
  };

  const payBackBankLoan = (amount: number) => {
    if (amount <= 0) return "Enter a valid amount.";
    if (!isMultipleOfThousand(amount)) return "Amount must be a multiple of 1000.";

    const currentBankLoan = parseNumericValue(liabilityValues.bankLoan);
    if (amount > currentBankLoan) return "Payback amount cannot exceed current bank loan.";
    if (amount > accountBalance) return "Not enough balance.";

    const nextBankLoan = currentBankLoan - amount;

    setLiabilityValues((current) => ({
      ...current,
      bankLoan: String(nextBankLoan),
    }));
    setExpenseValues((current) => ({
      ...current,
      bankLoan: String(nextBankLoan * 0.1),
    }));
    setAccountBalance((current) => current - amount);
    setTransactions((current) => [
      {
        id: createEntryId(),
        type: "spend",
        amount,
        label: "Pay back bank loan",
        createdAt: Date.now(),
      },
      ...current,
    ]);
    return null;
  };

  const payBackLiability = (key: LiabilityKey) => {
    const linkedExpense = liabilityExpenseMapping[key];
    if (!linkedExpense) return;

    const amount = parseNumericValue(liabilityValues[key]);
    if (amount <= 0 || accountBalance < amount) return;

    setAccountBalance((current) => current - amount);
    setTransactions((current) => [
      {
        id: createEntryId(),
        type: "spend",
        amount,
        label: `Pay back ${fixedLiabilities.find((entry) => entry.key === key)?.label ?? "liability"}`,
        createdAt: Date.now(),
      },
      ...current,
    ]);

    setLiabilityValues((current) => ({
      ...current,
      [key]: "0",
    }));

    setExpenseValues((current) => ({
      ...current,
      [linkedExpense]: "0",
    }));
  };

  const earnFromAssetSale = (amount: number, label: string) => {
    if (amount <= 0) return;

    setAccountBalance((current) => current + amount);
    setTransactions((current) => [
      {
        id: createEntryId(),
        type: "earn",
        amount,
        label,
        createdAt: Date.now(),
      },
      ...current,
    ]);
  };

  const visibleTabs = isRatraceMode ? [tabs[0], tabs[5]] : tabs;

  return (
    <div className="min-h-[100dvh] bg-background px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 text-foreground sm:pt-8">
      <main className="mx-auto flex w-full max-w-sm flex-col gap-5">
        <header className="px-1 pb-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Cashflow App
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {selectedAvatarId ? visibleTabs.find((tab) => tab.id === activeTab)?.label : "Avatar setup"}
              </h1>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="mt-1 h-10 w-10 rounded-full"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {!selectedAvatarId && (
          <AvatarSelectionSection onSelectAvatar={applyAvatarPreset} />
        )}

        {selectedAvatarId && selectedAvatar && activeTab === "dashboard" && isRatraceMode && hasReachedTarget && (
          <CongratulationsSection onRestart={restartGame} />
        )}

        {selectedAvatarId && selectedAvatar && activeTab === "dashboard" && isRatraceMode && !hasReachedTarget && (
          <RatRaceDashboardSection
            cashflowIncome={ratRaceCashflowIncome}
            businesses={businessEntries}
            onBuyBusiness={buyBusiness}
            targetCashflowIncome={targetCashflowIncome}
            differenceToTarget={differenceToTarget}
          />
        )}

        {selectedAvatarId && selectedAvatar && activeTab === "dashboard" && !isRatraceMode && (
          <DashboardSection
            avatarName={selectedAvatar.name}
            AvatarIcon={getAvatarIcon(selectedAvatar.id)}
            salaryTotal={salaryTotal}
            passiveIncomeTotal={passiveIncomeTotal}
            incomeTotal={totalIncome}
            totalExpenses={totalExpenses}
            netCashflow={netCashflow}
            onLeaveRatRace={leaveRatRace}
          />
        )}

        {selectedAvatarId && activeTab === "income" && !isRatraceMode && (
          <IncomeSection
            salary={salary}
            setSalary={setSalary}
            fundIncomeEntries={fundIncomeEntries}
            realEstateIncomeEntries={realEstateIncomeEntries}
          />
        )}

        {selectedAvatarId && activeTab === "expenses" && !isRatraceMode && (
          <ExpenseSection
            expenseValues={expenseValues}
            setExpenseValues={setExpenseValues}
            childCount={childCount}
            setChildCount={setChildCount}
            childCost={childCost}
            setChildCost={setChildCost}
            totalExpenses={totalExpenses}
          />
        )}

        {selectedAvatarId && activeTab === "assets" && !isRatraceMode && (
          <AssetSection
            accountBalance={accountBalance}
            savings={savings}
            setSavings={setSavings}
            preciousMetals={preciousMetals}
            setPreciousMetals={setPreciousMetals}
            funds={funds}
            setFunds={setFunds}
            realEstateAssets={realEstateAssets}
            setRealEstateAssets={setRealEstateAssets}
            setFundIncomeEntries={setFundIncomeEntries}
            setRealEstateIncomeEntries={setRealEstateIncomeEntries}
            onAssetPurchase={spendForAssetPurchase}
            onAssetSale={earnFromAssetSale}
          />
        )}

        {selectedAvatarId && activeTab === "liabilities" && !isRatraceMode && (
          <LiabilitySection
            realEstateAssets={realEstateAssets}
            liabilityValues={liabilityValues}
            setLiabilityValues={setLiabilityValues}
            onPayBackLiability={payBackLiability}
            canPayBackLiability={canPayBackLiability}
            onGetBankLoan={getBankLoan}
            onPayBackBankLoan={payBackBankLoan}
            canUseBankLoanPayBack={
              parseNumericValue(liabilityValues.bankLoan) > 0 && accountBalance > 0
            }
          />
        )}

        {selectedAvatarId && activeTab === "account" && (
          <AccountSection
            balance={accountBalance}
            netCashflow={netCashflow}
            transactions={transactions}
            onEarnCashflow={
              isRatraceMode
                ? () => {
                    if (ratRaceCashflowIncome <= 0) return;
                    setAccountBalance((current) => current + ratRaceCashflowIncome);
                    setTransactions((current) => [
                      {
                        id: createEntryId(),
                        type: "earn",
                        amount: ratRaceCashflowIncome,
                        label: "Earn cashflow income",
                        createdAt: Date.now(),
                      },
                      ...current,
                    ]);
                  }
                : earnCashflow
            }
            onSpend={spendFromBalance}
          />
        )}
      </main>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Menu</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => {
                setMenuOpen(false);
                setConfirmResetOpen(true);
              }}
            >
              Reset game
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Reset game?</DialogTitle>
            <DialogDescription>
              This will permanently delete your current progress and return to avatar selection.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setConfirmResetOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => {
                setConfirmResetOpen(false);
                restartGame();
              }}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedAvatarId ? (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-sm px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <nav className="flex items-center justify-between gap-1 rounded-[1.5rem] border border-border bg-card/80 p-2 shadow-sm backdrop-blur-sm">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;

              return (
                <Button
                  key={tab.id}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex h-auto flex-1 flex-col items-center justify-center rounded-[1.1rem] px-1 py-2 text-[10px] font-medium ${
                    isActive ? "shadow-sm" : "text-muted-foreground"
                  }`}
                  aria-label={tab.label}
                >
                  <Icon className="h-4 w-4" />
                  <span className={isActive ? "mt-1" : "sr-only"}>{tab.label}</span>
                </Button>
              );
            })}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
