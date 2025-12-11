# ImmoNext Platform

Plateforme Next.js + Prisma + PostgreSQL (Supabase) pour gérer des agences immobilières
et leurs annonces à l'échelle mondiale.

## Installation

```bash
npm install
```

## Configuration

Crée un fichier **.env.local** à la racine :

```env
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.yubklhoxljrwkynqxyzm.supabase.co:5432/postgres?sslmode=require"
```

> Remplace **[YOUR_PASSWORD]** par le mot de passe réel de ta base Supabase.

## Migrations Prisma

```bash
npx prisma migrate dev --name init_immonext
```

## Lancer le projet

```bash
npm run dev
```

- `/` : tableau de bord
- `/agences` : gestion des agences (CRUD basique create + list)
- `/annonces` : gestion des annonces reliées à une agence


les améliorations  :

ajouter des badges de pays / type sur les cartes,

ou préparer la version publique 100% anonyme (sans login) pour plus tard, après ton déploiement.

