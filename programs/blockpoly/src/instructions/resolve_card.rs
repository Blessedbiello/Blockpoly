use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::board::{BOARD, nearest_bridge_ahead};
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::{BullRunActivated, CardResolved, RugPullEntered};
use crate::state::{GameState, GameStatus, PlayerState, PlayerStatus, TurnPhase};

/// Resolves card effects for both Alpha Call and Governance Vote decks.
/// Card IDs are 0-indexed (0 = card 1 in the plan).
#[derive(Accounts)]
#[instruction(game_id: [u8; 32])]
pub struct ResolveCard<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_GAME_STATE, &game_id],
        bump = game_state.bump,
    )]
    pub game_state: Account<'info, GameState>,

    #[account(
        mut,
        seeds = [SEED_PLAYER_STATE, &game_id, player.key().as_ref()],
        bump = player_state.bump,
        constraint = player_state.wallet == player.key() @ BlockpolyError::NotYourTurn,
    )]
    pub player_state: Account<'info, PlayerState>,

    /// CHECK: bank vault PDA
    #[account(seeds = [SEED_BANK_VAULT, &game_id], bump)]
    pub bank_vault: UncheckedAccount<'info>,

    #[account(mut, address = game_state.bank_bpoly_ata)]
    pub bank_bpoly_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = game_state.bpoly_mint,
        associated_token::authority = player,
    )]
    pub player_bpoly_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<ResolveCard>,
    game_id: [u8; 32],
    deck_type: u8, // 0 = alpha_call, 1 = governance
    card_id: u8,   // 0-15
    // Additional parameters for cards that need them (e.g., last dice roll, LP counts)
    extra_param: u64,
) -> Result<()> {
    {
        let game = &ctx.accounts.game_state;
        let player = &ctx.accounts.player_state;
        require!(game.status == GameStatus::InProgress, BlockpolyError::GameNotStarted);
        require!(
            game.current_player_index == player.player_index,
            BlockpolyError::NotYourTurn
        );
    }

    let bank_vault_bump = ctx.bumps.bank_vault;
    let signer_seeds: &[&[&[u8]]] = &[&[SEED_BANK_VAULT, &game_id, &[bank_vault_bump]]];

    let effect_desc = if deck_type == 0 {
        resolve_alpha_call(
            card_id,
            &mut ctx.accounts.game_state,
            &mut ctx.accounts.player_state,
            &ctx.accounts.token_program,
            &ctx.accounts.bank_bpoly_ata,
            &ctx.accounts.player_bpoly_ata,
            &ctx.accounts.bank_vault,
            &ctx.accounts.player,
            extra_param,
            signer_seeds,
        )?
    } else {
        resolve_governance_vote(
            card_id,
            &mut ctx.accounts.game_state,
            &mut ctx.accounts.player_state,
            &ctx.accounts.token_program,
            &ctx.accounts.bank_bpoly_ata,
            &ctx.accounts.player_bpoly_ata,
            &ctx.accounts.bank_vault,
            &ctx.accounts.player,
            extra_param,
            signer_seeds,
        )?
    };

    let player_key = ctx.accounts.player.key();
    emit!(CardResolved {
        game_id,
        player: player_key,
        card_id,
        effect: effect_desc.to_string(),
    });

    ctx.accounts.game_state.pending_dice = None;
    ctx.accounts.game_state.advance_turn();

    Ok(())
}

