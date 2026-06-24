# Deferred Work

## Deferred from: code review of 1-2-bibliotheque-de-composants-ui-de-base (2026-06-22)

- **`hover:text-white` dans Button primaire** — `text-white` hors palette Cocon ; à remplacer par `text-background` ou `text-surface` une fois le MVP complet. Raison du report : réaliser l'ensemble du MVP avant de corriger ce genre de détail.

- **`import.meta.dirname` dans vitest.config.ts** — compatible Node ≥ 21.2 seulement ; CI sur Node 18/20 LTS planterait. Utiliser `fileURLToPath(new URL('.', import.meta.url))` quand la compatibilité Node LTS devient nécessaire.
- **Button et Input ne forwardent pas les refs** — nécessaire pour les librairies de formulaires (React Hook Form, etc.) et la gestion impérative du focus. À ajouter quand les premiers formulaires seront implémentés (stories 2.x).
- **vitest.config.ts sans pattern `include` explicite** — sans `include: ['src/**/*.test.*']`, la config est fragile si un package publié dans `node_modules` contient des fichiers de test. Risque faible actuellement.
- **Input sans `aria-describedby`** — l'interface `InputProps` n'expose pas de prop `errorMessage` ni de `aria-describedby`. Nécessitera un refacto d'API quand la validation sera ajoutée (stories 2.x). Anticiper dès la story de création de repas.
- **Chip — catégorie de variante non annoncée aux lecteurs d'écran** — `<Chip variant="allergie">Arachides</Chip>` annonce "Arachides" sans contexte de catégorie. Le consumer devra fournir un libellé explicite ou un `aria-label` portant la catégorie (ex. "Arachides — allergie"). À documenter dans la story qui introduit les listes de chips.
