# OlivePress

Application de gestion d'huilerie d'huile d'olive, composée de trois applications :

- **backend** — API REST Spring Boot (Java 21)
- **web** — interface React 19 + Vite + TypeScript
- **mobile** — application Expo / React Native (TypeScript)

L'application couvre le circuit complet : réception des apports d'olives, production (rendement), stockage de l'huile, livraisons aux clients et facturation avec suivi des paiements. Les droits sont vérifiés côté serveur (rôles/permissions) ; les interfaces sont en français (et arabe sur mobile).

---

## Architecture

```
olivepress/
├── backend/                      # API REST Spring Boot 3.3.5 (Java 21)
│   ├── src/main/java/com/olivepress/
│   │   ├── domain/               # Entités JPA
│   │   ├── repository/           # Spring Data JPA
│   │   ├── service/              # Logique métier
│   │   ├── web/                  # Contrôleurs REST (/api/...)
│   │   ├── security/             # JWT + permissions (@RequirePermission) + anti brute-force
│   │   ├── dto/                  # Objets d'échange
│   │   ├── exception/            # Gestion d'erreurs globale
│   │   └── config/               # SecurityConfig, DataSeeder
│   ├── src/main/resources/db/migration/   # Migrations Flyway (V1__init.sql, V2__push_tokens.sql)
│   ├── docs/schema.sql           # Schéma PostgreSQL de référence (obsolète : source de vérité = Flyway)
│   └── pom.xml
├── web/                          # Interface web (React 19 + Vite 6 + TypeScript)
│   ├── src/
│   │   ├── api/                  # Client axios + services
│   │   ├── auth/                 # Contexte d'authentification
│   │   ├── components/           # Composants réutilisables
│   │   ├── screens/              # Écrans
│   │   └── i18n/                 # Traductions (fr / ar)
│   ├── eslint.config.js          # ESLint (flat config)
│   └── .prettierrc.json          # Prettier
├── mobile/                       # Application Expo / React Native
│   ├── App.tsx                   # Point d'entrée
│   ├── src/navigation/           # Navigateur (stack + onglets)
│   ├── src/screens/              # Écrans
│   ├── src/components/           # Composants réutilisables (thème olive)
│   ├── src/api/                  # Client axios + services + cache hors-ligne
│   ├── src/auth/                 # Contexte d'authentification
│   ├── src/utils/                # PDF, notifications push
│   └── src/theme/                # Palette olive / crème
├── docker-compose.yml            # PostgreSQL 16 + backend
└── .env.example                  # Variables d'environnement (modèle)
```

- **Backend** : Spring Boot 3.3.5, Java 21, Spring Data JPA, Spring Security + JWT (`jjwt` 0.12.6), Flyway, H2 (dev/test) / PostgreSQL (prod).
- **Web** : React 19, Vite 6, TypeScript 5.7, React Router 7, axios, lucide-react.
- **Mobile** : Expo SDK 57, React Native 0.86, React 19, React Navigation v7, TypeScript, axios, AsyncStorage, NetInfo, expo-notifications.

---

## Prérequis

- **Java 21** (`JAVA_HOME` pointant vers le JDK 21)
- **Maven 3.9+** (ou le wrapper/téléchargement local)
- **Node.js 20+** et **npm**
- *(optionnel)* **PostgreSQL 14+** pour la base de production ; sinon le profil `h2` suffit pour le développement.
- **Expo Go** (SDK 57, dernière version) sur téléphone, ou un émulateur Android / simulateur iOS.

---

## Backend

### Lancer en développement (base H2 en mémoire, sans PostgreSQL)

Démarre l'API avec un jeu de données de démonstration (clients, apports, production, factures) :

```powershell
# depuis backend/
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

- API : `http://localhost:8091/api`
- Console H2 : `http://localhost:8091/h2-console` (JDBC URL `jdbc:h2:mem:olivepress`, user `sa`, sans mot de passe)

> Le port par défaut est `8091`. Surchargez-le avec `--server.port=XXXX` si besoin.

### Lancer avec PostgreSQL

Le backend est configuré par défaut pour se connecter à
`jdbc:postgresql://localhost:5433/olivepress_app` (utilisateur/mot de passe `olivepress`/`olivepress`).

#### Option Docker (recommandée en local)

Un fichier `docker-compose.yml` fournit PostgreSQL 16 + le backend. Copiez d'abord le modèle d'environnement :

