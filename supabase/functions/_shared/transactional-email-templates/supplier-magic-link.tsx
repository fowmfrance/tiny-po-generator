import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "sapajoo"

interface SupplierMagicLinkProps {
  supplierName?: string
  portalUrl?: string
}

const SupplierMagicLinkEmail = ({ supplierName, portalUrl }: SupplierMagicLinkProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Accédez à votre espace fournisseur {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          Votre lien d'accès fournisseur
        </Heading>
        <Text style={text}>
          Bonjour{supplierName ? ` ${supplierName}` : ''},
        </Text>
        <Text style={text}>
          Vous avez reçu un lien d'accès à votre espace fournisseur sur {SITE_NAME}.
          Cliquez sur le bouton ci-dessous pour y accéder directement.
        </Text>
        {portalUrl && (
          <Button style={button} href={portalUrl}>
            Accéder à mon espace fournisseur
          </Button>
        )}
        <Text style={textSmall}>
          Ce lien est personnel et sécurisé. Ne le partagez pas.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          — L'équipe {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SupplierMagicLinkEmail,
  subject: 'Votre accès fournisseur sapajoo',
  displayName: 'Magic link fournisseur',
  previewData: {
    supplierName: 'Acme Corp',
    portalUrl: 'https://sapajoo.lovable.app/supplier/portal/example-token',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '40px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e293b', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const textSmall = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '24px 0 0' }
const button = {
  backgroundColor: '#1e293b',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  display: 'inline-block' as const,
  margin: '8px 0 16px',
}
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#94a3b8', margin: '0' }
