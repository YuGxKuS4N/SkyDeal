# SkyDeal Google Flights Helper

SkyDeal est une extension Chrome qui facilite la recherche de vols sur Google Flights en automatisant le remplissage des champs de recherche et le refus des cookies.

## Fonctionnalités principales
- **Remplissage automatique** : Saisie automatique de la ville/pays de départ et d'arrivée, ainsi que des dates de voyage, directement dans Google Flights.
- **Refus automatique des cookies** : Refus des popups de consentement Google pour une expérience fluide.
- **Interface conviviale** : Popup simple pour saisir les informations de voyage (ville, pays, dates, flexibilité).
- **Ouverture en navigation privée** : Lance Google Flights dans une nouvelle fenêtre incognito pour éviter les interférences de session.

## Utilisation
1. Installez l’extension dans Chrome (mode développeur).
2. Cliquez sur l’icône SkyDeal dans la barre d’extensions.
3. Remplissez les champs :
   - Ville et pays de départ
   - Ville et pays d’arrivée
   - Dates de départ et de retour (avec flexibilité)
4. Cliquez sur "Rechercher".
5. Google Flights s’ouvre, les champs sont remplis automatiquement et la recherche est lancée.

## Fichiers principaux
- `manifest.json` : Déclaration de l’extension et des permissions.
- `popup.html` / `popup.js` : Interface utilisateur pour saisir les informations de vol.
- `background.js` : Logique principale, ouverture de la fenêtre et injection des scripts.
- `content.js` : Automatisation sur la page Google Flights (remplissage, refus cookies).

## Permissions requises
- `scripting`, `tabs`, `activeTab` : Pour injecter des scripts et contrôler les onglets.
- Accès aux pages Google Flights et consentement Google.

## Installation (mode développeur)
1. Ouvrez `chrome://extensions/` dans Chrome.
2. Activez le mode développeur.
3. Cliquez sur "Charger l’extension non empaquetée" et sélectionnez le dossier du projet.

## Limitations
- Fonctionne uniquement sur Google Chrome.
- Peut nécessiter des ajustements si Google modifie la structure de ses pages.

## Auteurs
- Développé par Rayan MADJID

---
Extension open-source, à utiliser à des fins personnelles uniquement.