// Contenu éditorial du wizard « Aidez-moi à choisir » (méthode de reconnaissance).
// Règle copy : aucun terme comptable sur les écrans de questions ; le nom
// technique n'apparaît qu'en petit texte gris sur l'écran de résultat.
// On parle toujours de « ce budget », jamais de « votre entreprise ».

export type WizardPath = 'A' | 'B1' | 'B2' | 'B3' | 'B4' | 'C' | 'D' | 'E';

export interface WizardCard {
  key: string;
  title: string;
  subtitle: string;
}

export const Q1 = {
  title: 'Ce budget, il correspond à quoi ?',
  subtitle: 'Choisissez la situation qui ressemble le plus à la vôtre.',
  cards: [
    {
      key: 'A',
      title: 'Je vends quelque chose, je livre, c’est terminé',
      subtitle:
        'Vente de produits, dépannage, formation d’une journée. Une fois livré, l’affaire est réglée.',
    },
    {
      key: 'B',
      title: 'Je vends un projet qui va durer',
      subtitle:
        'Chantier, mission de conseil, développement d’un site. Plusieurs semaines ou mois de travail avant la fin.',
    },
    {
      key: 'C',
      title: 'Je vends un abonnement ou un contrat dans la durée',
      subtitle:
        'Logiciel au mois, contrat de maintenance, location. Le client paie pour une période et a droit au service pendant toute cette période.',
    },
    {
      key: 'D',
      title: 'Je vends un pack avec un nombre précis de séances ou d’interventions',
      subtitle:
        '10 consultations, 5 audits, 8 séances de coaching. Chaque acte réalisé « consomme » une part du pack.',
    },
    {
      key: 'E',
      title: 'Aucun de ces cas — je veux juste suivre l’argent qui entre et qui sort de la banque',
      subtitle:
        'Vous ne voulez pas vous compliquer la vie : un euro compte quand il est encaissé ou décaissé.',
    },
  ] as WizardCard[],
};

export const Q2 = {
  title: 'Comment voit-on que votre projet avance ?',
  subtitle: 'Qu’est-ce qui reflète le mieux sa progression ?',
  cards: [
    {
      key: 'B1',
      title: 'Ce sont les dépenses que j’engage au fil de l’eau',
      subtitle:
        'Plus j’achète de matériaux et paie de sous-traitants, plus le projet avance. Typique du BTP, de la production.',
    },
    {
      key: 'B2',
      title: 'C’est le temps que mon équipe y passe',
      subtitle:
        'Le projet avance au rythme des heures travaillées. Typique du conseil, des études, du développement.',
    },
    {
      key: 'B3',
      title: 'Ce sont des étapes prévues au contrat et validées par le client',
      subtitle:
        'Maquette validée, prototype livré, recette signée… Le contrat prévoit des paliers précis.',
    },
    {
      key: 'B4',
      title: 'Honnêtement, on ne sait vraiment qu’à la fin',
      subtitle:
        'Projet court ou trop incertain pour mesurer en cours de route. Vous préférez tout compter une fois terminé.',
    },
  ] as WizardCard[],
};

export interface WizardResult {
  path: WizardPath;
  /** code de la table recognition_methods */
  methodCode: string;
  /** libellé courant — aussi utilisé pour enrichir la picklist */
  friendlyLabel: string;
  resultTitle: string;
  whatSapajooDoes: string;
  expenses: string;
  example: string;
  warning?: string;
  /** R8 : encart visible d'emblée, jamais replié */
  warningProminent?: boolean;
  /** R6 : option avancée commissions / publicité (CAC) */
  hasCacOption?: boolean;
  /** nom technique affiché en petit texte gris + suffixe picklist */
  technicalName: string;
}

