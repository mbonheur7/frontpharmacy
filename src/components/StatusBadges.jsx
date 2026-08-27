import React from "react";
import { daysUntil } from "../utils/formatters";

const EXPIRY_WARNING_DAYS = 30;

export function MedicineStatusBadge({ status }) {
  if (status === "Discontinued") {
    return <span className="badge badge-neutral">Discontinued</span>;
  }
  return <span className="badge badge-success">Active</span>;
}

/**
 * Mirrors the backend's alert thresholds (see alerts.py) purely for
 * display — this is informational classification only. The backend is
 * always the final authority on what can actually be sold or adjusted;
 * this badge never blocks an action by itself.
 */
export function computeStockSeverity(medicine) {
  const dLeft = daysUntil(medicine.expiry_date);

  if (medicine.status === "Discontinued") {
    return { key: "discontinued", label: "Discontinued", tone: "neutral" };
  }
  if (dLeft !== null && dLeft < 0) {
    return { key: "expired", label: "Expired", tone: "danger" };
  }
  if (medicine.quantity === 0) {
    return { key: "out", label: "Out of stock", tone: "danger" };
  }
  if (medicine.quantity <= medicine.critical_stock) {
    return { key: "critical", label: "Critical stock", tone: "critical" };
  }
  if (medicine.quantity <= medicine.minimum_stock) {
    return { key: "low", label: "Low stock", tone: "warning" };
  }
  if (dLeft !== null && dLeft <= EXPIRY_WARNING_DAYS) {
    return { key: "expiring", label: "Expiring soon", tone: "info" };
  }
  return { key: "ok", label: "In stock", tone: "success" };
}

export function StockSeverityBadge({ medicine }) {
  const { label, tone } = computeStockSeverity(medicine);
  return <span className={`badge badge-${tone}`}>{label}</span>;
}
