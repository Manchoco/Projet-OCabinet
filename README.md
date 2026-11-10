# O'Cabinet — site vitrine 3D

Site statique (HTML, CSS, JavaScript, Three.js en local). Aucune étape de compilation.

- `index.html` — la page
- `css/site.css` — l'identité visuelle
- `js/app.js` — scène 3D, caméra au défilement, bascule psy / pro, formulaires
- `vendor/three.module.min.js` — Three.js 0.170 (licence MIT)
- `assets/img/` — images détourées utilisées par le site (WebP)
- `detourages/` — les mêmes images détourées en PNG pleine qualité (logo, deux têtes, tête-projecteur, poignée de main)
- `assets/favicon.svg` — icône
- `STORYBOARD.md` — le concept et le déroulé plan par plan

## Voir le site en local
```
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000

## Mise en ligne
Le dépôt est relié à Vercel : chaque `git push` sur `main` redéploie le site automatiquement.

## À régler dans `js/app.js`
- `WA` : numéro WhatsApp du cabinet.
- `CONFIG.anonEndpoint` : adresse d'un service de formulaire (POST JSON) pour que les questions
  « sans mon nom » partent sans passer par WhatsApp. Tant que ce champ est vide, la question
  part par WhatsApp et le numéro de l'expéditeur reste visible par le cabinet (le site le dit).
- `WORLDS` : textes projetés, thèmes des programmes, couleurs de la scène.

Les textes des activités sont des propositions à valider par le cabinet.