export const WIZARD_RESULTS: Record<WizardPath, WizardResult> = {
  A: {
    path: 'A',
    methodCode: 'point_in_time',
    friendlyLabel: 'Vente ponctuelle',
    resultTitle: 'Vente ponctuelle',
    whatSapajooDoes:
      'À chaque vente livrée, le chiffre d’affaires est compté immédiatement, en totalité.',
    expenses:
      'Le coût de ce que vous avez vendu est compté au même moment. Vous voyez tout de suite ce que chaque vente vous rapporte vraiment.',
    example:
      'Vous vendez pour 1 000 € un produit qui vous a coûté 600 €. À la livraison : +1 000 € de ventes, −600 € de coûts, marge visible immédiatement : 400 €.',
    technicalName: 'Point-of-sale / Point-in-time',
  },
  B1: {
    path: 'B1',
    methodCode: 'poc_cost_to_cost',
    friendlyLabel: 'Projet mesuré par les dépenses',
    resultTitle: 'Projet mesuré par les dépenses',
    whatSapajooDoes:
      'Le chiffre d’affaires du projet est compté au rythme de vos dépenses. Si vous avez engagé 30 % des coûts prévus, 30 % du prix de vente est compté.',
    expenses:
      'Elles sont comptées telles quelles, au fil de l’eau — ce sont elles qui font avancer le compteur.',
    example:
      'Projet vendu 10 M€, coûts prévus 8 M€. Vous avez dépensé 2,4 M€ (soit 30 %) → Sapajoo compte 3 M€ de chiffre d’affaires.',
    warning:
      'Ce mode nécessite un budget de coûts prévisionnel fiable. Vous pourrez l’ajuster en cours de projet.',
    technicalName: 'PoC — Cost-to-cost',
  },
  B2: {
    path: 'B2',
    methodCode: 'poc_efforts',
    friendlyLabel: 'Projet mesuré par le temps passé',
    resultTitle: 'Projet mesuré par le temps passé',
    whatSapajooDoes:
      'Le chiffre d’affaires est compté au rythme des heures travaillées par rapport aux heures prévues.',
    expenses:
      'Les heures pointées valorisent en même temps l’avancement et le coût du projet.',
    example:
      'Projet vendu 500 K€, 1 000 h prévues. Votre équipe a fait 350 h (35 %) → Sapajoo compte 175 K€ de chiffre d’affaires.',
    warning: 'Ce mode nécessite un suivi des temps (pointage des heures par projet).',
    technicalName: 'PoC — Efforts expended',
  },
  B3: {
    path: 'B3',
    methodCode: 'poc_milestone',
    friendlyLabel: 'Projet par étapes validées',
    resultTitle: 'Projet par étapes contractuelles',
    whatSapajooDoes:
      'Rien n’est compté entre deux étapes. Quand une étape est validée, la part de chiffre d’affaires correspondante est comptée d’un coup.',
    expenses:
      'Elles s’accumulent « en attente » et sortent en même temps que chaque étape. Vous voyez la marge réelle de chaque palier.',
    example:
      'Contrat prévoyant l’étape 2 à 35 % d’un projet de 10 M€. Étape 2 validée → +3,5 M€ de chiffre d’affaires + toutes les dépenses accumulées depuis l’étape 1.',
    technicalName: 'PoC — Milestone method',
  },
  B4: {
    path: 'B4',
    methodCode: 'completed_contract',
    friendlyLabel: 'Projet compté à la fin',
    resultTitle: 'Tout à la fin',
    whatSapajooDoes:
      'Rien n’est compté pendant le projet. À la fin, tout le chiffre d’affaires et toutes les dépenses sortent en une fois.',
    expenses:
      'Elles sont mises de côté pendant le projet, puis comptées avec le chiffre d’affaires final.',
    example:
      'Projet 50 K€ terminé au mois 3, avec 45 K€ de dépenses accumulées → au mois 3 : +50 K€ et −45 K€ d’un coup.',
    warning:
      'Simple, mais vos tableaux de bord seront « plats » pendant le projet puis feront un pic à la fin. À réserver aux projets courts.',
    technicalName: 'Completed contract',
  },
  C: {
    path: 'C',
    methodCode: 'over_time_linear',
    friendlyLabel: 'Abonnement / contrat dans la durée',
    resultTitle: 'Abonnement / contrat dans la durée',
    whatSapajooDoes:
      'Le montant du contrat est étalé régulièrement sur sa durée. Un abonnement annuel de 12 000 € = 1 000 € comptés chaque mois.',
    expenses:
      'Les coûts liés au service (hébergement, licences…) sont étalés au même rythme. Automatique.',
    example:
      'Abonnement 12 K€/an → 1 K€ de chiffre d’affaires par mois + 200 €/mois d’hébergement + 3 K€ de commission commerciale comptés tout de suite (ou étalés si option avancée).',
    hasCacOption: true,
    technicalName: 'Over time — Straight-line',
  },
  D: {
    path: 'D',
    methodCode: 'proportional',
    friendlyLabel: 'Pack d’actes',
    resultTitle: 'Pack d’actes',
    whatSapajooDoes:
      'Chaque acte réalisé compte sa part du prix du pack. 4 séances faites sur 10 = 40 % du prix compté.',
    expenses: 'Le coût de chaque acte est compté au moment où il est réalisé.',
    example:
      'Pack de 10 consultations vendu 5 K€, coût de 300 € par consultation. 4 réalisées → +2 K€ de chiffre d’affaires, −1 200 € de coûts.',
    technicalName: 'Proportional performance',
  },
  E: {
    path: 'E',
    methodCode: 'collection',
    friendlyLabel: 'Suivi banque',
    resultTitle: 'Suivi banque',
    whatSapajooDoes:
      'Le chiffre d’affaires est compté uniquement quand le client vous a payé. Pas avant.',
    expenses:
      'Comptées uniquement quand vous avez réellement payé vos fournisseurs. Jamais à la réception de la facture.',
    example:
      'Facture client de 10 K€ envoyée en janvier, payée en mars → le chiffre d’affaires apparaît en mars.',
    warning:
      'C’est le mode le plus simple, mais le moins précis : vos chiffres refléteront votre trésorerie, pas votre activité réelle, et ne seront pas comparables à une comptabilité classique. Recommandé uniquement pour les très petites structures ou les budgets de suivi de trésorerie.',
    warningProminent: true,
    technicalName: 'Cash basis / Collection method',
  },
};

