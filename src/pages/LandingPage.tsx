import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import ProcessFlowSection from '@/components/landing/ProcessFlowSection';
import MissionSection from '@/components/landing/MissionSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FAQSection from '@/components/landing/FAQSection';
import SignupFormSection from '@/components/landing/SignupFormSection';
import FooterSection from '@/components/landing/FooterSection';

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Qu'est-ce que Sapajoo, et à quoi sert-il ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sapajoo est une solution SaaS de gestion des achats et du contrôle budgétaire conçue pour les TPE et PME. Elle permet de centraliser les demandes d'achat, suivre les budgets en temps réel, gérer les bons de commande et automatiser le rapprochement des factures fournisseurs. C'est l'outil idéal pour structurer votre processus d'achat sans la complexité d'un ERP."
      }
    },
    {
      "@type": "Question",
      "name": "Quelle différence entre Sapajoo et un ERP ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Contrairement aux ERP complexes et coûteux, Sapajoo se concentre sur l'essentiel : la gestion des achats et le contrôle budgétaire. Pas de modules superflus, une prise en main rapide et un tarif adapté aux TPE/PME. Vous bénéficiez d'un processus d'achat robuste sans les contraintes d'implémentation et de formation des solutions traditionnelles."
      }
    },
    {
      "@type": "Question",
      "name": "Comment Sapajoo protège-t-il mes données financières et bancaires ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "La sécurité est notre priorité. Toutes les données sensibles, notamment les coordonnées bancaires des fournisseurs, sont chiffrées avec l'algorithme AES-256. L'accès est contrôlé par des politiques de sécurité strictes (RLS) et chaque utilisateur ne voit que les données auxquelles il a droit. Vos données sont hébergées sur des infrastructures européennes conformes au RGPD."
      }
    },
    {
      "@type": "Question",
      "name": "Comment Sapajoo améliore-t-il le contrôle budgétaire des TPE ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sapajoo offre une visibilité complète sur vos enveloppes budgétaires avec des alertes de dépassement, des tableaux de bord intuitifs et des rapports détaillés. Chaque dépense est affectée à un budget spécifique, permettant un suivi précis et évitant les surprises en fin de mois. Les TPE peuvent ainsi piloter leur trésorerie comme les grandes entreprises."
      }
    },
    {
      "@type": "Question",
      "name": "Sapajoo convient-il à une direction financière à temps partagé ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolument. Sapajoo est particulièrement adapté aux DAF à temps partagé qui interviennent dans plusieurs entreprises. L'interface centralisée permet de superviser plusieurs entités, d'accéder rapidement aux indicateurs clés et de générer les écritures de cut-off comptable en quelques clics. Un gain de temps considérable pour les professionnels de la finance externalisée."
      }
    },
    {
      "@type": "Question",
      "name": "Quels outils de pilotage financier propose Sapajoo ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sapajoo propose des tableaux de bord personnalisables, des rapports de suivi budgétaire, des indicateurs de performance fournisseurs, un simulateur de cut-off pour les arrêtés comptables, et des exports vers votre logiciel comptable. Ces outils de pilotage permettent une prise de décision éclairée basée sur des données fiables et à jour."
      }
    },
    {
      "@type": "Question",
      "name": "Comment fonctionne le processus d'achat dans Sapajoo ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Le processus d'achat dans Sapajoo suit un circuit structuré : création de la demande d'achat, validation selon les seuils définis, génération du bon de commande, réception et rapprochement de la facture fournisseur. Chaque étape est tracée et les fournisseurs peuvent accéder à un portail dédié pour soumettre leurs factures directement."
      }
    },
    {
      "@type": "Question",
      "name": "Peut-on générer des fichiers de virement SEPA avec Sapajoo ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Oui, Sapajoo permet de générer des navettes de virements au format XML SEPA directement depuis les factures validées. Les coordonnées bancaires des fournisseurs sont vérifiées et sécurisées, garantissant des paiements fiables. Cette fonctionnalité simplifie considérablement le processus de règlement fournisseurs."
      }
    }
  ]
};

const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>Sapajoo | Gestion des achats et contrôle budgétaire pour TPE/PME</title>
        <meta name="description" content="Gérez vos achats sans ERP : fournisseurs, budgets, factures et pré-comptabilité dans un seul outil, pour les TPE/PME et les DAF à temps partagé." />
        <link rel="canonical" href="https://sapajoo.fr/" />
        <meta property="og:title" content="Sapajoo | Gestion des achats et contrôle budgétaire pour TPE/PME" />
        <meta property="og:description" content="Gérez vos achats sans ERP : fournisseurs, budgets, factures et pré-comptabilité dans un seul outil, pour les TPE/PME et les DAF à temps partagé." />
        <meta property="og:url" content="https://sapajoo.fr/" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>
      
      <main className="min-h-screen flex flex-col overflow-x-hidden w-full relative">
        <Header />
        
        <article itemScope itemType="https://schema.org/WebPage">
          <HeroSection />
          <ProcessFlowSection />
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
