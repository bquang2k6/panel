"use client";

import * as React from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: "sm" | "md";
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  size = "md",
}: ToggleSwitchProps) {
  const isSm = size === "sm";

  return (
    <label
      className={`inline-flex items-center gap-2 select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          isSm ? "h-4 w-7" : "h-5 w-9"
        } ${checked ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
      >
        <span
          className={`pointer-events-none inline-block transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            isSm ? "h-3 w-3" : "h-4 w-4"
          } ${
            checked
              ? isSm
                ? "translate-x-3"
                : "translate-x-4"
              : "translate-x-0"
          }`}
        />
      </button>
      {label && (
        <span className={`font-medium ${isSm ? "text-[11px]" : "text-xs"} ${checked ? "text-foreground" : "text-muted-foreground"}`}>
          {label}
        </span>
      )}
    </label>
  );
}
