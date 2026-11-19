"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAtomValue } from "jotai";
import { AnimatePresence } from "framer-motion";
import { syncEngine } from "@/lib/sync-engine";
import { getTypedStorageItem, setTypedStorageItem, storage } from "@/lib/storage";
import { unifiedCampusServicesAtom } from "@/store";

const DEMO_FINANCE_ALL = {
  dues: {
    studentInfo: {
      registerNumber: "22BCE1234",
      studentName: "Demo Student",
      programme: "B.Tech Computer Science & Engineering",
      campus: "Vellore Institute of Technology, Chennai",
    },
    hasDues: false,
    message: "No pending tuition fees or hostel dues are registered for your account.",
  },
  receipts: {
    receipts: [
      { receiptNumber: "FEE-2026-90210", date: "2026-05-15", campusCode: "VITC", amount: "198000" },
      { receiptNumber: "HSTL-2026-10492", date: "2026-06-02", campusCode: "VITC", amount: "145000" },
    ],
  },
  wallet: {
    ledgerINR: [
      {
        amount: "5000",
        refundAmount: "0",
        transactionType: "CR",
        refundDate: null,
        particulars: "Security Deposit Refund",
        transactionDate: "2026-06-01",
        bookBalanceAmount: "5000",
      },
    ],
    ledgerUSD: [],
  },
  library: { books: [] },
  bank: {},
};

function applyFinanceAll(res: any) {
  const dues = res?.dues ?? null;
  const receipts = res?.receipts ?? null;
  const wallet = res?.wallet ?? null;
  const library = res?.library ?? null;
  const bank = res?.bank ?? null;
  try {
    if (dues) setTypedStorageItem("payments_dues", dues);
    if (receipts) setTypedStorageItem("payments_receipts", receipts);
    if (wallet) setTypedStorageItem("payments_wallet", wallet);
    if (library) storage.cache.set("library-due", { success: true, ...library });
    if (bank) storage.cache.set("bank-info", bank);
  } catch {}
  return {
    dues: dues as PaymentsDuesData | null,
    receipts: receipts as PaymentReceiptsData | null,
    wallet: wallet as PaymentWalletData | null,
  };
}
import { Wallet, Receipt, RefreshCcw, XCircle, Building, ExternalLink, FileText, ChevronRight } from "lucide-react";
import { Skeleton } from "@amazecontinuityprojects/amazeui";
import BottomSheet from "./shared/BottomSheet";
import {
  EmptyPanel,
  IconButton,
  InsightCarousel,
  KeyValue,
  ListRowText,
  ListSkeleton,
  PageShell,
  SectionHeader,
  SegmentedControl,
  useCarousel,
  type InsightSlide,
} from "./shared/primitives";
import { LIST_SHELL, TILE } from "@/lib/uiTokens";
import { safeNum, fmtAmt, latestBalance, isDebitEntry, latestTransaction, receiptDetailKey } from "@/lib/payments";
import type {
  PaymentLedgerEntry,
  PaymentReceipt,
  PaymentReceiptsData,
  PaymentReceiptTable,
  PaymentsDuesData,
  PaymentWalletData,
} from "@/types/payments";

const SUB_TABS = ["dues", "receipts", "wallet"] as const;
type SubTab = (typeof SUB_TABS)[number];

/* demo fixtures are provided via unified DEMO_FINANCE_ALL above */

const TONE_BADGE: Record<string, string> = {
  red: "bg-danger-surface text-danger-foreground border-border-ink",
  amber: "bg-warning-surface text-warning-foreground border-border-ink",
  emerald: "bg-success-surface text-success-foreground border-border-ink",
  indigo: "bg-secondary text-secondary-foreground border-border-ink",
  blue: "bg-secondary text-secondary-foreground border-border-ink",
  zinc: "bg-surface-secondary text-text-muted border-border-muted",
};

// Hero cards use the OD-hours sizing (a touch shorter than the course page)
const CARD_BASE = `${TILE} min-h-32 sm:min-h-36`;

const LIST_ROW = "w-full flex items-center justify-between gap-3 py-3 px-4 text-left";

interface PaymentsTabProps {
  loginToVTOP: () => Promise<{ cookies: string[]; authorizedID: string; csrf: string }>;
  onBack?: () => void;
}

/** The two record sets behind the single ledger list. */
type ListMode = "wallet" | "receipts";

