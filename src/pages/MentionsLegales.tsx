import React from 'react';
import { Link } from 'react-router-dom';
import FooterSection from '@/components/landing/FooterSection';

const MentionsLegales = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-grow container mx-auto py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-primary hover:underline mb-8">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
                clipRule="evenodd" 
              />
            </svg>
            Retour à l'accueil
          </Link>
          
          <div className="flex justify-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">Mentions Légales</h1>
          </div>
          
          <div className="prose max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-primary">1. Éditeur du site</h2>
              <p>
                Le site www.sapajoo.fr est édité par :<br />
                Société : FOWM<br />
                Forme juridique : SAS (Société par Actions Simplifiée)<br />
                Siège social : 9 rue Milton, 75009 PARIS<br />
                SIREN : 928 508 142<br />
                RCS : PARIS<br />
                Capital social : 1 000 €<br />
                Date de création : 8/04/2024<br />
                Email : hello@sapajoo.fr<br />
                Directeur de la publication : Clément Robin, co-fondateur
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary">2. Hébergement</h2>
              <p>
                Le site www.sapajoo.fr est hébergé par :<br />
                Vercel, Inc., dont le siège social est situé au 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary">3. Propriété intellectuelle</h2>
              <p>
                L'ensemble des éléments constituant le site www.fowm.io (textes, graphismes, logiciels, photographies, images, vidéos, sons, plans, logos, marques, etc.) ainsi que le site lui-même, sont la propriété exclusive de FOWM ou des tiers ayant autorisé FOWM à les utiliser.
              </p>
              <p>
                Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de FOWM.
              </p>
              <p>
                Toute exploitation non autorisée du site ou de l'un quelconque des éléments qu'il contient sera considérée comme constitutive d'une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary">4. Données personnelles</h2>
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés modifiée, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition aux données vous concernant.
              </p>
              <p>
                Ces droits peuvent être exercés en contactant FOWM à l'adresse suivante : contact@fowm.io.
              </p>
              <p>
                Pour plus d'informations sur la gestion de vos données personnelles, veuillez consulter notre Politique de confidentialité.
              </p>
              <p>
                Le délégué à la protection des données de FOWM est : Clément Robin - clement@fowm.io.
              </p>
              <p>
                Vous disposez également du droit d'introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary">5. Cookies</h2>
              <p>
                Le site www.sapajoo.fr peut utiliser des cookies. Ces fichiers stockés sur votre ordinateur permettent d'enregistrer des informations relatives à votre navigation.
              </p>
              <p>
                Pour plus d'informations sur l'utilisation des cookies, veuillez consulter notre Politique de cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary">6. Limitation de responsabilité</h2>
              <p>
                FOWM s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur le présent site, dont elle se réserve le droit de corriger le contenu à tout moment. Toutefois, FOWM ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition sur ce site.
              </p>
              <p>
                FOWM décline toute responsabilité :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Pour toute interruption du site</li>
                <li>Pour toute survenance de bogues</li>
                <li>Pour toute inexactitude ou omission portant sur des informations disponibles sur le site</li>
                <li>Pour tous dommages résultant d'une intrusion frauduleuse d'un tiers ayant entraîné une modification des informations mises à disposition sur le site</li>
                <li>Et plus généralement, pour tout dommage direct ou indirect, quelles qu'en soient les causes, origines, natures ou conséquences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary">7. Liens hypertextes</h2>
              <p>
                Le site www.sapajoo.fr peut contenir des liens vers d'autres sites internet ou d'autres sources d'informations. Dans la mesure où FOWM ne peut contrôler ces sites et ces sources externes, FOWM ne peut être tenue pour responsable de la mise à disposition de ces sites et sources externes, et ne peut supporter aucune responsabilité quant au contenu, publicités, produits, services ou tout autre matériel disponible sur ou à partir de ces sites ou sources externes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary">8. Droit applicable et juridiction compétente</h2>
              <p>
                Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary">9. Contact</h2>
              <p>
                Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à l'adresse suivante : contact@fowm.io
              </p>
            </section>

            <p className="text-sm text-gray-500 text-right">
              Dernière mise à jour : 14/05/2025
            </p>
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
};

export default MentionsLegales;