fn resolve_alpha_call<'info>(
    card_id: u8,
    game: &mut GameState,
    player: &mut PlayerState,
    token_program: &Program<'info, Token>,
    bank_bpoly_ata: &Account<'info, TokenAccount>,
    player_bpoly_ata: &Account<'info, TokenAccount>,
    bank_vault: &UncheckedAccount<'info>,
    player_signer: &Signer<'info>,
    extra_param: u64,
    signer_seeds: &[&[&[u8]]],
) -> Result<&'static str> {
    let bank_vault_bump_bytes = signer_seeds[0][2];
    match card_id {
        0 => {
            // Advance to Genesis Block, collect 200 BPOLY
            player.position = SPACE_GENESIS;
            let cpi_ctx = CpiContext::new_with_signer(
                token_program.to_account_info(),
                Transfer {
                    from: bank_bpoly_ata.to_account_info(),
                    to: player_bpoly_ata.to_account_info(),
                    authority: bank_vault.to_account_info(),
                },
                signer_seeds,
            );
            token::transfer(cpi_ctx, GENESIS_SALARY)?;
            player.bpoly_balance = player.bpoly_balance.saturating_add(GENESIS_SALARY);
            Ok("Advance to Genesis Block")
        }
        1 => {
            // Advance to Solana (space 39), collect 200 if passing GO
            let old_pos = player.position;
            player.position = 39;
            if old_pos > 39 || old_pos == 0 {
                // no pass
            } else if old_pos < 39 {
                // no pass unless wrapping
            }
            // Simplified: if current position > 39 position, passed genesis
            let passed = player.position < old_pos && old_pos != 0;
            if passed {
                let cpi_ctx = CpiContext::new_with_signer(
                    token_program.to_account_info(),
                    Transfer {
                        from: bank_bpoly_ata.to_account_info(),
                        to: player_bpoly_ata.to_account_info(),
                        authority: bank_vault.to_account_info(),
                    },
                    signer_seeds,
                );
                token::transfer(cpi_ctx, GENESIS_SALARY)?;
                player.bpoly_balance = player.bpoly_balance.saturating_add(GENESIS_SALARY);
            }
            Ok("Advance to Solana")
        }
        2 => {
            // Advance to nearest bridge; pay 2× rent if owned
            let nearest = nearest_bridge_ahead(player.position);
            player.position = nearest;
            Ok("Advance to Nearest Bridge")
        }
        3 => {
            // Advance to Wormhole (space 5)
            let old_pos = player.position;
            player.position = 5;
            if old_pos > 5 {
                // passed genesis
                let cpi_ctx = CpiContext::new_with_signer(
                    token_program.to_account_info(),
                    Transfer {
                        from: bank_bpoly_ata.to_account_info(),
                        to: player_bpoly_ata.to_account_info(),
                        authority: bank_vault.to_account_info(),
                    },
                    signer_seeds,
                );
                token::transfer(cpi_ctx, GENESIS_SALARY)?;
                player.bpoly_balance = player.bpoly_balance.saturating_add(GENESIS_SALARY);
            }
            Ok("Advance to Wormhole")
        }
        4 => {
            // Staking Rewards: collect 50 BPOLY
            let amount = 50_000_000u64;
            let cpi_ctx = CpiContext::new_with_signer(
                token_program.to_account_info(),
                Transfer {
                    from: bank_bpoly_ata.to_account_info(),
                    to: player_bpoly_ata.to_account_info(),
                    authority: bank_vault.to_account_info(),
                },
                signer_seeds,
            );
            token::transfer(cpi_ctx, amount)?;
            player.bpoly_balance = player.bpoly_balance.saturating_add(amount);
            Ok("Staking Rewards")
        }
        5 => {
            // Get Out of Rug Pull Free
            player.has_jail_free_card = true;
            player.jail_free_card_type = 1; // alpha_call
            Ok("Get Out of Rug Pull Free")
        }
        6 => {
            // MEV Bot Attack: pay dice roll × 4 BPOLY
            // extra_param = last dice roll total
            let toll = extra_param.saturating_mul(4_000_000);
            let cpi_ctx = CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: player_bpoly_ata.to_account_info(),
                    to: bank_bpoly_ata.to_account_info(),
                    authority: player_signer.to_account_info(),
                },
            );
            token::transfer(cpi_ctx, toll)?;
            player.bpoly_balance = player.bpoly_balance.saturating_sub(toll);
            Ok("MEV Bot Attack")
        }
        7 => {
            // Market Crash: lose 20% of balance
            let loss = player.bpoly_balance / 5;
            if loss > 0 {
                let cpi_ctx = CpiContext::new(
                    token_program.to_account_info(),
                    Transfer {
                        from: player_bpoly_ata.to_account_info(),
                        to: bank_bpoly_ata.to_account_info(),
                        authority: player_signer.to_account_info(),
                    },
                );
                token::transfer(cpi_ctx, loss)?;
                player.bpoly_balance = player.bpoly_balance.saturating_sub(loss);
            }
            Ok("Market Crash")
        }
        8 => {
            // Bull Run: all property rents doubled for next full round
            game.bull_run_active = true;
            game.bull_run_ends_round = game.round_number + 1;
            emit!(BullRunActivated {
                game_id: game.game_id,
                ends_round: game.bull_run_ends_round,
            });
            Ok("Bull Run")
        }
        9 => {
            // 51% Attack: steal last rent payment
            let amount = game.last_rent_amount;
            if amount > 0 {
                let cpi_ctx = CpiContext::new_with_signer(
                    token_program.to_account_info(),
                    Transfer {
                        from: bank_bpoly_ata.to_account_info(),
                        to: player_bpoly_ata.to_account_info(),
                        authority: bank_vault.to_account_info(),
                    },
                    signer_seeds,
                );
                token::transfer(cpi_ctx, amount)?;
                player.bpoly_balance = player.bpoly_balance.saturating_add(amount);
                game.last_rent_amount = 0;
            }
            Ok("51% Attack")
        }
        10 => {
            // Flash Loan: receive 200 BPOLY now
            require!(!player.flash_loan_active, BlockpolyError::FlashLoanAlreadyActive);
            let cpi_ctx = CpiContext::new_with_signer(
                token_program.to_account_info(),
                Transfer {
                    from: bank_bpoly_ata.to_account_info(),
                    to: player_bpoly_ata.to_account_info(),
                    authority: bank_vault.to_account_info(),
                },
                signer_seeds,
            );
            token::transfer(cpi_ctx, FLASH_LOAN_AMOUNT)?;
            player.bpoly_balance = player.bpoly_balance.saturating_add(FLASH_LOAN_AMOUNT);
            player.flash_loan_active = true;
            player.flash_loan_repay_amount = FLASH_LOAN_REPAY;
            player.flash_loan_due_turn = game.turn_number + game.player_count as u32;
            Ok("Flash Loan")
        }
        11 => {
            // Protocol Hack: lose cheapest unprotected property (handled via remaining_accounts in real impl)
            // For now: mark turn as ended
            Ok("Protocol Hack")
        }
        12 => {
            // Go Back 3 Spaces
            let new_pos = if player.position < 3 {
                40 - (3 - player.position)
            } else {
                player.position - 3
            };
            player.position = new_pos;
            Ok("Go Back 3 Spaces")
        }
        13 => {
            // SEC Investigation: go directly to Rug Pull Zone
            player.position = SPACE_RUGPULL_ZONE;
            player.rugpull_turns_remaining = RUGPULL_MAX_TURNS;
            player.status = PlayerStatus::InRugPullZone;
            emit!(RugPullEntered {
                game_id: game.game_id,
                player: player.wallet,
                reason: 1,
            });
            Ok("SEC Investigation")
        }
        14 => {
            // Whale Dump: lose most expensive property at 50% (complex — skip for now, mark TODO)
            Ok("Whale Dump")
        }
        15 => {
            // Airdrop Season: advance to nearest unowned property, buy at 50%
            let nearest = crate::board::nearest_property_ahead(player.position);
            player.position = nearest;
            Ok("Airdrop Season")
        }
        _ => Ok("Unknown Alpha Call"),
    }
}

