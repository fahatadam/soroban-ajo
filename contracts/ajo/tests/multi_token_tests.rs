#![cfg(test)]

use soroban_ajo::{AjoContract, AjoContractClient, TokenConfig};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env, Vec,
};

fn setup_test_env() -> (Env, AjoContractClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, AjoContract);
    let client = AjoContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);

    (env, client, creator)
}

fn register_token(env: &Env) -> Address {
    let admin = Address::generate(env);
    env.register_stellar_asset_contract(admin)
}

fn mint_tokens(env: &Env, token_id: &Address, members: &[Address], amount: i128) {
    let token_client = token::StellarAssetClient::new(env, token_id);
    for member in members {
        token_client.mint(member, &amount);
    }
}

fn build_token_configs(env: &Env, tokens: &[(Address, u32)]) -> Vec<TokenConfig> {
    let mut configs = Vec::new(env);
    for (addr, weight) in tokens {
        configs.push_back(TokenConfig {
            address: addr.clone(),
            weight: *weight,
        });
    }
    configs
}

// ── Creation tests ────────────────────────────────────────────────────────

#[test]
fn test_create_multi_token_group() {
    let (env, client, creator) = setup_test_env();
    let token_a = register_token(&env);
    let token_b = register_token(&env);

    let configs = build_token_configs(&env, &[(token_a.clone(), 100), (token_b.clone(), 50)]);

    let group_id = client.create_multi_token_group(
        &creator,
        &configs,
        &100_000_000i128,
        &604_800u64,
        &3u32,
        &86400u64,
        &5u32,
        &0u32,
    );

    assert_eq!(group_id, 1);

    let group = client.get_group(&group_id);
    assert_eq!(group.creator, creator);
    assert_eq!(group.contribution_amount, 100_000_000i128);
    assert_eq!(group.token_address, token_a);
    assert_eq!(group.members.len(), 1);
    assert_eq!(group.current_cycle, 1);
    assert_eq!(group.is_complete, false);

    assert_eq!(client.is_multi_token_group(&group_id), true);

    let accepted = client.get_accepted_tokens(&group_id);
    assert_eq!(accepted.len(), 2);
    assert_eq!(accepted.get(0).unwrap().address, token_a);
    assert_eq!(accepted.get(0).unwrap().weight, 100);
    assert_eq!(accepted.get(1).unwrap().address, token_b);
    assert_eq!(accepted.get(1).unwrap().weight, 50);
}

#[test]
fn test_single_token_group_not_multi_token() {
    let (env, client, creator) = setup_test_env();
    let token = register_token(&env);

    let group_id = client.create_group(
        &creator,
        &token,
        &100_000_000i128,
        &604_800u64,
        &3u32,
        &86400u64,
        &5u32,
        &0u32,
    );

    assert_eq!(client.is_multi_token_group(&group_id), false);
}

#[test]
#[should_panic]
fn test_create_multi_token_group_empty_list() {
    let (env, client, creator) = setup_test_env();
    let configs = Vec::new(&env);

    client.create_multi_token_group(
        &creator,
        &configs,
        &100_000_000i128,
        &604_800u64,
        &3u32,
        &86400u64,
        &5u32,
        &0u32,
    );
}

#[test]
#[should_panic]
fn test_create_multi_token_group_zero_weight() {
    let (env, client, creator) = setup_test_env();
    let token_a = register_token(&env);
    let configs = build_token_configs(&env, &[(token_a, 0)]);

    client.create_multi_token_group(
        &creator,
        &configs,
        &100_000_000i128,
        &604_800u64,
        &3u32,
        &86400u64,
        &5u32,
        &0u32,
    );
}

#[test]
#[should_panic]
fn test_create_multi_token_group_duplicate_token() {
    let (env, client, creator) = setup_test_env();
    let token_a = register_token(&env);

    let configs = build_token_configs(&env, &[(token_a.clone(), 100), (token_a, 50)]);

    client.create_multi_token_group(
        &creator,
        &configs,
        &100_000_000i128,
        &604_800u64,
        &3u32,
        &86400u64,
        &5u32,
        &0u32,
    );
}

// ── Contribution tests ────────────────────────────────────────────────────

