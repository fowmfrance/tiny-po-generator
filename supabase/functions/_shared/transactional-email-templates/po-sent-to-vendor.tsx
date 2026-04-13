import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section, Row, Column,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "sapajoo"

interface POSentToVendorProps {
  contactName?: string
  projectName?: string
  poNumber?: string
  items?: string[]
  expectedDeliveryDate?: string
  portalUrl?: string
}

const POSentToVendorEmail = ({
  contactName,
  projectName,
  poNumber,
  items,
  expectedDeliveryDate,
  portalUrl,
}: POSentToVendorProps) => {
  const hasItems = items && items.length > 0

  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Bon de commande {poNumber || ''} — Récapitulatif</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bon de commande</Heading>

          <Text style={text}>
            Bonjour{contactName ? ` ${contactName}` : ''},
          </Text>

          <Text style={text}>
            Vous trouverez ci-dessous le récapitulatif des prestations commandées :
          </Text>

          {/* Summary table */}
          <Section style={tableSection}>
            <Row style={tableRow}>
              <Column style={labelCell}>Projet</Column>
              <Column style={valueCell}>{projectName || '—'}</Column>
            </Row>
            <Row style={tableRowAlt}>
              <Column style={labelCell}>Numéro de BdC</Column>
              <Column style={valueCell}>{poNumber || '—'}</Column>
            </Row>
            <Row style={tableRow}>
              <Column style={labelCell}>Services</Column>
              <Column style={valueCell}>
                {hasItems ? items!.join(', ') : '—'}
              </Column>
            </Row>
            <Row style={tableRowAlt}>
              <Column style={labelCell}>Date de livraison estimée</Column>
              <Column style={valueCell}>{expectedDeliveryDate || '—'}</Column>
            </Row>
          </Section>

          <Text style={text}>
            Vous pourrez nous faire parvenir votre facture à la réception de la prestation via le lien ci-dessous :
          </Text>

          {portalUrl && (
            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <Button style={button} href={portalUrl}>
                Accéder à mon espace fournisseur
              </Button>
            </Section>
          )}

          <Text style={textSmall}>
            Vous recevrez une notification pour vous confirmer cette dernière étape.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            — {SITE_NAME}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: POSentToVendorEmail,
  subject: (data: Record<string, any>) =>
    `Bon de commande ${data.poNumber || ''} — ${SITE_NAME}`,
  displayName: 'BdC envoyé au fournisseur',
  previewData: {
    contactName: 'Marie Dupont',
    projectName: 'Campagne été 2026',
    poNumber: 'PRJ-0012',
    items: ['Tournage vidéo', 'Montage post-production'],
    expectedDeliveryDate: '15/05/2026',
    portalUrl: 'https://sapajoo.lovable.app/supplier/portal/abc123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '40px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e293b', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const textSmall = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '16px 0 0' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#94a3b8', margin: '0' }

const tableSection = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  overflow: 'hidden' as const,
  margin: '0 0 24px',
}
const tableRow = { backgroundColor: '#ffffff' }
const tableRowAlt = { backgroundColor: '#f8fafc' }
const labelCell = {
  fontSize: '13px',
  fontWeight: 'bold' as const,
  color: '#64748b',
  padding: '10px 16px',
  width: '180px',
  verticalAlign: 'top' as const,
}
const valueCell = {
  fontSize: '14px',
  color: '#1e293b',
  padding: '10px 16px',
  verticalAlign: 'top' as const,
}
const button = {
  backgroundColor: '#1e293b',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
}