fn resolve_governance_vote<'info>(
    card_id: u8,
    game: &mut GameState,
    player: &mut PlayerState,
    token_program: &Program<'info, Token>,
    bank_bpoly_ata: &Account<'info, TokenAccount>,
    player_bpoly_ata: &Account<'info, TokenAccount>,
    bank_vault: &UncheckedAccount<'info>,
    player_signer: &Signer<'info>,
    extra_param: u64,
    signer_seeds: &[&[&[u8]]],
) -> Result<&'static str> {
    match card_id {
        0 => {
            // Protocol Treasury Release: collect 200 BPOLY
            let cpi_ctx = CpiContext::new_with_signer(
                token_program.to_account_info(),
                Transfer {
                    from: bank_bpoly_ata.to_account_info(),
                    to: player_bpoly_ata.to_account_info(),
                    authority: bank_vault.to_account_info(),
                },
                signer_seeds,
            );
            token::transfer(cpi_ctx, 200_000_000)?;
            player.bpoly_balance = player.bpoly_balance.saturating_add(200_000_000);
            Ok("Protocol Treasury Release")
        }
        1 => {
            // Validator Node Income: collect 100 BPOLY
            let cpi_ctx = CpiContext::new_with_signer(
                token_program.to_account_info(),
                Transfer {
                    from: bank_bpoly_ata.to_account_info(),
                    to: player_bpoly_ata.to_account_info(),
                    authority: bank_vault.to_account_info(),
                },
                signer_seeds,
            );
            token::transfer(cpi_ctx, 100_000_000)?;
            player.bpoly_balance = player.bpoly_balance.saturating_add(100_000_000);
            Ok("Validator Node Income")
        }
        2 => {
            // DAO Airdrop: collect 10 BPOLY from every other player
            // (multi-player transfer handled via remaining_accounts in full impl)
            // For now: take from bank as simplified version
            let per_player = 10_000_000u64;
            let total = per_player.saturating_mul(game.player_count.saturating_sub(1) as u64);
            if total > 0 {
                let cpi_ctx = CpiContext::new_with_signer(
                    token_program.to_account_info(),
                    Transfer {
                        from: bank_bpoly_ata.to_account_info(),
                        to: player_bpoly_ata.to_account_info(),
                        authority: bank_vault.to_account_info(),
                    },
                    signer_seeds,
                );
                token::transfer(cpi_ctx, total)?;
                player.bpoly_balance = player.bpoly_balance.saturating_add(total);
            }
            Ok("DAO Airdrop")
        }
        3 => {
            // Get Out of Rug Pull Free
            player.has_jail_free_card = true;
            player.jail_free_card_type = 2; // governance
            Ok("Get Out of Rug Pull Free")
        }
        4 => {
            // Smart Contract Exploit Found: go to Rug Pull Zone
            player.position = SPACE_RUGPULL_ZONE;
            player.rugpull_turns_remaining = RUGPULL_MAX_TURNS;
            player.status = PlayerStatus::InRugPullZone;
            emit!(RugPullEntered {
                game_id: game.game_id,
                player: player.wallet,
                reason: 1,
            });
            Ok("Smart Contract Exploit Found")
        }
        5 => {
            // Gas Fee Rebate: collect 50 BPOLY
            let cpi_ctx = CpiContext::new_with_signer(
                token_program.to_account_info(),
                Transfer {
                    from: bank_bpoly_ata.to_account_info(),
                    to: player_bpoly_ata.to_account_info(),
                    authority: bank_vault.to_account_info(),
                },
                signer_seeds,
            );
            token::transfer(cpi_ctx, 50_000_000)?;
            player.bpoly_balance = player.bpoly_balance.saturating_add(50_000_000);
            Ok("Gas Fee Rebate")
        }
        6 => {
            // Infrastructure Levy: pay 40 per LP + 115 per Full Protocol
            // extra_param encodes: lower 32 bits = lp_count, upper 32 bits = protocol_count
            let lp_count = (extra_param & 0xFFFFFFFF) as u64;
            let protocol_count = (extra_param >> 32) as u64;
            let levy = lp_count.saturating_mul(40_000_000)
                + protocol_count.saturating_mul(115_000_000);
            if levy > 0 {
                let cpi_ctx = CpiContext::new(
                    token_program.to_account_info(),
                    Transfer {
                        from: player_bpoly_ata.to_account_info(),
                        to: bank_bpoly_ata.to_account_info(),
                        authority: player_signer.to_account_info(),
                    },
                );
                token::transfer(cpi_ctx, levy)?;
                player.bpoly_balance = player.bpoly_balance.saturating_sub(levy);
            }
            Ok("Infrastructure Levy")
        }
        7 => {
            // Protocol Upgrade Vote: pay 100 BPOLY
            let cpi_ctx = CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: player_bpoly_ata.to_account_info(),
                    to: bank_bpoly_ata.to_account_info(),
                    authority: player_signer.to_account_info(),
                },
            );
            token::transfer(cpi_ctx, 100_000_000)?;
            player.bpoly_balance = player.bpoly_balance.saturating_sub(100_000_000);
            Ok("Protocol Upgrade Vote")
        }
        8 => {
            // Liquidity Mining Rewards: collect 25 BPOLY per LP
            let lp_count = extra_param; // caller passes total LP count
            let rewards = lp_count.saturating_mul(25_000_000);
            if rewards > 0 {
                let cpi_ctx = CpiContext::new_with_signer(
                    token_program.to_account_info(),
                    Transfer {
                        from: bank_bpoly_ata.to_account_info(),
                        to: player_bpoly_ata.to_account_info(),
                        authority: bank_vault.to_account_info(),
                    },
                    signer_seeds,
                );
                token::transfer(cpi_ctx, rewards)?;
                player.bpoly_balance = player.bpoly_balance.saturating_add(rewards);
            }
            Ok("Liquidity Mining Rewards")
        }
        9 => {
            // Token Unlock Cliff: pay 150 to every other player (simplified: pay to bank)
            let amount = 150_000_000u64.saturating_mul(game.player_count.saturating_sub(1) as u64);
            if amount > 0 {
                let cpi_ctx = CpiContext::new(
                    token_program.to_account_info(),
                    Transfer {
                        from: player_bpoly_ata.to_account_info(),
                        to: bank_bpoly_ata.to_account_info(),
                        authority: player_signer.to_account_info(),
                    },
                );
                token::transfer(cpi_ctx, amount)?;
                player.bpoly_balance = player.bpoly_balance.saturating_sub(amount);
            }
            Ok("Token Unlock Cliff")
        }
        10 => {
            // Bridge Exploited: if you own a bridge, lose it (simplified); else collect 50
            let own_bridge = extra_param > 0; // caller passes 1 if player owns a bridge
            if own_bridge {
                // Property loss handled via remaining_accounts in full impl
            } else {
                let cpi_ctx = CpiContext::new_with_signer(
                    token_program.to_account_info(),
                    Transfer {
                        from: bank_bpoly_ata.to_account_info(),
                        to: player_bpoly_ata.to_account_info(),
                        authority: bank_vault.to_account_info(),
                    },
                    signer_seeds,
                );
                token::transfer(cpi_ctx, 50_000_000)?;
                player.bpoly_balance = player.bpoly_balance.saturating_add(50_000_000);
            }
            Ok("Bridge Exploited")
        }
        11 => {
            // DAO Birthday Vote: all other players pay you 50 (simplified: receive from bank)
            let total = 50_000_000u64.saturating_mul(game.player_count.saturating_sub(1) as u64);
            let cpi_ctx = CpiContext::new_with_signer(
                token_program.to_account_info(),
                Transfer {
                    from: bank_bpoly_ata.to_account_info(),
                    to: player_bpoly_ata.to_account_info(),
                    authority: bank_vault.to_account_info(),
                },
                signer_seeds,
            );
            token::transfer(cpi_ctx, total)?;
            player.bpoly_balance = player.bpoly_balance.saturating_add(total);
            Ok("DAO Birthday Vote")
        }
        12 => {
            // Yield Farming Season: move to DeFi Summer (space 20), +200 if pass GO
            let old_pos = player.position;
            player.position = SPACE_DEFI_SUMMER;
            if old_pos > SPACE_DEFI_SUMMER {
                let cpi_ctx = CpiContext::new_with_signer(
                    token_program.to_account_info(),
                    Transfer {
                        from: bank_bpoly_ata.to_account_info(),
                        to: player_bpoly_ata.to_account_info(),
                        authority: bank_vault.to_account_info(),
                    },
                    signer_seeds,
                );
                token::transfer(cpi_ctx, GENESIS_SALARY)?;
                player.bpoly_balance = player.bpoly_balance.saturating_add(GENESIS_SALARY);
            }
            Ok("Yield Farming Season")
        }
        13 => {
            // Regulatory Compliance Fine: pay 50 BPOLY
            let cpi_ctx = CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: player_bpoly_ata.to_account_info(),
                    to: bank_bpoly_ata.to_account_info(),
                    authority: player_signer.to_account_info(),
                },
            );
            token::transfer(cpi_ctx, 50_000_000)?;
            player.bpoly_balance = player.bpoly_balance.saturating_sub(50_000_000);
            Ok("Regulatory Compliance Fine")
        }
        14 => {
            // NFT Royalty Income: collect 20 BPOLY per complete color set
            let set_count = extra_param; // caller passes number of complete sets owned
            let income = set_count.saturating_mul(20_000_000);
            if income > 0 {
                let cpi_ctx = CpiContext::new_with_signer(
                    token_program.to_account_info(),
                    Transfer {
                        from: bank_bpoly_ata.to_account_info(),
                        to: player_bpoly_ata.to_account_info(),
                        authority: bank_vault.to_account_info(),
                    },
                    signer_seeds,
                );
                token::transfer(cpi_ctx, income)?;
                player.bpoly_balance = player.bpoly_balance.saturating_add(income);
            }
            Ok("NFT Royalty Income")
        }
        15 => {
            // Rug Pull Insurance: if in RP zone exit free; else collect 75
            if player.is_in_rugpull() {
                player.rugpull_turns_remaining = 0;
                player.status = crate::state::PlayerStatus::Active;
                emit!(crate::events::RugPullExited {
                    game_id: game.game_id,
                    player: player.wallet,
                    method: 1,
                });
            } else {
                let cpi_ctx = CpiContext::new_with_signer(
                    token_program.to_account_info(),
                    Transfer {
                        from: bank_bpoly_ata.to_account_info(),
                        to: player_bpoly_ata.to_account_info(),
                        authority: bank_vault.to_account_info(),
                    },
                    signer_seeds,
                );
                token::transfer(cpi_ctx, 75_000_000)?;
                player.bpoly_balance = player.bpoly_balance.saturating_add(75_000_000);
            }
            Ok("Rug Pull Insurance")
        }
        _ => Ok("Unknown Governance Vote"),
    }
}
