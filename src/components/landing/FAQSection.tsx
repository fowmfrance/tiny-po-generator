import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: "Qu'est-ce que Sapajoo et comment aide-t-il à la gestion des dépenses en entreprise ?",
    answer: "Sapajoo est une solution SaaS de gestion des achats et du contrôle budgétaire conçue pour les TPE et PME. Elle permet de centraliser les demandes d'achat, suivre les budgets en temps réel, gérer les bons de commande et automatiser le rapprochement des factures fournisseurs. C'est l'outil idéal pour structurer votre processus achats sans la complexité d'un ERP."
  },
  {
    question: "Comment Sapajoo améliore-t-il le contrôle budgétaire pour les TPE ?",
    answer: "Sapajoo offre une visibilité complète sur vos enveloppes budgétaires avec des alertes de dépassement, des tableaux de bord intuitifs et des rapports détaillés. Chaque dépense est affectée à un budget spécifique, permettant un suivi précis et évitant les surprises en fin de mois. Les TPE peuvent ainsi piloter leur trésorerie comme les grandes entreprises."
  },
  {
    question: "Sapajoo est-il adapté aux besoins d'une direction financière à temps partagé ?",
    answer: "Absolument. Sapajoo est particulièrement adapté aux DAF à temps partagé qui interviennent dans plusieurs entreprises. L'interface centralisée permet de superviser plusieurs entités, d'accéder rapidement aux indicateurs clés et de générer les écritures de cut-off comptable en quelques clics. Un gain de temps considérable pour les professionnels de la finance externalisée."
  },
  {
    question: "Quels outils de pilotage financier propose Sapajoo ?",
    answer: "Sapajoo propose des tableaux de bord personnalisables, des rapports de suivi budgétaire, des indicateurs de performance fournisseurs, un simulateur de cut-off pour les arrêtés comptables, et des exports vers votre logiciel comptable. Ces outils de pilotage permettent une prise de décision éclairée basée sur des données fiables et à jour."
  },
  {
    question: "Comment fonctionne le processus de procurement dans Sapajoo ?",
    answer: "Le processus de procurement dans Sapajoo suit un workflow structuré : création de la demande d'achat, validation selon les seuils définis, génération du bon de commande, réception et rapprochement de la facture fournisseur. Chaque étape est tracée et les fournisseurs peuvent accéder à un portail dédié pour soumettre leurs factures directement."
  },
  {
    question: "Quelle est la différence entre Sapajoo et un ERP traditionnel ?",
    answer: "Contrairement aux ERP complexes et coûteux, Sapajoo se concentre sur l'essentiel : la gestion des achats et le contrôle budgétaire. Pas de modules superflus, une prise en main rapide et un tarif adapté aux TPE/PME. Vous bénéficiez d'un process achats robuste sans les contraintes d'implémentation et de formation des solutions traditionnelles."
  },
  {
    question: "Comment Sapajoo sécurise-t-il les données financières et les coordonnées bancaires ?",
    answer: "La sécurité est notre priorité. Toutes les données sensibles, notamment les coordonnées bancaires des fournisseurs, sont chiffrées avec l'algorithme AES-256. L'accès est contrôlé par des politiques de sécurité strictes (RLS) et chaque utilisateur ne voit que les données auxquelles il a droit. Vos données sont hébergées sur des infrastructures européennes conformes au RGPD."
  },
  {
    question: "Peut-on générer des fichiers de virement SEPA avec Sapajoo ?",
    answer: "Oui, Sapajoo permet de générer des navettes de virements au format XML SEPA directement depuis les factures validées. Les coordonnées bancaires des fournisseurs sont vérifiées et sécurisées, garantissant des paiements fiables. Cette fonctionnalité simplifie considérablement le processus de règlement fournisseurs."
  }
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-20 px-4 md:px-8 lg:px-16 bg-white/50">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Questions fréquentes
          </h2>
          <p className="text-gray-600 text-lg">
            Tout ce que vous devez savoir sur la gestion des achats et le contrôle budgétaire avec Sapajoo
          </p>
        </div>
        
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-white rounded-lg shadow-sm border border-gray-100 px-6"
            >
              <AccordionTrigger className="text-left font-medium text-primary hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-5 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
