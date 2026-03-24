# 🧠 Stellar Soroban Prediction Market

## 📌 Project Description
This project is a decentralized Prediction Market built using Soroban smart contracts on the Stellar blockchain. It allows users to place bets on binary outcomes (YES/NO) and earn rewards based on the final result.

---

## ⚙️ What it does
- Users can participate in a prediction market by placing bets.
- Each bet includes:
  - User address
  - Amount staked
  - Prediction (YES or NO)
- Once the event outcome is known, the market is resolved.
- Users who predicted correctly can claim rewards.

---

## 🚀 Features
- ✅ Simple and lightweight Soroban smart contract
- 🔐 Secure user authentication using Stellar addresses
- 📊 Binary prediction system (YES / NO)
- 💰 Reward distribution for correct predictions
- ⚡ Fast and low-cost transactions on Stellar
- 🧾 On-chain storage of all bets

---

## 🏗️ Smart Contract Functions

### `init()`
Initializes the prediction market.

### `place_bet(user, amount, prediction)`
Allows a user to place a bet.

### `resolve(outcome)`
Resolves the market (admin action).

### `claim(user)`
Allows users to claim rewards after resolution.

### `get_market()`
Returns the current market state.

---

## 🔗 Deployed Smart Contract Link:
*(Add your deployed contract link here)*  
Example:  
(https://stellar.expert/explorer/testnet/contract/CCK7M6EJ2NFEEJDH5W4QQXSNFLSZ45ERCSWWR2QVBRTJWYJCHVFSZ4BZ)

---

## 🛠️ Tech Stack
- Soroban SDK (Rust)
- Stellar Blockchain
- Rust Programming Language

---

## 📦 How to Run

1. Install Soroban CLI
2. Build contract:
   ```bash
   cargo build --target wasm32-unknown-unknown --release
