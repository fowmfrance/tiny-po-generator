import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "sapajoo"

interface SupplierInviteCopyProps {
  supplierName?: string
  supplierEmail?: string
  kycDocuments?: string[]
  inviterName?: string
}

const SupplierInviteCopyEmail = ({ supplierName, supplierEmail, kycDocuments, inviterName }: SupplierInviteCopyProps) => {
  const hasKyc = kycDocuments && kycDocuments.length > 0

  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Copie — Invitation fournisseur {supplierName || ''}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={badge}>📧 Copie de notification</Text>
          <Heading style={h1}>
            Fournisseur invité avec succès
          </Heading>
          <Text style={text}>
            Bonjour{inviterName ? ` ${inviterName}` : ''},
          </Text>
          <Text style={text}>
            Vous avez invité <strong>{supplierName || 'un fournisseur'}</strong> ({supplierEmail || '—'}) sur {SITE_NAME}.
            Un email d'accès lui a été envoyé avec un lien sécurisé vers son espace fournisseur.
          </Text>

          {hasKyc && (
            <>
              <Text style={text}>Documents KYC demandés :</Text>
              {kycDocuments!.map((doc, i) => (
                <Text key={i} style={listItem}>• {doc}</Text>
              ))}
              <Text style={textSmall}>
                Tant que les documents ne sont pas validés, les bons de commande associés resteront en brouillon.
              </Text>
            </>
          )}

          {!hasKyc && (
            <Text style={textSmall}>
              Aucun document KYC requis — le fournisseur accède directement à son portail.
            </Text>
          )}

          <Hr style={hr} />
          <Text style={footer}>
            — {SITE_NAME} • Vous recevez cette copie car l'option est activée dans vos paramètres.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: SupplierInviteCopyEmail,
  subject: (data: Record<string, any>) => `[Copie] Invitation fournisseur ${data.supplierName || ''}`,
  displayName: 'Copie invitation fournisseur',
  previewData: {
    supplierName: 'Acme Corp',
    supplierEmail: 'contact@acme.com',
    kycDocuments: ["Pièce d'identité", 'RIB'],
    inviterName: 'Clément',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '40px 25px' }
const badge = { fontSize: '12px', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 8px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e293b', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const listItem = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 4px', paddingLeft: '8px' }
const textSmall = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '16px 0 0' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#94a3b8', margin: '0' }
