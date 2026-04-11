import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "sapajoo"

interface SupplierWelcomeProps {
  supplierName?: string
}

const SupplierWelcomeEmail = ({ supplierName }: SupplierWelcomeProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Bienvenue sur {SITE_NAME} — votre espace fournisseur</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          Bienvenue sur {SITE_NAME} !
        </Heading>
        <Text style={text}>
          Bonjour{supplierName ? ` ${supplierName}` : ''},
        </Text>
        <Text style={text}>
          Vous venez d'être référencé en tant que fournisseur sur notre plateforme {SITE_NAME}.
          Vous recevrez prochainement un lien d'accès à votre espace dédié, où vous pourrez :
        </Text>
        <Text style={listItem}>✓ Consulter vos bons de commande</Text>
        <Text style={listItem}>✓ Déposer vos factures en ligne</Text>
        <Text style={listItem}>✓ Suivre l'état de vos paiements</Text>
        <Text style={text}>
          En attendant, aucune action n'est requise de votre part.
          Nous reviendrons vers vous très vite.
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
  component: SupplierWelcomeEmail,
  subject: `Bienvenue sur ${SITE_NAME} — votre espace fournisseur`,
  displayName: 'Bienvenue fournisseur',
  previewData: {
    supplierName: 'Acme Corp',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '40px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e293b', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const listItem = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 4px', paddingLeft: '8px' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#94a3b8', margin: '0' }
