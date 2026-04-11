import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "sapajoo"

interface SupplierWelcomeProps {
  supplierName?: string
  portalUrl?: string
  kycDocuments?: string[]
}

const SupplierWelcomeEmail = ({ supplierName, portalUrl, kycDocuments }: SupplierWelcomeProps) => {
  const hasKyc = kycDocuments && kycDocuments.length > 0

  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Bienvenue sur {SITE_NAME} — accédez à votre espace fournisseur</Preview>
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
            {hasKyc
              ? " Pour finaliser votre inscription, nous avons besoin de quelques documents."
              : " Votre espace fournisseur est prêt, vous pouvez y accéder dès maintenant."
            }
          </Text>

          {hasKyc && (
            <Section style={kycSection}>
              <Text style={kycTitle}>📋 Documents requis :</Text>
              {kycDocuments.map((doc, i) => (
                <Text key={i} style={kycItem}>• {doc}</Text>
              ))}
            </Section>
          )}

          {portalUrl && (
            <Button style={button} href={portalUrl}>
              {hasKyc ? 'Déposer mes documents' : 'Accéder à mon espace'}
            </Button>
          )}

          <Text style={text}>
            Sur votre espace, vous pourrez :
          </Text>
          <Text style={listItem}>✓ Consulter vos bons de commande</Text>
          <Text style={listItem}>✓ Déposer vos factures en ligne</Text>
          <Text style={listItem}>✓ Suivre l'état de vos paiements</Text>

          {portalUrl && (
            <Text style={textSmall}>
              Ce lien est personnel et sécurisé. Ne le partagez pas.
            </Text>
          )}

          <Hr style={hr} />
          <Text style={footer}>
            — L'équipe {SITE_NAME}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: SupplierWelcomeEmail,
  subject: `Bienvenue sur ${SITE_NAME} — votre espace fournisseur`,
  displayName: 'Bienvenue fournisseur',
  previewData: {
    supplierName: 'Acme Corp',
    portalUrl: 'https://sapajoo.lovable.app/supplier/portal/example-token',
    kycDocuments: ["Pièce d'identité", 'RIB'],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '40px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e293b', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const listItem = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 4px', paddingLeft: '8px' }
const textSmall = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '24px 0 0' }
const kycSection = { backgroundColor: '#f8fafc', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const kycTitle = { fontSize: '15px', fontWeight: 'bold' as const, color: '#1e293b', margin: '0 0 8px' }
const kycItem = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 4px', paddingLeft: '4px' }
const button = {
  backgroundColor: '#1e293b',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  display: 'inline-block' as const,
  margin: '8px 0 20px',
}
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#94a3b8', margin: '0' }