```powershell
# depuis olivepress/
cp .env.example .env    # puis renseignez OLIVEPRESS_JWT_SECRET et OLIVEPRESS_DB_PASSWORD
docker compose up --build
```

> ⚠️ Le port 5432 de votre machine peut déjà être occupé par une autre base ; le conteneur expose donc PostgreSQL sur **5433**.

#### Option PostgreSQL local (hors Docker)

```sql
CREATE USER olivepress WITH ENCRYPTED PASSWORD 'olivepress';
CREATE DATABASE olivepress_app OWNER olivepress;
```

Puis pointez le backend dessus via `OLIVEPRESS_DB_URL` (ex. `jdbc:postgresql://localhost:5432/olivepress_app`).

#### Démarrage

```powershell
mvn spring-boot:run
```

Le schéma est créé/mis à jour par **Flyway** au démarrage (`db/migration/V*.sql`). Hibernate est en `ddl-auto=validate` : il vérifie que les entités correspondent au schéma, sans le modifier. Le compte administrateur est inséré au premier lancement.

#### Variables d'environnement

| Variable | Rôle | Défaut |
|----------|------|--------|
| `OLIVEPRESS_DB_URL` / `OLIVEPRESS_DB_USER` / `OLIVEPRESS_DB_PASSWORD` | Connexion PostgreSQL | `localhost:5433/olivepress_app`, `olivepress` |
| `OLIVEPRESS_JWT_SECRET` | Clé de signature JWT (**obligatoire en prod**, ≥ 32 caractères ; l'application refuse de démarrer avec la valeur par défaut) | valeur de dev |
| `OLIVEPRESS_JWT_REFRESH_MS` | Durée de vie du refresh token (ms) | `604800000` (7 j) |
| `OLIVEPRESS_CORS_ORIGINS` | Origines web autorisées, séparées par des virgules (jamais de `*`) | `http://localhost:5173,...` |
| `OLIVEPRESS_LOGIN_MAX_ATTEMPTS` | Tentatives de connexion avant blocage (`0` = désactivé) | `5` |
| `OLIVEPRESS_LOGIN_WINDOW_MINUTES` | Fenêtre glissante de limitation (minutes) | `15` |
| `OLIVEPRESS_ADMIN_USER` / `OLIVEPRESS_ADMIN_EMAIL` / `OLIVEPRESS_ADMIN_PASSWORD` / `OLIVEPRESS_ADMIN_NAME` | Compte administrateur initial | `admin` / … / `admin1234` |
| `OLIVEPRESS_PUSH_ENABLED` | Envoi réel des notifications push via Expo (`true`) | `false` |

### Construire le JAR exécutable

```powershell
mvn -DskipTests package
java -jar target/olivepress-backend-1.0.0.jar                       # PostgreSQL (profil par défaut)
java -jar target/olivepress-backend-1.0.0.jar --spring.profiles.active=h2   # H2 en mémoire
```

### Tests

```powershell
mvn test
```

Couvre l'authentification (connexion, rafraîchissement de jeton, changement de mot de passe), les permissions, la facture automatique d'apport et la pagination.

### Comptes de démonstration

| Rôle          | Identifiant | Mot de passe  |
|---------------|-------------|---------------|
| Administrateur| `admin`     | `admin1234`   |
| Employé       | `employe`   | `employe1234` |

Les identifiants admin sont configurables (`olivepress.admin.*`). Le jeu de démonstration (compte employé + données) n'est créé que si `olivepress.seed.demo=true`.

### Principaux points d'entrée de l'API

| Domaine      | Méthodes |
|--------------|----------|
| Auth         | `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`, `POST /api/auth/change-password` |
| Tableau de bord | `GET /api/dashboard` |
| Clients      | `GET /api/clients`, `GET /api/clients/page` (paginé), `GET/POST /api/clients`, `GET/PUT /api/clients/{id}` |
| Apports      | `GET/POST /api/apports`, `PUT /api/apports/{id}`, `PATCH /api/apports/{id}/status`, `GET /api/apports/{id}/ticket`, `GET /api/apports/{id}/history`, `GET /api/apports/by-client/{id}`, `GET /api/apports/recent` |
| Production   | `POST /api/production`, `GET /api/production/by-apport/{id}` |
| Stock        | `GET /api/stock/summary`, `GET /api/stock/movements` (paginé), `POST /api/stock/movements` |
| Livraisons   | `GET/POST /api/livraisons`, `GET /api/livraisons/{id}` |
| Factures     | `GET/POST /api/factures`, `GET /api/factures/{id}`, `GET /api/factures/by-client/{id}`, `GET /api/factures/by-apport/{id}`, `GET/POST /api/factures/{id}/paiements` |
| Paramètres   | `GET/PUT /api/settings/tarif` |
| Employés     | `GET/POST /api/employes`, `PUT /api/employes/{id}`, `PATCH /api/employes/{id}/toggle` |
| Notifications| `GET /api/notifications` (paginé), `GET /api/notifications/unread-count`, `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all` |
| Push         | `POST /api/push/register`, `POST /api/push/unregister` |
| Historique   | `GET /api/historique` |
| Rapports     | `GET /api/rapports?type=global|reception|production|stock|facturation&from=&to=` |
| Santé        | `GET /api/health` |

Sécurité : envoyez l'en-tête `Authorization: Bearer <token>` (jeton d'accès). Les permissions sont vérifiées côté serveur via l'annotation `@RequirePermission` (un employé sans la permission reçoit `403`). Le jeton d'accès est de courte durée ; obtenez-en un nouveau avec `POST /api/auth/refresh` en fournissant le `refreshToken` (rotation à chaque appel).

