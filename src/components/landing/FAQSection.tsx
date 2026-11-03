import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: "Qu'est-ce que Sapajoo, et à quoi sert-il\u00a0?",
    answer: "Sapajoo est une solution SaaS de gestion des achats et du contrôle budgétaire conçue pour les TPE et PME. Elle permet de centraliser les demandes d'achat, suivre les budgets en temps réel, gérer les bons de commande et automatiser le rapprochement des factures fournisseurs. C'est l'outil idéal pour structurer votre processus d'achat sans la complexité d'un ERP."
  },
  {
    question: "Quelle différence entre Sapajoo et un ERP\u00a0?",
    answer: "Contrairement aux ERP complexes et coûteux, Sapajoo se concentre sur l'essentiel\u00a0: la gestion des achats et le contrôle budgétaire. Pas de modules superflus, une prise en main rapide et un tarif adapté aux TPE/PME. Vous bénéficiez d'un processus d'achat robuste sans les contraintes d'implémentation et de formation des solutions traditionnelles."
  },
  {
    question: "Comment Sapajoo protège-t-il mes données financières et bancaires\u00a0?",
    answer: "La sécurité est notre priorité. Toutes les données sensibles, notamment les coordonnées bancaires des fournisseurs, sont chiffrées avec l'algorithme AES-256. L'accès est contrôlé par des politiques de sécurité strictes (RLS) et chaque utilisateur ne voit que les données auxquelles il a droit. Vos données sont hébergées sur des infrastructures européennes conformes au RGPD."
  },
  {
    question: "Comment Sapajoo améliore-t-il le contrôle budgétaire des TPE\u00a0?",
    answer: "Sapajoo offre une visibilité complète sur vos enveloppes budgétaires avec des alertes de dépassement, des tableaux de bord intuitifs et des rapports détaillés. Chaque dépense est affectée à un budget spécifique, permettant un suivi précis et évitant les surprises en fin de mois. Les TPE peuvent ainsi piloter leur trésorerie comme les grandes entreprises."
  },
  {
    question: "Sapajoo convient-il à une direction financière à temps partagé\u00a0?",
    answer: "Absolument. Sapajoo est particulièrement adapté aux DAF à temps partagé qui interviennent dans plusieurs entreprises. L'interface centralisée permet de superviser plusieurs entités, d'accéder rapidement aux indicateurs clés et de générer les écritures de cut-off comptable en quelques clics. Un gain de temps considérable pour les professionnels de la finance externalisée."
  },
  {
    question: "Quels outils de pilotage financier propose Sapajoo\u00a0?",
    answer: "Sapajoo propose des tableaux de bord personnalisables, des rapports de suivi budgétaire, des indicateurs de performance fournisseurs, un simulateur de cut-off pour les arrêtés comptables, et des exports vers votre logiciel comptable. Ces outils de pilotage permettent une prise de décision éclairée basée sur des données fiables et à jour."
  },
  {
    question: "Comment fonctionne le processus d'achat dans Sapajoo\u00a0?",
    answer: "Le processus d'achat dans Sapajoo suit un circuit structuré\u00a0: création de la demande d'achat, validation selon les seuils définis, génération du bon de commande, réception et rapprochement de la facture fournisseur. Chaque étape est tracée et les fournisseurs peuvent accéder à un portail dédié pour soumettre leurs factures directement."
  },
  {
    question: "Peut-on générer des fichiers de virement SEPA avec Sapajoo\u00a0?",
    answer: "Oui, Sapajoo permet de générer des navettes de virements au format XML SEPA directement depuis les factures validées. Les coordonnées bancaires des fournisseurs sont vérifiées et sécurisées, garantissant des paiements fiables. Cette fonctionnalité simplifie considérablement le processus de règlement fournisseurs."
  }
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-20 px-4 md:px-8 lg:px-16 bg-white/50">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl text-primary mb-4">
            Questions fréquentes
          </h2>
          <p className="text-muted-foreground text-lg">
            Tout savoir sur la gestion des achats et le contrôle budgétaire avec Sapajoo.
          </p>
        </div>
        
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-white rounded-lg shadow-sm border border-border px-6"
            >
              <AccordionTrigger className="text-left font-medium text-primary hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
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
