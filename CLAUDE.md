# Inkmap — Annuaire tatoueurs par style/ville

Site statique HTML, SEO programmatique, déployé sur Vercel.
Langue du site : français.

## Skill Router

**À chaque requête utilisateur**, identifie si un skill installé correspond. Si oui :
1. Lis UNIQUEMENT le fichier `.claude/skills/<nom>/SKILL.md` correspondant
2. Applique ses instructions pour exécuter la tâche
3. Ne charge JAMAIS plusieurs skills en même temps sauf demande explicite

**Index de routage** (keyword → skill) :

| Mots-clés dans la requête | Skill à charger |
|---|---|
| seo, audit seo, ranking, indexation, balises meta | `seo-audit` |
| pages programmatiques, seo scale, pages auto | `programmatic-seo` |
| schema, structured data, rich snippet, json-ld | `schema-markup` |
| architecture site, arborescence, maillage interne | `site-architecture` |
| ia seo, aeo, geo, chatgpt ranking, perplexity | `ai-seo` |
| homepage, page accueil, hero, conversion accueil | `homepage-audit` |
| formulaire, inscription, signup, form | `form-cro` |
| optimiser page, cro page, conversion page | `page-cro` |
| cro, conversion, taux conversion, audit cro | `cro-methodology` |
| copy, rédaction, texte, headline, cta, accroche | `copywriting` |
| stratégie contenu, piliers, calendrier éditorial | `content-strategy` |
| humaniser, ton naturel, dé-ia, réécrire naturel | `de-ai-ify` |
| design, redesign, refonte visuelle, award | `top-design` |
| ui, espacement, hiérarchie, couleurs, typo | `refactoring-ui` |
| parcours utilisateur, user flow, click path | `click-path-audit` |
| animation, micro-interaction, transition, hover | `microinteractions` |
| tracking, analytics, ga4, événements, mixpanel | `analytics-tracking` |
| sécurité, xss, injection, auth, api sécurité | `security-review` |
| lead magnet, aimant, pdf gratuit, guide gratuit | `lead-magnets` |
| lancement, launch, go-to-market | `launch-strategy` |
| parrainage, referral, inviter ami | `referral-program` |
| clean code, qualité code, refactor code | `clean-code` |
| composant, react, frontend, pattern frontend | `frontend-patterns` |

Si aucun skill ne matche → répondre normalement sans charger de skill.

## Règles projet
- Ne jamais inventer de faux profils/données en production
- Toujours écrire en français pour le contenu visible du site
