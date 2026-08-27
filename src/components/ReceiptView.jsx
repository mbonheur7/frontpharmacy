import React from "react";
import { formatMoney, formatDateTime } from "../utils/formatters";

export default function ReceiptView({ sale }) {
  return (
    <div className="receipt-paper">
      <div className="receipt-brand">
        <div className="receipt-brand-name">VI-PHARMACY</div>
        <div className="receipt-brand-sub">Sale receipt</div>
      </div>
      <div className="receipt-divider">
        <div className="receipt-line"><span>Receipt</span><span>{sale.receipt_number}</span></div>
        <div className="receipt-line"><span>Date</span><span>{formatDateTime(sale.sale_date)}</span></div>
        <div className="receipt-line"><span>Served by</span><span>{sale.sold_by_name}</span></div>
      </div>
      <div className="receipt-divider">
        {sale.items.map((it) => (
          <div className="receipt-line" key={it.medicine_id}>
            <span>{it.generic_name} x{it.quantity}</span>
            <span>{formatMoney(it.subtotal)}</span>
          </div>
        ))}
      </div>
      <div className="receipt-divider receipt-total">
        <span>TOTAL</span>
        <span>{formatMoney(sale.total_amount)}</span>
      </div>
      {"total_profit" in sale && (
        <div className="receipt-line" style={{ marginTop: 8, color: "var(--ink-dim)" }}>
          <span>Profit</span>
          <span>{formatMoney(sale.total_profit)}</span>
        </div>
      )}
      <div className="receipt-thanks">Thank you</div>
    </div>
  );
}