**Réponses paginées.** Les listes paginées renvoient un objet `{ content: [...], page: { size, number, totalElements, totalPages } }` (mode `VIA_DTO` de Spring Data).

---

## Web

### Lancer en développement

```powershell
# depuis web/
npm install
npm run dev        # http://localhost:5173
```

L'URL de l'API est lue depuis `VITE_API_URL` (défaut : `/api`, redirigé en développement vers `http://localhost:8091` par le proxy Vite configuré dans `vite.config.ts`). En production, définissez `VITE_API_URL` vers l'API et ajoutez l'origine du front à `OLIVEPRESS_CORS_ORIGINS` côté backend.

### Scripts

```powershell
npm run dev          # serveur de développement Vite
npm run build        # vérification de types + build de production (dist/)
npm run preview      # prévisualisation du build
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run lint:fix     # ESLint avec correction automatique
npm run format       # Prettier (écriture)
npm run format:check # Prettier (vérification)
```

### Fonctionnalités

- Tableau de bord, clients, apports (statuts, ticket), production, stock, livraisons, factures et paiements, employés/permissions, notifications, historique, rapports.
- **Réglages** : tarif de pressage à la tonne (la facture d'un apport est générée automatiquement).
- **Export PDF** des rapports.
- **Profil** : changement de mot de passe.
- Rafraîchissement transparent du jeton d'accès (intercepteur axios).

---

## Mobile

### Configuration de l'URL de l'API

L'URL de base est définie dans `mobile/app.json` → `expo.extra.apiBaseUrl` (par défaut `http://localhost:8091/api`). Adaptez selon votre environnement :

| Environnement            | URL à utiliser                     |
|--------------------------|------------------------------------|
| Émulateur Android        | `http://10.0.2.2:8091/api`         |
| Simulateur iOS / Web     | `http://localhost:8091/api`        |
| Téléphone physique (LAN) | `http://<IP-de-votre-PC>:8091/api` |

Surchargeable par la variable `EXPO_PUBLIC_API_URL`.

### Installation et lancement

```powershell
# depuis mobile/
npm install
npm start          # puis scannez le QR code avec Expo Go
# ou
npm run android    # émulateur Android
npm run ios        # simulateur iOS
npm run web        # navigateur
```

### Vérification de types

```powershell
npm run typecheck   # tsc --noEmit
```

### Fonctionnalités de l'application

- **Tableau de bord** : apports du jour, stock disponible, production cumulée, rendement moyen, factures impayées, graphiques.
- **Clients** : liste, recherche, fiche client, création/modification, apports par client.
- **Apports** : saisie (poids brut/tare → net), changement de statut, ticket partageable, historique.
- **Production** : saisie du rendement (kg d'olives → litres d'huile).
- **Stock** : stock disponible, mouvements (entrée/sortie/ajustements).
- **Livraisons** : bons de livraison avec contrôle du stock.
- **Factures** : lignes de prestations, paiements, statut (impayée/partielle/payée), partage, carte facture automatique d'un apport.
- **Employés** : création, rôles, permissions fines, activation/désactivation.
- **Réglages** : tarif de pressage.
- **Notifications, Historique, Rapports** (export PDF), **Profil** (changement de mot de passe).
- L'interface s'adapte aux permissions de l'utilisateur connecté (masquage des écrans non autorisés), en plus du contrôle serveur.
- Interface bilingue **français / arabe** (RTL).

### Hors-ligne et notifications

- **Mode hors-ligne (lecture)** : les réponses `GET` sont mises en cache localement ; si le serveur est injoignable, la dernière donnée connue est affichée et un bandeau « Hors ligne » apparaît. Les écritures nécessitent une connexion.
- **Notifications push** : si `OLIVEPRESS_PUSH_ENABLED=true` côté backend et qu'un `projectId` EAS est configuré, l'appareil enregistre son jeton Expo et reçoit les notifications (nouvel apport, facture impayée, etc.).

---

## Déploiement (gratuit)

Pile recommandée : **Vercel** (web) + **Render** (backend Docker) + **Neon** (PostgreSQL).

> Vercel n'héberge pas de backend Java : le web va sur Vercel, l'API Spring Boot sur Render, la base sur Neon.

### 1. Base PostgreSQL — Neon

1. Créer un projet sur [neon.tech](https://neon.tech) (plan gratuit permanent).
2. Récupérer la chaîne de connexion, du type :
   `postgresql://<user>:<pass>@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. La convertir en URL JDBC pour `OLIVEPRESS_DB_URL` :
   `jdbc:postgresql://ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
   et renseigner `OLIVEPRESS_DB_USER` / `OLIVEPRESS_DB_PASSWORD` séparément.

Flyway crée les tables automatiquement au premier démarrage du backend.

### 2. Backend — Render

1. Pousser le dépôt sur GitHub.
2. Render → **New → Blueprint**, sélectionner le dépôt : il lit `render.yaml` (service `olivepress-api`, Docker, plan gratuit, healthcheck `/api/health`).
3. Renseigner les variables demandées :
   - `OLIVEPRESS_DB_URL`, `OLIVEPRESS_DB_USER`, `OLIVEPRESS_DB_PASSWORD` (Neon)
   - `OLIVEPRESS_CORS_ORIGINS` = URL Vercel (ex. `https://olivepress.vercel.app`)
   - `OLIVEPRESS_ADMIN_EMAIL`, `OLIVEPRESS_ADMIN_PASSWORD`
   - `OLIVEPRESS_JWT_SECRET` est généré automatiquement.
4. Déployer, puis vérifier `https://<service>.onrender.com/api/health`.

> Plan gratuit : le service se met en veille après ~15 min d'inactivité ; la 1re requête suivante prend ~30-60 s.

### 3. Web — Vercel

1. Vercel → **Add New → Project**, importer le dépôt GitHub.
2. **Root Directory** : `olivepress/web`. Framework détecté : Vite (`vercel.json` fourni).
3. Variable d'environnement : `VITE_API_URL` = `https://<service>.onrender.com/api`.
4. Déployer, puis reporter l'URL Vercel dans `OLIVEPRESS_CORS_ORIGINS` côté Render et redéployer le backend.

### 4. Mobile (plus tard)

Pointer `EXPO_PUBLIC_API_URL` (ou `app.json` → `expo.extra.apiBaseUrl`) vers l'URL Render, puis builder avec EAS.

---

## Qualité et intégration continue

- **Backend** : `mvn test`.
- **Web** : ESLint + Prettier + `tsc` ; `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run build`.
- **Mobile** : `npm run typecheck`.
- **CI** : `.github/workflows/ci.yml` exécute ces vérifications sur chaque `push` / `pull_request`.

---

## Règles métier

- **Poids net d'un apport** = poids brut − tare.
- **Rendement (%)** = litres d'huile obtenus ÷ kg d'olives traitées × 100.
- **Stock disponible** = somme des entrées et ajustements positifs − sorties et ajustements négatifs.
- **Statut de facture** : `IMPAYEE` → `PARTIELLE` → `PAYEE` selon le cumul des paiements (`reste = total − payé`).
- **Facture automatique** : à la création d'un apport, une facture est générée au tarif de pressage courant (`tarif/kg × poids net`).
- Les numéros (`AP-...`, `LIV-...`, `FAC-...`) sont générés automatiquement.

## Limites connues

- Le **mode hors-ligne mobile est en lecture seule** : les données déjà consultées restent visibles hors connexion, mais les créations/modifications nécessitent une connexion (pas de file d'attente de synchronisation).
- L'**export PDF** utilise l'impression/le partage natifs du navigateur ou du système.
