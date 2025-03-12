"use client";

import { ThemeProvider } from "next-themes";
import { PropsWithChildren } from "react";

export function RootAppProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
