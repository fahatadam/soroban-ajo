# System Architecture

This document provides an overview of the Ajo platform architecture, including the interaction between the frontend, backend, and blockchain (Stellar Soroban).

---

## Overview

Ajo is a decentralized savings platform that enables users to participate in rotating savings groups (ROSCAs). The system is composed of three main layers:

* Frontend (Next.js application)
* Backend (Node.js/Express API)
* Smart Contracts (Soroban on Stellar)

These components work together to provide a secure and transparent user experience.

---

## High-Level Architecture

```text
+---------------------+        +------------------------+        +----------------------+
|     Frontend        |        |        Backend         |        |     Blockchain       |
|  (Next.js App)      |        |   (Node.js/Express)    |        |   (Soroban / Stellar)|
+----------+----------+        +-----------+------------+        +----------+-----------+
           |                               |                              |
           |  HTTP (REST API)              |                              |
           +-----------------------------> |                              |
           |                               |                              |
           |                               |  RPC (Soroban SDK)           |
           |                               +----------------------------->|
           |                               |                              |
           |  Wallet Interaction           |                              |
           |  (Freighter)                 |                              |
           +------------------------------------------------------------->|
```

---

## Component Breakdown

### Frontend (Next.js)

The frontend is responsible for user interaction and presentation.

**Key Responsibilities:**

* User interface for creating and joining savings groups
* Displaying contribution schedules and history
* Initiating blockchain transactions via wallet
* Communicating with backend APIs

**Technologies:**

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* React Query and Zustand
* Stellar SDK

---

### Backend (Node.js / Express)

The backend acts as an intermediary between the frontend and the blockchain.

**Key Responsibilities:**

* API endpoints for application logic
* Input validation and request handling
* Interacting with Soroban smart contracts
* Indexing and processing blockchain events
* Managing off-chain data and caching

**Technologies:**

* Node.js
* Express.js
* TypeScript
* Zod (validation)
* Stellar SDK

---

### Smart Contracts (Soroban / Rust)

Smart contracts manage all on-chain logic for savings groups.

**Key Responsibilities:**

* Group creation and configuration
* Contribution tracking
* Fund distribution
* Dispute resolution and arbitration
* Event emission for transparency

**Technologies:**

* Rust
* Soroban SDK

---

## Detailed Interaction Flow

### 1. User Action Flow

```text
User -> Frontend -> Backend -> Smart Contract -> Blockchain State
```

**Step-by-step:**

1. User interacts with the frontend (e.g., creates a group)
2. Frontend sends request to backend API
3. Backend validates input and prepares contract call
4. Backend interacts with Soroban contract via RPC
5. Blockchain processes transaction and updates state
6. Response is returned to frontend
7. Frontend updates UI

---

### 2. Wallet Transaction Flow

```text
User -> Frontend -> Wallet (Freighter) -> Blockchain
```

**Step-by-step:**

1. User initiates a transaction (e.g., contribution)
2. Frontend constructs transaction payload
3. Wallet prompts user for signature
4. Signed transaction is submitted to the network
5. Blockchain executes the smart contract
6. Result is reflected in UI

---

### 3. Event and Indexing Flow

```text
Blockchain Events -> Backend Listener -> Database / Cache -> Frontend
```

**Step-by-step:**

1. Smart contract emits events (contribution, payout, dispute)
2. Backend listens to Soroban events
3. Events are processed and stored (if applicable)
4. Frontend queries backend for updated data

---

## Data Flow Summary

```text
[Frontend]
   |
   | REST API Calls
   v
[Backend]
   |
   | Soroban RPC
   v
[Smart Contract]
   |
   | Events
   v
[Backend Indexer]
   |
   v
[Frontend UI Updates]
```

---

## Trust Model

* Smart contracts are the source of truth for financial state
* Backend is a trusted facilitator but does not control funds
* Frontend is untrusted and must not enforce critical logic
* Users retain control through their wallets

---

## Key Design Principles

### Decentralization

* Financial logic resides entirely on-chain
* Users retain custody of their funds

### Transparency

* All transactions are recorded on the blockchain
* Events provide traceability for all actions

### Security

* Smart contracts enforce rules
* Backend validates and sanitizes inputs
* Frontend provides safe user interactions

### Modularity

* Clear separation between frontend, backend, and contracts
* Each layer can evolve independently

---

## Scalability Considerations

* Backend indexing reduces repeated blockchain queries
* Efficient contract design minimizes execution cost
* Frontend caching improves performance

---

## Failure Handling

* Backend handles RPC failures and retries
* Frontend provides user feedback for failed transactions
* Smart contracts return deterministic errors

---

## Future Improvements

* Enhanced indexing and analytics layer
* Real-time updates via WebSockets
* Multi-contract architecture for scalability
* Improved monitoring and alerting systems

---

## Summary

The Ajo architecture is designed to balance decentralization, usability, and performance. By separating concerns across frontend, backend, and blockchain layers, the system ensures:

* Secure fund management via smart contracts
* Efficient interaction through backend services
* Accessible user experience through the frontend