#[test]
fn test_contribute_with_primary_token() {
    let (env, client, creator) = setup_test_env();
    let token_a = register_token(&env);
    let token_b = register_token(&env);
    let member2 = Address::generate(&env);

    let configs = build_token_configs(&env, &[(token_a.clone(), 100), (token_b.clone(), 50)]);

    let group_id = client.create_multi_token_group(
        &creator,
        &configs,
        &100_000_000i128,
        &604_800u64,
        &3u32,
        &86400u64,
        &5u32,
        &0u32,
    );
    client.join_group(&member2, &group_id);

    mint_tokens(&env, &token_a, &[creator.clone()], 200_000_000i128);

    client.contribute_with_token(&creator, &group_id, &token_a);

    let status = client.get_contribution_status(&group_id, &1u32);
    let creator_contributed = status.iter().find(|(addr, _)| *addr == creator).unwrap().1;
    assert_eq!(creator_contributed, true);

    let tk_record = client.get_token_contribution(&group_id, &1u32, &creator);
    assert_eq!(tk_record.token, token_a);
    assert_eq!(tk_record.amount, 100_000_000i128);
    assert_eq!(tk_record.cycle, 1);
}

#[test]
fn test_contribute_with_secondary_token_equivalence() {
    let (env, client, creator) = setup_test_env();
    let token_a = register_token(&env);
    let token_b = register_token(&env);

    let configs = build_token_configs(&env, &[(token_a.clone(), 100), (token_b.clone(), 50)]);

    let group_id = client.create_multi_token_group(
        &creator,
        &configs,
        &100_000_000i128,
        &604_800u64,
        &3u32,
        &86400u64,
        &5u32,
        &0u32,
    );

    // token_b has weight 50 vs primary weight 100
    // required = 100_000_000 * 100 / 50 = 200_000_000
    mint_tokens(&env, &token_b, &[creator.clone()], 300_000_000i128);

    client.contribute_with_token(&creator, &group_id, &token_b);

    let tk_record = client.get_token_contribution(&group_id, &1u32, &creator);
    assert_eq!(tk_record.token, token_b);
    assert_eq!(tk_record.amount, 200_000_000i128);
}

#[test]
fn test_mixed_token_contributions() {
    let (env, client, creator) = setup_test_env();
    let token_a = register_token(&env);
    let token_b = register_token(&env);
    let member2 = Address::generate(&env);
    let member3 = Address::generate(&env);

    let configs = build_token_configs(&env, &[(token_a.clone(), 100), (token_b.clone(), 50)]);

    let group_id = client.create_multi_token_group(
        &creator,
        &configs,
        &100_000_000i128,
        &604_800u64,
        &3u32,
        &86400u64,
        &5u32,
        &0u32,
    );
    client.join_group(&member2, &group_id);
    client.join_group(&member3, &group_id);

    mint_tokens(&env, &token_a, &[creator.clone(), member3.clone()], 200_000_000i128);
    mint_tokens(&env, &token_b, &[member2.clone()], 300_000_000i128);

    // creator uses primary token
    client.contribute_with_token(&creator, &group_id, &token_a);
    // member2 uses secondary token
    client.contribute_with_token(&member2, &group_id, &token_b);
    // member3 uses primary token
    client.contribute_with_token(&member3, &group_id, &token_a);

    let status = client.get_contribution_status(&group_id, &1u32);
    for (_, has_paid) in status.iter() {
        assert_eq!(has_paid, true);
    }

    let r1 = client.get_token_contribution(&group_id, &1u32, &creator);
    assert_eq!(r1.token, token_a);
    assert_eq!(r1.amount, 100_000_000i128);

    let r2 = client.get_token_contribution(&group_id, &1u32, &member2);
    assert_eq!(r2.token, token_b);
    assert_eq!(r2.amount, 200_000_000i128);

    let r3 = client.get_token_contribution(&group_id, &1u32, &member3);
    assert_eq!(r3.token, token_a);
    assert_eq!(r3.amount, 100_000_000i128);
}

#[test]
#[should_panic]
fn test_contribute_with_unaccepted_token() {
    let (env, client, creator) = setup_test_env();
    let token_a = register_token(&env);
    let token_b = register_token(&env);
    let token_c = register_token(&env);

    let configs = build_token_configs(&env, &[(token_a.clone(), 100), (token_b.clone(), 50)]);

    let group_id = client.create_multi_token_group(
        &creator,
        &configs,
        &100_000_000i128,
        &604_800u64,
        &3u32,
        &86400u64,
        &5u32,
        &0u32,
    );

    mint_tokens(&env, &token_c, &[creator.clone()], 500_000_000i128);

    // token_c is not accepted — should panic
    client.contribute_with_token(&creator, &group_id, &token_c);
}

#[test]
#[should_panic]
fn test_contribute_with_token_on_single_token_group() {
    let (env, client, creator) = setup_test_env();
    let token = register_token(&env);

    let group_id = client.create_group(
        &creator,
        &token,
        &100_000_000i128,
        &604_800u64,
        &3u32,
        &86400u64,
        &5u32,
        &0u32,
    );

    mint_tokens(&env, &token, &[creator.clone()], 200_000_000i128);

    // contribute_with_token on a single-token group — should panic
    client.contribute_with_token(&creator, &group_id, &token);
}

