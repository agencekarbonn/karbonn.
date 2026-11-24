# AgenceV12 — notes projet

Site statique (HTML/CSS/JS sans framework) + fonction Appwrite pour la connexion.

## Lancer en local

- `python3 -m http.server 8000` depuis la racine, puis http://localhost:8000

## Vérifications

- Syntaxe JS : `node --check <fichier>.js` (script.js, quote.js, footer.js, connexion.js…)
- Fonction de connexion : `cd functions/login-guard && npm install && npm test`
- Moteur + traductions de la page Services : `node --test tests/*.test.mjs` (depuis la racine)
- Fonction brief-parser : `cd functions/brief-parser && npm test`

## Page Services (assistant de projet)

- `services.html` / `services.css` / `services.js` + `services-engine.js` (questions, grille tarifaire PROVISOIRE dans `PRICING`, faisabilité), `services-i18n.js`, `services-scene.js` (WebGL brut).
- Les prix sont toujours calculés par `services-engine.js`, jamais par l'IA. L'IA (fonction `functions/brief-parser`, Gemini gratuit) ne fait qu'extraire un brief du texte libre ; si `briefFunctionId` est vide dans `appwrite-config.js`, seul le parseur local `parseLocal` est utilisé.
- Les listes de valeurs de `functions/brief-parser/src/main.js` (`ENUMS`) doivent rester identiques à celles du moteur (un test le vérifie).
- La fin du parcours ouvre la modale de devis préremplie via `openQuoteWith()` (quote.js).
- Navigation entre pages : attribut `data-href` sur les liens de la nav + `data-page` sur `<body>`.

## Connexion (Appwrite + Mailgun)

- Page : `connexion.html` / `connexion.css` / `connexion.js` (+ `connexion-i18n.js`, `appwrite-config.js` public).
- Le lien « Contactez-nous » ouvre la modale de devis (`quote.js`, chargé en defer AVANT `connexion.js` : le module lit le `QUOTE_I18N` global du script classique et le fusionne dans `AUTH_I18N`). `quote.js` fonctionne sans les globales de `script.js` : dictionnaire de repli, popover `.talk` facultatif, langue lue via `document.documentElement.lang`. `connexion.js` expose `window.reducedMotion` et dispatche `langchange`.
- Fonction serveur : `functions/login-guard` (seule à vérifier le mot de passe, décider du code OTP, envoyer l'email Mailgun et émettre le jeton de session).
- Tables : `npm run setup` dans `functions/login-guard` (variables APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY).
- Ne jamais mettre de clé Mailgun ou de clé API Appwrite côté navigateur.

## Écran de chargement et transitions

- `loader.js` (orchestration : compteur, sortie « plongée + iris », transitions, interception des liens internes) + `glass-ribbons.js` (Three.js : deux rubans de verre, bleu `#0C04FF` dense et clair `#CDF2FF` en vraie transmission, mot de la page en contour réfracté derrière).
- Chaque page (index, services, connexion) contient un petit script inline dans `<head>` qui crée `window.karbonnLoader` (`ready`, `resolve`, `leave(href, mot)`) + le balisage `.loader` / `.loader-ring` juste après `<body>`. À reproduire sur toute nouvelle page.
- `script.js` (intro du hero) et `services.js` attendent `karbonnLoader.ready`. Navigation : `karbonnLoader.leave(href, libellé)`.
- Continuité entre pages : `sessionStorage["karbonn:transition"]` (graine, temps, mot). Mouvement réduit : pas de loader ; Three.js indisponible : compteur seul puis iris.

## Demande de devis (page Services)

- Bouton « Demander un devis » → modale `.svc-request` (email obligatoire, téléphone facultatif, champ piège `company`).
- Fonction serveur : `functions/quote-request` (recalcule l'estimation, résumé IA Gemini si `GEMINI_API_KEY`, sinon résumé local ; email à `QUOTE_TO` (défaut hello@karbonn.fr) + accusé de réception client, via Mailgun ; variables `MAILGUN_*` identiques à login-guard).
- Elle embarque une copie de `services-engine.js` et `services-i18n.js` dans `src/shared/` : `npm test` resynchronise (et un test vérifie qu'elles sont identiques). Lancer `npm test` avant chaque déploiement.
- Textes des emails client : clés `mailAck*` dans `services-i18n.js`.

## Conventions

- 7 langues (fr, en, de, es, pt, it, zh) : tout nouveau texte doit être traduit partout.
- Couleurs via les variables CSS (`--ink`, `--paper`, `--accent`, `--accent-soft`).
