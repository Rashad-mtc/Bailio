# LoyerFacile — Architecture technique (Next.js + PWA + Firebase)

Stack retenue : **GitHub · Vercel · Firebase · Next.js**, livrée en **Progressive Web App (PWA)** — un seul code pour le site web et l'application mobile.

---

## 1. Vue d'ensemble

```
┌─────────────────────────────┐
│   Next.js (App Router)       │  ← UI web + mobile (PWA installable)
│   déployé sur Vercel         │
└───────────────┬───────────────┘
                │
    ┌───────────┴────────────┐
    │                         │
┌───▼────────┐      ┌─────────▼─────────┐
│ Firebase   │      │  Firebase Cloud    │
│ Auth       │      │  Functions         │
│ Firestore  │      │  (échéancier,      │
│ Storage    │      │   Mobile Money,    │
│ Cloud      │      │   SMS, webhooks)   │
│ Messaging  │      └─────────┬───────────┘
└────────────┘                │
                    ┌──────────▼──────────┐
                    │ Kkiapay / Fedapay    │
                    │ (agrégateur Mobile   │
                    │  Money)              │
                    └───────────────────────┘
```

- **Un seul repo GitHub**, un seul déploiement Vercel pour propriétaires, agences et locataires.
- **Firebase** gère tout le back-end (auth, données, fichiers, notifications, fonctions serveur) — pas de serveur à gérer soi-même.
- **PWA** = le site devient installable sur l'écran d'accueil Android/iOS, avec icône, mode plein écran et notifications push (Android).

---

## 2. Structure du projet Next.js

```
loyerfacile/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (proprietaire)/
│   │   ├── dashboard/page.tsx
│   │   ├── biens/
│   │   │   ├── page.tsx
│   │   │   └── [bienId]/page.tsx
│   │   ├── locataires/
│   │   │   └── [locataireId]/page.tsx
│   │   └── paiements/page.tsx
│   ├── (locataire)/
│   │   ├── mon-loyer/page.tsx
│   │   └── signaler/page.tsx
│   ├── api/
│   │   ├── webhooks/mobile-money/route.ts
│   │   └── sms/route.ts
│   ├── layout.tsx
│   └── manifest.ts          ← manifeste PWA
├── components/
├── lib/
│   ├── firebase/
│   │   ├── client.ts        ← init Firebase côté client
│   │   └── admin.ts         ← init Firebase Admin (server-side)
│   └── firestore/
│       ├── biens.ts
│       ├── locataires.ts
│       └── paiements.ts
├── functions/                ← Firebase Cloud Functions (repo séparé ou dossier dédié)
│   ├── genererEcheancier.ts
│   ├── confirmerPaiementCash.ts
│   ├── webhookMobileMoney.ts
│   └── envoyerRappel.ts
├── public/
│   ├── icons/                ← icônes PWA (192x192, 512x512, maskable)
│   └── sw.js                 ← service worker (généré par next-pwa)
├── firestore.rules
├── firebase.json
├── next.config.js
└── package.json
```

---

## 3. Mise en place de la PWA avec Next.js

### 3.1 Dépendances

```bash
npm install next-pwa
```

### 3.2 Configuration `next.config.js`

```js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  reactStrictMode: true,
});
```

### 3.3 Manifeste PWA — `app/manifest.ts`

```ts
import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LoyerFacile",
    short_name: "LoyerFacile",
    description: "Gestion locative et paiement de loyer",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#5B2C87",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

Une fois déployé, Android propose automatiquement "Ajouter à l'écran d'accueil" ; sur iOS, l'utilisateur le fait manuellement depuis Safari (Partager → Sur l'écran d'accueil).

### 3.4 Notifications push (Android via Firebase Cloud Messaging)

- Ajouter le SDK Firebase côté client (`firebase/messaging`).
- Demander la permission de notification au premier lancement.
- Stocker le token FCM de l'utilisateur dans Firestore (`locataires/{id}.fcmToken`).
- Les Cloud Functions envoient les rappels via ce token.
- ⚠️ Sur iOS, les push PWA ne sont fiables qu'à partir d'iOS 16.4+ et nécessitent que l'app soit installée sur l'écran d'accueil — prévoir un repli par SMS pour ces cas.

---

## 4. Firebase — configuration

### 4.1 Authentification

- Firebase Auth avec **connexion par téléphone (OTP SMS)**.
- Un même compte `users/{uid}` avec un champ `role`: `"proprietaire" | "agence" | "gestionnaire" | "locataire"`.

### 4.2 Modèle de données Firestore

```
users/{uid}
  role, nom, telephone, agenceId (optionnel)

biens/{bienId}
  proprietaireId, nom, adresse, quartier

logements/{logementId}
  bienId, numeroChambre, montantLoyer, statut

locataires/{locataireId}
  logementId, uid, nom, telephone, moisEntree, fcmToken

paiements/{paiementId}
  locataireId, mois, montantDu, montantPaye, mode, statut, dateConfirmation

incidents/{incidentId}
  logementId, description, photoUrl, statut, dateCreation
```

### 4.3 Règles de sécurité Firestore (principe)

- Un propriétaire ne peut lire/écrire que les documents liés à ses propres `biens`.
- Un locataire ne peut lire que sa propre fiche et ses propres paiements.
- Toute confirmation de paiement passe par une Cloud Function (jamais une écriture directe du client) pour éviter qu'un locataire ne s'auto-valide un paiement.

### 4.4 Cloud Functions clés

| Fonction | Déclencheur | Rôle |
|---|---|---|
| `genererEcheancier` | Cron mensuel | Crée les documents `paiements` du mois pour chaque locataire actif |
| `webhookMobileMoney` | HTTP (appelé par Kkiapay/Fedapay) | Vérifie la signature, met à jour le paiement en `"payé"`, génère le reçu |
| `confirmerPaiementCash` | Appel authentifié du propriétaire | Marque un paiement comme reçu en cash, génère le reçu |
| `envoyerRappel` | Cron quotidien | Envoie SMS/push 3 jours avant échéance, puis alerte de retard |

---

## 5. Déploiement

- **GitHub** : une branche `main` protégée, déploiement automatique via Vercel à chaque merge.
- **Vercel** : hébergement du Next.js (preview deployments automatiques sur chaque pull request — pratique pour tester avant de merger).
- **Firebase** : déploiement des règles et Cloud Functions via `firebase deploy` (à intégrer dans une GitHub Action pour l'automatiser).

```bash
# Déploiement manuel des fonctions et règles
firebase deploy --only functions,firestore:rules
```

---

## 6. Ordre de développement suggéré (MVP)

1. Auth Firebase (téléphone/OTP) + structure `users`.
2. CRUD biens / logements / locataires (interface propriétaire).
3. Génération automatique de l'échéancier (Cloud Function cron).
4. Enregistrement de paiement cash + génération de reçu.
5. Intégration Mobile Money (Kkiapay ou Fedapay) + webhook.
6. Rappels SMS/push.
7. Manifeste PWA + icônes + test d'installation sur Android.
8. Tableau de bord propriétaire (payé / en retard).

---

## 7. Points de vigilance

- **iOS et PWA** : notifications limitées, pas de distribution App Store — acceptable pour un MVP, à revoir si la cible iOS devient importante (option Capacitor plus tard, sans réécrire le code Next.js).
- **Firestore et volumétrie** : bien indexer les requêtes par `proprietaireId`/`agenceId` dès le départ pour éviter des lectures coûteuses quand le nombre de biens grandit.
- **Sécurité paiements** : ne jamais valider un paiement Mobile Money depuis le client — uniquement via le webhook signé côté serveur.
