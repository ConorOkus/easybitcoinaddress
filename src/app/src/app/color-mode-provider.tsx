'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { type ReactNode } from 'react';

export function ColorModeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
