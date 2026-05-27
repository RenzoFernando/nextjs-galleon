"use client";

import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { listCategories } from "@/lib/api/categories.api";
import { getApiErrorMessage } from "@/lib/api/http";
import { listMerchants } from "@/lib/api/merchants.api";
import { createTransaction } from "@/lib/api/transactions.api";
import { getVault } from "@/lib/api/vaults.api";
import type { Category } from "@/types/category";
import type { Merchant } from "@/types/merchant";
import type { TransactionType } from "@/types/transaction";
import type { CurrencyCode, Vault } from "@/types/vault";

type TransactionFormState = {
  type: TransactionType;
  amountMinor: string;
  currency: CurrencyCode;
  occurredAt: string;
  categoryId: string;
  merchantId: string;
  linkedTransactionId: string;
  note: string;
  receiptUrl: string;
};

function getParamValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function isValidUrl(value: string): boolean {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const initialForm: TransactionFormState = {
  type: "expense",
  amountMinor: "",
  currency: "Galleon",
  occurredAt: todayInputValue(),
  categoryId: "",
  merchantId: "",
  linkedTransactionId: "",
  note: "",
  receiptUrl: "",
};

function validateTransactionForm(form: TransactionFormState): string | null {
  const amountMinor = Number(form.amountMinor);

  if (!Number.isInteger(amountMinor) || amountMinor < 1) {
    return "El monto debe ser un número entero mayor o igual a 1.";
  }

  if (!form.occurredAt) {
    return "Selecciona la fecha del movimiento.";
  }

  if (form.linkedTransactionId && (!Number.isInteger(Number(form.linkedTransactionId)) || Number(form.linkedTransactionId) < 1)) {
    return "La transacción vinculada debe ser un ID válido.";
  }

  if (form.note.trim().length > 220) {
    return "La nota no debe superar 220 caracteres.";
  }

  if (form.receiptUrl.trim() && !isValidUrl(form.receiptUrl)) {
    return "La URL del comprobante debe empezar por http:// o https://.";
  }

  return null;
}

export default function NewTransactionPage() {
  const router = useRouter();
  const params = useParams<{ vaultId: string }>();
  const vaultId = useMemo(() => Number(getParamValue(params.vaultId)), [params.vaultId]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [form, setForm] = useState<TransactionFormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof TransactionFormState>(key: K, value: TransactionFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function loadData() {
    if (!Number.isFinite(vaultId) || vaultId <= 0) {
      setError("El identificador de la bóveda no es válido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [vaultData, categoriesData, merchantsData] = await Promise.all([
        getVault(vaultId),
        listCategories(vaultId),
        listMerchants(vaultId),
      ]);
      setVault(vaultData);
      setCategories(categoriesData.filter((category) => !category.isArchived));
      setMerchants(merchantsData);
      setForm((current) => ({ ...current, currency: vaultData.baseCurrency }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validateTransactionForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      await createTransaction(vaultId, {
        type: form.type,
        amountMinor: Number(form.amountMinor),
        currency: form.currency,
        occurredAt: toIsoDate(form.occurredAt),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        merchantId: form.merchantId ? Number(form.merchantId) : null,
        linkedTransactionId: form.linkedTransactionId ? Number(form.linkedTransactionId) : null,
        note: form.note.trim() || undefined,
        receiptUrl: form.receiptUrl.trim() || undefined,
      });

      router.push(`/vaults/${vaultId}/transactions`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [vaultId]);

  return (
    <AppShell>
      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="rounded-3xl border border-[#B39F84]/30 bg-[#19242E] p-8 shadow-2xl shadow-black/40">
          <Link href={`/vaults/${vaultId}/transactions`} className="inline-flex rounded-full border border-[#B39F84]/40 px-4 py-2 text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10">
            Volver a movimientos
          </Link>
          <p className="mt-8 text-sm uppercase tracking-[0.35em] text-[#B39F84]">Nuevo movimiento</p>
          <h1 className="mt-4 font-serif text-4xl italic text-[#F2E8D5]">{vault?.name ?? "Bóveda"}</h1>
          <p className="mt-5 text-sm leading-7 text-[#D6CCA8]/75">
            Registra ingresos, gastos o transferencias con categoría, comercio y fecha.
          </p>
        </aside>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-8 shadow-xl shadow-black/30">
          {error ? (
            <div className="mb-6 rounded-2xl border border-[#7B2E2E] bg-[#2A1111] px-5 py-4 text-sm text-[#F2E8D5]">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-[#B39F84]/20 bg-black/25 p-5 text-center text-[#B39F84]">
              Cargando catálogos...
            </div>
          ) : null}

          <div className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
                Tipo
                <select value={form.type} onChange={(event) => setField("type", event.target.value as TransactionType)} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]">
                  <option value="income">Ingreso</option>
                  <option value="expense">Gasto</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
                Monto
                <input type="number" min="1" value={form.amountMinor} onChange={(event) => setField("amountMinor", event.target.value)} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]" placeholder="500" />
                <span className="text-xs font-normal text-[#D6CCA8]/60">Usa números enteros mayores o iguales a 1.</span>
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
                Moneda
                <select value={form.currency} onChange={(event) => setField("currency", event.target.value as CurrencyCode)} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]">
                  <option value="Galleon">Galleon</option>
                  <option value="Sickle">Sickle</option>
                  <option value="Knut">Knut</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
                Fecha
                <input type="date" value={form.occurredAt} onChange={(event) => setField("occurredAt", event.target.value)} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]" />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
                Categoría
                <select value={form.categoryId} onChange={(event) => setField("categoryId", event.target.value)} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]">
                  <option value="">Sin categoría</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
                Comercio
                <select value={form.merchantId} onChange={(event) => setField("merchantId", event.target.value)} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]">
                  <option value="">Sin comercio</option>
                  {merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.name}</option>)}
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
              Transacción vinculada
              <input type="number" min="1" value={form.linkedTransactionId} onChange={(event) => setField("linkedTransactionId", event.target.value)} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]" placeholder="Opcional" />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
              Nota
              <textarea value={form.note} maxLength={220} onChange={(event) => setField("note", event.target.value)} rows={4} className="resize-none rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition placeholder:text-[#D6CCA8]/35 focus:border-[#B39F84]" placeholder="Descripción breve del movimiento" />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
              URL del comprobante
              <input value={form.receiptUrl} onChange={(event) => setField("receiptUrl", event.target.value)} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition placeholder:text-[#D6CCA8]/35 focus:border-[#B39F84]" placeholder="https://..." />
            </label>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={saving || loading} className="rounded-full bg-[#B39F84] px-6 py-3 text-sm font-bold text-[#0C0C00] transition hover:bg-[#D6CCA8] disabled:opacity-60">
              {saving ? "Guardando..." : "Crear movimiento"}
            </button>
            <Link href={`/vaults/${vaultId}/transactions`} className="rounded-full border border-[#B39F84]/40 px-6 py-3 text-center text-sm font-bold text-[#D6CCA8] transition hover:bg-[#B39F84]/10">
              Cancelar
            </Link>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
