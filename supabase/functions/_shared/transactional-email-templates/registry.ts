/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as supplierMagicLink } from './supplier-magic-link.tsx'
import { template as supplierWelcome } from './supplier-welcome.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'supplier-magic-link': supplierMagicLink,
  'supplier-welcome': supplierWelcome,
}