#[test]
#[should_panic]
fn test_double_contribute_with_token() {
    let (env, client, creator) = setup_test_env();
    let token_a = register_token(&env);

    let configs = build_token_configs(&env, &[(token_a.clone(), 100)]);

    let group_id = client.create_multi_token_group(
        &creator,
        &configs,
        &100_000_000i128,
        &604_800u64,
        &3u32,
        &86400u64,
        &5u32,
        &0u32,
    );

    mint_tokens(&env, &token_a, &[creator.clone()], 300_000_000i128);

    client.contribute_with_token(&creator, &group_id, &token_a);
    // second contribution in the same cycle — should panic
    client.contribute_with_token(&creator, &group_id, &token_a);
}

// ── Payout tests ──────────────────────────────────────────────────────────

#[test]
fn test_multi_token_payout_single_token_used() {
    let (env, client, creator) = setup_test_env();
    let token_a = register_token(&env);
    let token_b = register_token(&env);
    let member2 = Address::generate(&env);

    let configs = build_token_configs(&env, &[(token_a.clone(), 100), (token_b.clone(), 50)]);

    let group_id = client.create_multi_token_group(
        &creator,
        &configs,
        &100_000_000i128,
        &604_800u64,
        &2u32,
        &86400u64,
        &5u32,
        &0u32,
    );
    client.join_group(&member2, &group_id);

    mint_tokens(&env, &token_a, &[creator.clone(), member2.clone()], 200_000_000i128);

    client.contribute_with_token(&creator, &group_id, &token_a);
    client.contribute_with_token(&member2, &group_id, &token_a);

    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 604_800 + 86400 + 1;
    });

    client.execute_multi_token_payout(&group_id);

    let group = client.get_group(&group_id);
    assert_eq!(group.current_cycle, 2);
    assert_eq!(group.payout_index, 1);
    assert_eq!(group.is_complete, false);
}

#[test]
fn test_multi_token_payout_mixed_tokens() {
    let (env, client, creator) = setup_test_env();
    let token_a = register_token(&env);
    let token_b = register_token(&env);
    let member2 = Address::generate(&env);

    let configs = build_token_configs(&env, &[(token_a.clone(), 100), (token_b.clone(), 100)]);

    let group_id = client.create_multi_token_group(
        &creator,
        &configs,
        &100_000_000i128,
        &604_800u64,
        &2u32,
        &86400u64,
        &5u32,
        &0u32,
    );
    client.join_group(&member2, &group_id);

    mint_tokens(&env, &token_a, &[creator.clone()], 200_000_000i128);
    mint_tokens(&env, &token_b, &[member2.clone()], 200_000_000i128);

    // creator contributes in token_a, member2 in token_b
    client.contribute_with_token(&creator, &group_id, &token_a);
    client.contribute_with_token(&member2, &group_id, &token_b);

    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 604_800 + 86400 + 1;
    });

    // Payout recipient (creator, index 0) gets both token_a and token_b balances
    client.execute_multi_token_payout(&group_id);

    let group = client.get_group(&group_id);
    assert_eq!(group.payout_index, 1);
    assert_eq!(group.current_cycle, 2);
}

#[test]
fn test_multi_token_full_lifecycle() {
    let (env, client, creator) = setup_test_env();
    let token_a = register_token(&env);
    let token_b = register_token(&env);
    let member2 = Address::generate(&env);

    let configs = build_token_configs(&env, &[(token_a.clone(), 100), (token_b.clone(), 100)]);

    let group_id = client.create_multi_token_group(
        &creator,
        &configs,
        &50_000_000i128,
        &604_800u64,
        &2u32,
        &86400u64,
        &5u32,
        &0u32,
    );
    client.join_group(&member2, &group_id);

    // Cycle 1
    mint_tokens(&env, &token_a, &[creator.clone()], 100_000_000i128);
    mint_tokens(&env, &token_b, &[member2.clone()], 100_000_000i128);
    client.contribute_with_token(&creator, &group_id, &token_a);
    client.contribute_with_token(&member2, &group_id, &token_b);
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 604_800 + 86400 + 1;
    });
    client.execute_multi_token_payout(&group_id);
    assert_eq!(client.is_complete(&group_id), false);

    // Cycle 2
    mint_tokens(&env, &token_a, &[creator.clone()], 100_000_000i128);
    mint_tokens(&env, &token_b, &[member2.clone()], 100_000_000i128);
    client.contribute_with_token(&creator, &group_id, &token_a);
    client.contribute_with_token(&member2, &group_id, &token_b);
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 604_800 + 86400 + 1;
    });
    client.execute_multi_token_payout(&group_id);

    assert_eq!(client.is_complete(&group_id), true);
    let group = client.get_group(&group_id);
    assert_eq!(group.payout_index, 2);
}

