import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import MissionSection from '@/components/landing/MissionSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FAQSection from '@/components/landing/FAQSection';
import SignupFormSection from '@/components/landing/SignupFormSection';
import FooterSection from '@/components/landing/FooterSection';

const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>Sapajoo — Gestion des achats & contrôle budgétaire PME</title>
        <meta name="description" content="Solution SaaS de gestion des achats, contrôle budgétaire et procurement pour TPE/PME et DAF à temps partagé." />
        <link rel="canonical" href="https://sapajoo.fr/" />
        <meta property="og:title" content="Sapajoo — Gestion des achats & contrôle budgétaire PME" />
        <meta property="og:description" content="Solution SaaS de gestion des achats, contrôle budgétaire et procurement pour TPE/PME et DAF à temps partagé." />
        <meta property="og:url" content="https://sapajoo.fr/" />
        <script type="application/ld+json">{`
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Qu'est-ce que Sapajoo et comment aide-t-il à la gestion des dépenses en entreprise ?", "acceptedAnswer": { "@type": "Answer", "text": "Sapajoo est une solution SaaS de gestion des achats et du contrôle budgétaire conçue pour les TPE et PME. Elle permet de centraliser les demandes d'achat, suivre les budgets en temps réel, gérer les bons de commande et automatiser le rapprochement des factures fournisseurs." } },
    { "@type": "Question", "name": "Comment Sapajoo améliore-t-il le contrôle budgétaire pour les TPE ?", "acceptedAnswer": { "@type": "Answer", "text": "Sapajoo offre une visibilité complète sur vos enveloppes budgétaires avec des alertes de dépassement, des tableaux de bord intuitifs et des rapports détaillés. Chaque dépense est affectée à un budget spécifique, permettant un suivi précis." } },
    { "@type": "Question", "name": "Sapajoo est-il adapté aux besoins d'une direction financière à temps partagé ?", "acceptedAnswer": { "@type": "Answer", "text": "Absolument. Sapajoo est particulièrement adapté aux DAF à temps partagé qui interviennent dans plusieurs entreprises. L'interface centralisée permet de superviser plusieurs entités et de générer les écritures de cut-off comptable en quelques clics." } },
    { "@type": "Question", "name": "Quels outils de pilotage financier propose Sapajoo ?", "acceptedAnswer": { "@type": "Answer", "text": "Sapajoo propose des tableaux de bord personnalisables, des rapports de suivi budgétaire, des indicateurs de performance fournisseurs, un simulateur de cut-off pour les arrêtés comptables, et des exports vers votre logiciel comptable." } },
    { "@type": "Question", "name": "Comment fonctionne le processus de procurement dans Sapajoo ?", "acceptedAnswer": { "@type": "Answer", "text": "Le processus de procurement suit un workflow structuré : création de la demande d'achat, validation selon les seuils définis, génération du bon de commande, réception et rapprochement de la facture fournisseur." } },
    { "@type": "Question", "name": "Quelle est la différence entre Sapajoo et un ERP traditionnel ?", "acceptedAnswer": { "@type": "Answer", "text": "Contrairement aux ERP complexes et coûteux, Sapajoo se concentre sur l'essentiel : la gestion des achats et le contrôle budgétaire. Pas de modules superflus, une prise en main rapide et un tarif adapté aux TPE/PME." } }
  ]
}
`}</script>
      </Helmet>
      
      <main className="min-h-screen flex flex-col overflow-x-hidden w-full relative">
        <Header />
        
        <article itemScope itemType="https://schema.org/WebPage">
          <HeroSection />
          <MissionSection />
          <FeaturesSection />
          <HowItWorksSection />
          <FAQSection />
        </article>
        
        {/* Contact section and footer with gradient background */}
        <footer className="relative">
          <div 
            className="absolute inset-0 w-full h-full -z-10" 
            style={{
              backgroundImage: "url('/lovable-uploads/e52049c0-6ccd-4165-9d7a-3003172c2fa5.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.85,
            }}
          />
          <SignupFormSection />
          <FooterSection />
        </footer>
      </main>
    </>
  );
};

export default LandingPage;
