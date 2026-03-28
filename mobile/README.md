# Ajo Mobile

React Native app built with Expo for iOS and Android.

## Setup

```bash
cd mobile
npm install
cp .env.example .env
```

## Running

```bash
# Start Expo dev server
npm start

# iOS simulator
npm run ios

# Android emulator
npm run android
```

## Features

- Wallet connection via Freighter Mobile deep link or manual public key entry
- Biometric authentication (Face ID / fingerprint) for sensitive actions
- Group browsing, creation, and joining
- Contribution submission with biometric confirmation
- Transaction history per group
- QR code scanning for group invites and Stellar addresses
- Camera-based profile picture selection
- Push notifications for contribution reminders
- Offline mode detection with banner
- Deep linking via `ajo://` scheme

## Deep Links

| URL | Action |
|-----|--------|
| `ajo://groups/<id>` | Open group detail |
| `ajo://auth` | Return from Freighter wallet |

## Environment Variables

See `.env.example`. All vars must be prefixed with `EXPO_PUBLIC_` to be accessible in the app.

## Project Structure

```
mobile/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # Root layout with auth gate
│   ├── index.tsx           # Entry: redirect to tabs or login
│   ├── (tabs)/             # Bottom tab navigator
│   │   ├── index.tsx       # Dashboard
│   │   ├── groups.tsx      # Groups list
│   │   └── profile.tsx     # User profile
│   ├── groups/
│   │   ├── create.tsx      # Create group
│   │   └── [id]/
│   │       ├── index.tsx   # Group detail
│   │       └── contribute.tsx
│   └── qr.tsx              # QR scanner (modal)
├── src/
│   ├── components/         # Shared UI components
│   ├── constants/          # Theme, API config
│   ├── hooks/              # useOffline, useBiometric
│   ├── screens/            # Screen components
│   ├── services/           # API client, auth, notifications
│   ├── store/              # Zustand stores
│   └── types/              # Shared TypeScript types
└── assets/                 # App icons, splash screen
```