export const CAC_OPTION = {
  title: 'Option avancée',
  body:
    'Vous payez des commissions ou de la publicité pour décrocher ce type de contrat ? Par défaut, ces coûts sont comptés immédiatement (simple et prudent — recommandé). Vous pouvez choisir de les étaler sur la durée du contrat. À réserver aux équipes accompagnées d’un comptable.',
  immediate: 'Compter tout de suite (recommandé)',
  spread: 'Étaler sur la durée du contrat',
};

/** Libellé courant par code, pour la picklist enrichie « Libellé — Nom technique ». */
export const METHOD_FRIENDLY_LABELS: Record<string, { friendly: string; technical: string }> =
  Object.fromEntries(
    Object.values(WIZARD_RESULTS).map(r => [
      r.methodCode,
      { friendly: r.friendlyLabel, technical: r.technicalName },
    ])
  );

/** Lignes du tableau récapitulatif « Je ne sais pas » (8 situations). */
export const OVERVIEW_ROWS: { path: WizardPath; situation: string; example: string }[] = [
  { path: 'A', situation: Q1.cards[0].title, example: Q1.cards[0].subtitle },
  {
    path: 'B1',
    situation: 'Projet qui dure, mesuré par mes dépenses',
    example: Q2.cards[0].subtitle,
  },
  {
    path: 'B2',
    situation: 'Projet qui dure, mesuré par le temps passé',
    example: Q2.cards[1].subtitle,
  },
  {
    path: 'B3',
    situation: 'Projet qui dure, avec des étapes validées par le client',
    example: Q2.cards[2].subtitle,
  },
  {
    path: 'B4',
    situation: 'Projet qui dure, qu’on ne sait mesurer qu’à la fin',
    example: Q2.cards[3].subtitle,
  },
  { path: 'C', situation: Q1.cards[2].title, example: Q1.cards[2].subtitle },
  { path: 'D', situation: Q1.cards[3].title, example: Q1.cards[3].subtitle },
  { path: 'E', situation: Q1.cards[4].title, example: Q1.cards[4].subtitle },
];
