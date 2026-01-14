# 👥 Gestion des utilisateurs par Board

## 📋 Description

Système complet de gestion des membres pour chaque board dans EpiTrello. Permet d'assigner des utilisateurs aux boards avec différents rôles et permissions.

## 🗃️ Migration de la base de données

### Appliquer la migration

Le schéma Prisma a été mis à jour avec une nouvelle table `BoardMember`. Pour appliquer les changements :

```bash
cd frontend
npx prisma generate
npx prisma db push
```

Ou si vous utilisez Docker :

```bash
docker-compose exec app npx prisma generate
docker-compose exec app npx prisma db push
```

### Nouveau modèle

```prisma
model BoardMember {
  id         Int      @id @default(autoincrement())
  board_id   Int
  user_id    Int
  role       String   @default("member") // owner, admin, member, viewer
  addedAt    DateTime @default(now())

  board Board @relation(fields: [board_id], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([board_id, user_id])
}
```

## 🚀 Fonctionnalités

### 1. **API Endpoints**

#### Lister les membres d'un board
```
GET /api/dashboard/board/[boardId]/members
```

#### Ajouter un membre
```
POST /api/dashboard/board/[boardId]/members
Body: { user_id: number, role: string }
```

#### Modifier le rôle d'un membre
```
PUT /api/dashboard/board/[boardId]/members/[memberId]
Body: { role: string }
```

#### Retirer un membre
```
DELETE /api/dashboard/board/[boardId]/members/[memberId]
```

#### Rechercher des utilisateurs
```
GET /api/dashboard/users/search?q=query&boardId=id
```

### 2. **Interface utilisateur**

Page de gestion accessible via :
```
/dashboard/board/[id]/members
```

Ou depuis le board via le bouton **Membres** (icône Users) dans le header.

### 3. **Rôles disponibles**

- **Owner** - Propriétaire avec tous les droits
- **Admin** - Administration et gestion complète
- **Member** - Membre avec droits d'édition
- **Viewer** - Lecture seule

### 4. **Fonctionnalités clés**

✅ Recherche en temps réel d'utilisateurs
✅ Ajout de membres avec attribution de rôle
✅ Modification du rôle d'un membre existant
✅ Suppression de membres du board
✅ Affichage du nombre de workspaces et boards par membre
✅ Protection contre les doublons (contrainte unique)
✅ Suppression en cascade si l'utilisateur ou le board est supprimé

## 📱 Utilisation

1. **Ouvrir un board**
2. **Cliquer sur l'icône Users** dans le header
3. **Ajouter des membres** :
   - Cliquer sur "Ajouter un membre"
   - Rechercher l'utilisateur par nom ou email
   - Sélectionner le rôle
   - Cliquer sur "Ajouter"
4. **Gérer les membres** :
   - Modifier le rôle via le dropdown
   - Retirer avec l'icône poubelle

## 🔒 Sécurité

- Authentification JWT requise sur toutes les routes
- Vérification que l'utilisateur a accès au board
- Protection contre l'auto-suppression via l'admin
- Validation des données entrantes

## 📦 Fichiers créés

```
frontend/
├── prisma/
│   └── schema.prisma (modifié)
├── app/
│   ├── api/
│   │   └── dashboard/
│   │       ├── board/[boardId]/
│   │       │   └── members/
│   │       │       ├── route.ts (GET, POST)
│   │       │       └── [memberId]/
│   │       │           └── route.ts (PUT, DELETE)
│   │       └── users/
│   │           └── search/
│   │               └── route.ts (GET)
│   └── dashboard/
│       └── board/[id]/
│           ├── page.tsx (modifié - ajout bouton Members)
│           └── members/
│               └── page.tsx
```

## 🎨 Captures d'écran

- Tableau listant tous les membres avec leurs rôles
- Dialog de recherche et ajout de membres
- Dropdown pour modifier les rôles
- Bouton de suppression pour retirer des membres
