import React from "react";
import { useUIStore } from "../../stores/uiStore";

type ToastType = "success" | "error" | "info" | "warning";

const typeStyles: Record<ToastType, { bar: string; ring: string; icon: string }> = {
  success: { bar: "bg-green-500", ring: "ring-green-200 dark:ring-green-900/40", icon: "✅" },
  error:   { bar: "bg-rose-500",  ring: "ring-rose-200 dark:ring-rose-900/40",   icon: "⛔" },
  info:    { bar: "bg-blue-500",  ring: "ring-blue-200 dark:ring-blue-900/40",   icon: "ℹ️" },
  warning: { bar: "bg-amber-500", ring: "ring-amber-200 dark:ring-amber-900/40", icon: "⚠️" },
};

export function NotificationToast({
  id,
  type,
  title,
  message,
  actionLabel,
  onAction,
}: {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const remove = useUIStore((s) => s.removeNotification);
  const t = typeStyles[type];

  return (
    <div
      role="status"
      className={[
        "relative w-full sm:w-96 pointer-events-auto rounded-xl border bg-white dark:bg-gray-800",
        "shadow-lg ring-1", t.ring, "overflow-hidden",
        "motion-safe:animate-fade-in"
      ].join(" ")}
    >
      <div className={["absolute left-0 top-0 h-full w-1", t.bar].join(" ")} />
      <div className="p-3 pl-4 pr-10">
        <div className="flex items-start gap-3">
          <div className="text-xl leading-none">{t.icon}</div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</div>
            <div className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{message}</div>
            {onAction && actionLabel && (
              <button
                onClick={onAction}
                className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {actionLabel}
              </button>
            )}
          </div>
          <button
            aria-label="Dismiss notification"
            onClick={() => remove(id)}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

