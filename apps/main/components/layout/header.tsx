import { Suspense } from "react";

import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { hasEnvVars } from "@/lib/utils";
import { MobileHeader } from "@/components/layout/mobile-header";
import { DesktopHeader } from "@/components/layout/desktop-header";

export function Header() {
  const userNavContent = !hasEnvVars ? (
    <EnvVarWarning />
  ) : (
    <Suspense
      fallback={
        <div className="h-9 w-9 rounded-full bg-primary/10 animate-pulse border border-primary/20" />
      }
    >
      <AuthButton />
    </Suspense>
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur transition-all">
      <Suspense fallback={null}>
        {/* Header riêng cho Mobile */}
        <MobileHeader userNavContent={userNavContent} />

        {/* Header riêng cho Desktop / PC */}
        <DesktopHeader userNavContent={userNavContent} />
      </Suspense>
    </header>
  );
}
