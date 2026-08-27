import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function Modal({ title, onClose, children, wide = false }) {
  const [position, setPosition] = useState(null);

  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const positionStart = useRef({ x: 0, y: 0 });

  function handlePointerDown(e) {
    // Only start dragging with the primary mouse/touch pointer.
    if (e.button !== 0) return;

    const modal = e.currentTarget.parentElement;
    const rect = modal.getBoundingClientRect();

    dragging.current = true;

    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
    };

    positionStart.current = {
      x: rect.left,
      y: rect.top,
    };

    setPosition({
      x: rect.left,
      y: rect.top,
    });

    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  useEffect(() => {
    function handlePointerMove(e) {
      if (!dragging.current) return;

      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      setPosition({
        x: positionStart.current.x + dx,
        y: positionStart.current.y + dy,
      });
    }

    function handlePointerUp() {
      dragging.current = false;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={"modal" + (wide ? " modal-wide" : "")}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={
          position
            ? {
                position: "fixed",
                left: `${position.x}px`,
                top: `${position.y}px`,
                margin: 0,
              }
            : undefined
        }
      >
        <div
          className="modal-header"
          onPointerDown={handlePointerDown}
          style={{
            cursor: "move",
            userSelect: "none",
            touchAction: "none",
          }}
        >
          <div className="modal-title">{title}</div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  danger,
  onCancel,
  onConfirm,
  busy,
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p
        style={{
          fontSize: 13.5,
          color: "var(--ink-dim)",
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>

      <div className="modal-actions">
        <button
          type="button"
          className="btn"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>

        <button
          type="button"
          className={"btn " + (danger ? "btn-danger" : "btn-primary")}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Please wait…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}