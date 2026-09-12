"use client";

import type { ReactNode } from "react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ClerkProvider } from "@clerk/nextjs";
import { getClerkProxyUrl } from "@/lib/clerkProxy";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider proxyUrl={getClerkProxyUrl(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)}>
      <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>
    </ClerkProvider>
  );
}
