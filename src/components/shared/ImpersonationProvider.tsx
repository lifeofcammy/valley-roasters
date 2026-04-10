"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Lightweight client context so client portal pages can know whether
 * the current view is an admin "view as customer" preview, and disable
 * write actions accordingly. Server-side, getEffectiveProfile() is the
 * source of truth — this context just relays the boolean down the tree.
 */
export interface ImpersonationState {
  isImpersonating: boolean;
  impersonatedName: string | null;
}

const ImpersonationContext = createContext<ImpersonationState>({
  isImpersonating: false,
  impersonatedName: null,
});

export function ImpersonationProvider({
  isImpersonating,
  impersonatedName,
  children,
}: ImpersonationState & { children: ReactNode }) {
  return (
    <ImpersonationContext.Provider value={{ isImpersonating, impersonatedName }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation(): ImpersonationState {
  return useContext(ImpersonationContext);
}