export default function PaymentsTab({ loginToVTOP, onBack }: PaymentsTabProps) {
  const campusServices = useAtomValue(unifiedCampusServicesAtom);

  const [duesData, setDuesData] = useState<PaymentsDuesData | null>(
    () =>
      getTypedStorageItem("payments_dues") ??
      getTypedStorageItem("cache_payments") ??
      campusServices.payments.dues ??
      null,
  );
  const [receiptsData, setReceiptsData] = useState<PaymentReceiptsData | null>(
    () =>
      getTypedStorageItem("payments_receipts") ??
      getTypedStorageItem("cache_payment-receipts") ??
      (campusServices.payments.receipts?.length ? { receipts: campusServices.payments.receipts } : null),
  );
  const [walletData, setWalletData] = useState<PaymentWalletData | null>(
    () =>
      getTypedStorageItem("payments_wallet") ??
      getTypedStorageItem("cache_wallet") ??
      campusServices.payments.wallet ??
      null,
  );

  const [loading, setLoading] = useState<Record<SubTab, boolean>>({
    dues: false,
    receipts: false,
    wallet: false,
  });
  const [error, setError] = useState<Record<SubTab, string | null>>({
    dues: null,
    receipts: null,
    wallet: null,
  });

  // Per-receipt detail cache so reopening a sheet never refetches
  const [receiptDetails, setReceiptDetails] = useState<Record<string, PaymentReceiptTable[]>>({});
  const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({});
  const [openReceipt, setOpenReceipt] = useState<PaymentReceipt | null>(null);

  // One segmented control drives the single ledger list (attendance-log style)
  const [listMode, setListMode] = useState<ListMode>("wallet");

  // Carousel state for the rotating stat card

  // Collapse concurrent logins into one. `loginVtop` only caches credentials
  // *after* a successful login, so parallel section loads would otherwise fire
  // several real VTOP logins (captcha solving, account-lockout backoff).
  const credsRef = useRef<ReturnType<PaymentsTabProps["loginToVTOP"]> | null>(null);
  const getCreds = useCallback(() => {
    if (!credsRef.current) {
      credsRef.current = loginToVTOP().finally(() => {
        credsRef.current = null;
      });
    }
    return credsRef.current;
  }, [loginToVTOP]);

  /** Single call: fetch all finance data and distribute to legacy stores/UI state. */
  const fetchAllFinance = useCallback(async () => {
    setLoading({ dues: true, receipts: true, wallet: true });
    setError({ dues: null, receipts: null, wallet: null });
    try {
      const { authorizedID } = await getCreds();
      let res: any;
      if (
        authorizedID === "DEMO123" ||
        (typeof window !== "undefined" && localStorage.getItem("demoMode") === "true")
      ) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        res = DEMO_FINANCE_ALL;
      } else {
        res = await syncEngine.sync("finance", { section: "all" });
      }
      const { dues, receipts, wallet } = applyFinanceAll(res);
      if (dues) setDuesData(dues);
      if (receipts) setReceiptsData(receipts);
      if (wallet) setWalletData(wallet);
      if (res?.errors && typeof res.errors === "object") {
        const msg = (k: string) => (res.errors as Record<string, string>)[k] || null;
        setError({ dues: msg("dues"), receipts: msg("receipts"), wallet: msg("wallet") });
      }
      return res;
    } catch (err: any) {
      const msg = err?.message || "Fetch failed";
      setError({ dues: msg, receipts: msg, wallet: msg });
      return null;
    } finally {
      setLoading({ dues: false, receipts: false, wallet: false });
    }
  }, [getCreds]);

  // One call on mount to load all finance data (instead of separate per-section calls).
  useEffect(() => {
    const missing = !duesData || !receiptsData || !walletData;
    if (missing) void fetchAllFinance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAll = useCallback(() => {
    void fetchAllFinance();
  }, [fetchAllFinance]);

  const anyLoading = loading.dues || loading.receipts || loading.wallet;

  // ── Derived data ────────────────────────────────────────────────────────
  const hasPendingDues = duesData?.hasDues === true;

  const receiptList = receiptsData?.receipts || [];
  const ledgerINR = walletData?.ledgerINR;
  const ledgerUSD = walletData?.ledgerUSD;
  const balanceINR = latestBalance(ledgerINR);
  const balanceUSD = latestBalance(ledgerUSD);
  const lastTxn = useMemo(() => latestTransaction(walletData), [walletData]);

  // ── Rotating carousel slides (wallet balances + receipts) ───────────────
  const slides = useMemo(() => {
    const list: {
      id: string;
      title: string;
      headline: string;
      subline: string;
      badge: string;
      tone: string;
      onClick: () => void;
    }[] = [];

    if (balanceINR) {
      list.push({
        id: "inr",
        title: "Wallet",
        headline: fmtAmt(balanceINR, "₹"),
        subline: "Available INR balance",
        badge: "INR",
        tone: "emerald",
        onClick: () => setListMode("wallet"),
      });
    }
    if (balanceUSD) {
      list.push({
        id: "usd",
        title: "Wallet",
        headline: fmtAmt(balanceUSD, "$"),
        subline: "Available USD balance",
        badge: "USD",
        tone: "blue",
        onClick: () => setListMode("wallet"),
      });
    }
    if (lastTxn) {
      const debit = isDebitEntry(lastTxn.entry);
      list.push({
        id: "txn",
        title: "Last transaction",
        headline: `${debit ? "−" : "+"}${fmtAmt(String(Math.abs(safeNum(lastTxn.entry.amount))), lastTxn.symbol)}`,
        // Particulars are server-provided and can themselves contain amounts.
        // Keep the summary useful without exposing them beside a covered value.
        subline: debit ? "Latest wallet debit" : "Latest wallet credit",
        badge: debit ? "Debit" : "Credit",
        tone: debit ? "red" : "emerald",
        onClick: () => setListMode("wallet"),
      });
    }
    list.push({
      id: "receipts",
      title: "Receipts",
      headline: String(receiptList.length),
      subline: receiptList.length === 1 ? "1 fee receipt logged" : `${receiptList.length} fee receipts logged`,
      badge: "Receipts",
      tone: "indigo",
      onClick: () => setListMode("receipts"),
    });

    return list;
  }, [balanceINR, balanceUSD, lastTxn, receiptList.length]);

  const carousel = useCarousel(slides.length);
  const insightSlides = useMemo<InsightSlide[]>(
    () =>
      slides.map((s) => ({
        id: s.id,
        privacyCategory: s.id === "receipts" ? undefined : ("fees" as const),
        label: s.title,
        value: s.headline,
        sub: s.subline,
        badge: s.badge,
        tone: s.tone,
        onClick: s.onClick,
      })),
    [slides],
  );

  // ── Receipt detail sheet ────────────────────────────────────────────────
  const openReceiptDetail = useCallback(
    (receipt: PaymentReceipt) => {
      setOpenReceipt(receipt);
      const key = receiptDetailKey(receipt);
      if (!key || receiptDetails[key] || detailLoading[key]) return;
      setDetailLoading((prev) => ({ ...prev, [key]: true }));
      void (async () => {
        try {
          await getCreds();
          const res = await syncEngine.sync<any>("finance", { section: "receipt", applNo: key });
          const tables = (res?.receiptDetail?.tables || res?.tables || []) as PaymentReceiptTable[];
          if (tables.length) {
            setReceiptDetails((prev) => ({ ...prev, [key]: tables }));
          }
        } finally {
          setDetailLoading((prev) => ({ ...prev, [key]: false }));
        }
      })();
    },
    [receiptDetails, detailLoading, getCreds],
  );

  const detailKey = receiptDetailKey(openReceipt);
  const openTables = detailKey ? receiptDetails[detailKey] : undefined;
  const openDetailLoading = detailKey ? Boolean(detailLoading[detailKey]) : false;

  // ── Small render helpers ────────────────────────────────────────────────
  const renderError = (message: string) => (
    <div className="p-5 rounded-[14px] bg-danger-surface border border-border-ink text-danger-foreground flex items-center gap-3">
      <XCircle className="w-5 h-5 shrink-0" />
      <p className="text-xs font-bold">{message}</p>
    </div>
  );

  const renderListSkeleton = (rows: number) => (
    <ListSkeleton rows={rows} leading="dot" trailing titleWidth="w-1/3" subtitleWidth="w-1/4" />
  );

  // One flat ledger list: INR rows then USD, each tagged with its symbol
  const walletRows = useMemo(() => {
    const rows: { entry: PaymentLedgerEntry; symbol: string; ledger: "INR" | "USD" }[] = [];
    for (const entry of walletData?.ledgerINR || []) {
      rows.push({ entry, symbol: "₹", ledger: "INR" });
    }
    for (const entry of walletData?.ledgerUSD || []) {
      rows.push({ entry, symbol: "$", ledger: "USD" });
    }
    return rows;
  }, [walletData]);

  // Words, not an icon well (brand rule); the icon argument is kept for callers.
  const renderEmpty = (_icon: React.ReactNode, title: string, description: string) => (
    <EmptyPanel title={title} description={description} />
  );

  /* ───────────────────────────────────────────────────────────────────────
     RENDER
  ─────────────────────────────────────────────────────────────────────── */
  return (
    <PageShell
      syncedOps={["bulk"]}
      eyebrow="Campus · Payments"
      title="Payments & Financials"
      subtitle="Dues, wallet ledger and official fee receipts"
      onBack={onBack}
      actions={
        <IconButton onClick={refreshAll} title="Refresh payments from VTOP" disabled={anyLoading}>
          <RefreshCcw className={`w-4 h-4 ${anyLoading ? "animate-spin text-primary" : ""}`} />
        </IconButton>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* CARD 1: DUES */}
        <div
          className={`${CARD_BASE} ${
            !duesData ? "" : hasPendingDues ? "!bg-coral text-obsidian" : "!bg-mint text-obsidian"
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span
              className={`font-mono text-xs font-semibold uppercase tracking-[0.06em] truncate ${duesData ? "opacity-80" : "text-text-muted"}`}
            >
              Fee clearance
            </span>
            {/* Badge only when there is something to act on — the headline
                already states the status, so no second "all clear" chip. */}
            {loading.dues && !duesData ? (
              <span
                className={`text-xs sm:text-xs font-bold uppercase px-2 py-0.5 rounded-md shrink-0 border ${TONE_BADGE.zinc}`}
              >
                Syncing
              </span>
            ) : hasPendingDues ? (
              <span
                className={`text-xs sm:text-xs font-bold uppercase px-2 py-0.5 rounded-md shrink-0 border ${TONE_BADGE.red}`}
              >
                Action needed
              </span>
            ) : null}
          </div>

          {loading.dues && !duesData ? (
            <div className="my-auto py-2">
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          ) : error.dues && !duesData ? (
            <p className="my-auto py-1 text-xs font-bold text-danger-foreground line-clamp-3">{error.dues}</p>
          ) : (
            <div className="my-auto py-1 min-w-0">
              <span className="block truncate font-display text-[32px] font-bold uppercase leading-none sm:text-[40px]">
                {hasPendingDues ? "Dues pending" : "All clear"}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <p className={`font-mono text-xs line-clamp-2 ${duesData ? "opacity-80" : "text-text-muted"}`}>
              {hasPendingDues ? (
                "Outstanding payments pending on VTOP"
              ) : duesData?.message ? (
                <span data-private="fees">{duesData.message}</span>
              ) : (
                "No outstanding fee dues"
              )}
            </p>
            {hasPendingDues && (
              <a
                href="https://vtop.vit.ac.in"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex min-h-9 items-center gap-1 rounded-[8px] border-2 border-obsidian bg-obsidian px-2.5 font-mono text-xs font-bold uppercase text-cream shrink-0"
              >
                Pay
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* CARD 2: ROTATING CAROUSEL */}
        <InsightCarousel slides={insightSlides} carousel={carousel} height="min-h-32 sm:min-h-36" interactiveDots />
      </div>

      {/* ── LEDGER: one list, two sources (attendance-log composition) ── */}
      <div className="space-y-4">
        <div className="space-y-3 px-1">
          <SectionHeader
            title={listMode === "wallet" ? "Wallet" : "Receipts"}
            count={listMode === "wallet" ? walletRows.length : receiptList.length}
          />
          <SegmentedControl
            grow
            value={listMode}
            onChange={(v) => setListMode(v as typeof listMode)}
            options={[
              { value: "wallet", label: "Wallet" },
              { value: "receipts", label: "Receipts" },
            ]}
          />
        </div>

        {listMode === "wallet" ? (
          loading.wallet && !walletData ? (
            renderListSkeleton(3)
          ) : error.wallet && !walletData ? (
            renderError(error.wallet)
          ) : walletRows.length === 0 ? (
            renderEmpty(
              <Wallet className="w-7 h-7" />,
              "No wallet activity",
              "Ledger credits, debits and security refunds appear here once your data syncs from VTOP.",
            )
          ) : (
            <div className={LIST_SHELL}>
              {walletRows.map(({ entry, symbol, ledger }, idx) => {
                const amt = safeNum(entry.amount);
                const refundAmt = safeNum(entry.refundAmount);
                const isDebit = isDebitEntry(entry);
                const isRefunded = refundAmt > 0 || Boolean(entry.refundDate);

                return (
                  <div key={`${ledger}-${idx}`} className={LIST_ROW}>
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDebit ? "bg-rose-500" : "bg-emerald-500"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <p
                          data-private="fees"
                          className="font-bold text-sm text-text-heading truncate font-outfit leading-tight"
                        >
                          {entry.particulars || (isDebit ? "Debit transaction" : "Credit deposit")}
                        </p>
                        {isRefunded && (
                          <span className="text-xs font-bold uppercase px-1.5 py-0.5 rounded-md border shrink-0 bg-warning-surface text-warning-foreground border-border-ink">
                            Refund
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted font-medium mt-0.5 truncate">
                        {[entry.transactionDate, entry.receiptNumber, ledger === "USD" ? "USD" : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        data-private="fees"
                        className={`font-bold text-sm font-outfit leading-tight ${
                          isDebit ? "text-danger-foreground" : "text-success-foreground"
                        }`}
                      >
                        {isDebit ? "−" : "+"}
                        {fmtAmt(String(Math.abs(amt)), symbol)}
                      </p>
                      {entry.bookBalanceAmount && (
                        <p data-private="fees" className="text-xs text-text-muted mt-0.5">
                          Bal {fmtAmt(entry.bookBalanceAmount, symbol)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : loading.receipts && !receiptsData ? (
          renderListSkeleton(3)
        ) : error.receipts && !receiptsData ? (
          renderError(error.receipts)
        ) : receiptList.length === 0 ? (
          renderEmpty(
            <Receipt className="w-7 h-7" />,
            "No receipts yet",
            "Official semester payment receipts logged on your student account show up here.",
          )
        ) : (
          <div className={LIST_SHELL}>
            {receiptList.map((r, i) => (
              <button
                key={r.receiptNumber || i}
                type="button"
                onClick={() => openReceiptDetail(r)}
                className={`${LIST_ROW} hover:bg-surface-hover transition-colors cursor-pointer group`}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-500" />
                <ListRowText title={r.receiptNumber} subtitle={[r.date, r.campusCode].filter(Boolean).join(" · ")} />

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p data-private="fees" className="font-bold text-sm font-outfit text-text-heading leading-tight">
                      {fmtAmt(r.amount)}
                    </p>
                    <p className="text-xs font-bold uppercase text-success-foreground mt-0.5">Settled</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-all" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── RECEIPT DETAIL SHEET ── */}
      <AnimatePresence>
        {openReceipt && (
          <BottomSheet
            onClose={() => setOpenReceipt(null)}
            overlayId="receipt-detail"
            maxWidth="max-w-lg"
            title={openReceipt.receiptNumber}
            subtitle="Official fee receipt"
            icon={<Receipt className="w-5 h-5" />}
            accent="bg-secondary text-secondary-foreground border-border-ink"
            closeLabel="Close receipt"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <KeyValue label="Amount" value={<span data-private="fees">{fmtAmt(openReceipt.amount)}</span>} />
                <KeyValue label="Date" value={openReceipt.date || "—"} />
                <KeyValue
                  label="Campus"
                  valueClassName="flex items-center gap-1.5"
                  value={
                    <>
                      <Building className="w-3.5 h-3.5 text-text-muted" />
                      {openReceipt.campusCode || "—"}
                    </>
                  }
                />
                <KeyValue label="Status" valueClassName="text-success-foreground" value="Settled" />
              </div>

              {openDetailLoading && (
                <div className="space-y-2.5">
                  <Skeleton className="h-20 w-full rounded-2xl" />
                  <Skeleton className="h-20 w-full rounded-2xl" />
                </div>
              )}

              {!openDetailLoading && openTables?.length ? (
                <div className="space-y-4">
                  {openTables.map((table, idx) => (
                    <div key={idx} className="space-y-2.5">
                      {table.caption && (
                        <h4 data-private="fees" className="text-xs font-bold text-text-muted uppercase tracking-wider">
                          {table.caption}
                        </h4>
                      )}
                      {table.rows?.map((row, ri) => (
                        <div
                          key={ri}
                          className="p-4 rounded-2xl bg-surface-secondary border-2 border-border-ink space-y-3"
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-secondary text-secondary-foreground">
                              <FileText className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-text-heading font-outfit">Invoice particulars</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5 text-xs">
                            {table.headers?.map((header) => (
                              <div key={header} className="p-2.5 rounded-xl bg-surface border-2 border-border-ink">
                                <span
                                  data-private="fees"
                                  className="text-xs font-bold text-text-muted uppercase block mb-0.5"
                                >
                                  {header}
                                </span>
                                <span data-private="fees" className="font-bold text-text-primary break-words">
                                  {row?.[header] || "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                !openDetailLoading && (
                  <p className="text-xs text-text-muted font-medium text-center py-2">
                    No invoice breakdown available for this receipt.
                  </p>
                )
              )}
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
