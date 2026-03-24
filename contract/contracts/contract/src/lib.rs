#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Env, Symbol, Address, Vec, Map};

#[derive(Clone)]
#[contracttype]
pub struct Bet {
    user: Address,
    amount: i128,
    prediction: bool, // true = YES, false = NO
}

#[derive(Clone)]
#[contracttype]
pub struct Market {
    resolved: bool,
    outcome: bool,
    bets: Vec<Bet>,
}

#[contract]
pub struct PredictionMarket;

#[contractimpl]
impl PredictionMarket {

    // Initialize a new market
    pub fn init(env: Env) {
        let market = Market {
            resolved: false,
            outcome: false,
            bets: Vec::new(&env),
        };
        env.storage().instance().set(&Symbol::short("MARKET"), &market);
    }

    // Place a bet
    pub fn place_bet(env: Env, user: Address, amount: i128, prediction: bool) {
        user.require_auth();

        let mut market: Market = env.storage()
            .instance()
            .get(&Symbol::short("MARKET"))
            .unwrap();

        if market.resolved {
            panic!("Market already resolved");
        }

        let bet = Bet { user, amount, prediction };
        market.bets.push_back(bet);

        env.storage().instance().set(&Symbol::short("MARKET"), &market);
    }

    // Resolve market (admin only)
    pub fn resolve(env: Env, outcome: bool) {
        let mut market: Market = env.storage()
            .instance()
            .get(&Symbol::short("MARKET"))
            .unwrap();

        if market.resolved {
            panic!("Already resolved");
        }

        market.resolved = true;
        market.outcome = outcome;

        env.storage().instance().set(&Symbol::short("MARKET"), &market);
    }

    // Claim reward
    pub fn claim(env: Env, user: Address) -> i128 {
        user.require_auth();

        let market: Market = env.storage()
            .instance()
            .get(&Symbol::short("MARKET"))
            .unwrap();

        if !market.resolved {
            panic!("Market not resolved");
        }

        let mut reward: i128 = 0;

        for bet in market.bets.iter() {
            if bet.user == user && bet.prediction == market.outcome {
                reward += bet.amount * 2; // simple double reward
            }
        }

        reward
    }

    // View market
    pub fn get_market(env: Env) -> Market {
        env.storage()
            .instance()
            .get(&Symbol::short("MARKET"))
            .unwrap()
    }
}