#[test]
#[should_panic]
fn test_multi_token_payout_incomplete_contributions() {
    let (env, client, creator) = setup_test_env();
    let token_a = register_token(&env);
    let member2 = Address::generate(&env);

    let configs = build_token_configs(&env, &[(token_a.clone(), 100)]);

    let group_id = client.create_multi_token_group(
        &creator,
        &configs,
        &100_000_000i128,
        &604_800u64,
        &2u32,
        &86400u64,
        &5u32,
        &0u32,
    );
    client.join_group(&member2, &group_id);

    mint_tokens(&env, &token_a, &[creator.clone()], 200_000_000i128);
    client.contribute_with_token(&creator, &group_id, &token_a);

    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 604_800 + 86400 + 1;
    });

    // member2 hasn't contributed — should panic
    client.execute_multi_token_payout(&group_id);
}

#[test]
#[should_panic]
fn test_multi_token_payout_on_single_token_group() {
    let (env, client, creator) = setup_test_env();
    let token = register_token(&env);
    let member2 = Address::generate(&env);

    let group_id = client.create_group(
        &creator,
        &token,
        &100_000_000i128,
        &604_800u64,
        &2u32,
        &86400u64,
        &5u32,
        &0u32,
    );
    client.join_group(&member2, &group_id);

    mint_tokens(&env, &token, &[creator.clone(), member2.clone()], 200_000_000i128);
    client.contribute(&creator, &group_id);
    client.contribute(&member2, &group_id);

    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 604_800 + 86400 + 1;
    });

    // execute_multi_token_payout on a single-token group — should panic
    client.execute_multi_token_payout(&group_id);
}

// ── Backward compatibility ────────────────────────────────────────────────

#[test]
fn test_backward_compat_single_token_flow() {
    let (env, client, creator) = setup_test_env();
    let token = register_token(&env);
    let member2 = Address::generate(&env);

    let group_id = client.create_group(
        &creator,
        &token,
        &100_000_000i128,
        &604_800u64,
        &2u32,
        &86400u64,
        &5u32,
        &0u32,
    );
    client.join_group(&member2, &group_id);

    assert_eq!(client.is_multi_token_group(&group_id), false);

    mint_tokens(&env, &token, &[creator.clone(), member2.clone()], 200_000_000i128);

    // Original contribute still works
    client.contribute(&creator, &group_id);
    client.contribute(&member2, &group_id);

    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + 604_800 + 86400 + 1;
    });

    // Original execute_payout still works
    client.execute_payout(&group_id);

    let group = client.get_group(&group_id);
    assert_eq!(group.payout_index, 1);
    assert_eq!(group.current_cycle, 2);
}

// ── Token equivalence ─────────────────────────────────────────────────────

#[test]
fn test_token_equivalence_high_weight_less_required() {
    let (env, client, creator) = setup_test_env();
    let token_a = register_token(&env);
    let token_b = register_token(&env);

    // token_b has higher weight (200 vs 100), so it needs LESS
    // required = 100_000_000 * 100 / 200 = 50_000_000
    let configs = build_token_configs(&env, &[(token_a.clone(), 100), (token_b.clone(), 200)]);

    let group_id = client.create_multi_token_group(
        &creator,
        &configs,
        &100_000_000i128,
        &604_800u64,
        &3u32,
        &86400u64,
        &5u32,
        &0u32,
    );

    mint_tokens(&env, &token_b, &[creator.clone()], 200_000_000i128);

    client.contribute_with_token(&creator, &group_id, &token_b);

    let tk_record = client.get_token_contribution(&group_id, &1u32, &creator);
    assert_eq!(tk_record.amount, 50_000_000i128);
}

#[test]
fn test_create_multi_token_group_single_token() {
    let (env, client, creator) = setup_test_env();
    let token_a = register_token(&env);

    let configs = build_token_configs(&env, &[(token_a.clone(), 100)]);

    let group_id = client.create_multi_token_group(
        &creator,
        &configs,
        &100_000_000i128,
        &604_800u64,
        &3u32,
        &86400u64,
        &5u32,
        &0u32,
    );

    assert_eq!(client.is_multi_token_group(&group_id), true);

    let accepted = client.get_accepted_tokens(&group_id);
    assert_eq!(accepted.len(), 1);
}
