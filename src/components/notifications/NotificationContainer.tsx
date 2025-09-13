import React from "react";
import { createPortal } from "react-dom";
import { useUIStore } from "../../stores/uiStore";
import { NotificationToast } from "./NotificationToast";

export function NotificationContainer() {
  const notifications = useUIStore((s) => s.notifications);

  // optional: sort and cap visible count
  const visible = React.useMemo(() => {
    // newest first, cap at 3
    return [...notifications].reverse().slice(0, 3);
  }, [notifications]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className={[
        "fixed inset-x-2 top-2 z-[100]",                 // above z-50 modals
        "sm:inset-auto sm:right-4 sm:top-4 sm:w-auto",    // desktop top-right
        "space-y-2 pointer-events-none"
      ].join(" ")}
    >
      {visible.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <NotificationToast
            id={n.id}
            type={n.type}
            title={n.title}
            message={n.message}
            actionLabel={n.action?.label}
            onAction={n.action?.onClick}
          />
        </div>
      ))}
    </div>,
    document.body
  );
}

