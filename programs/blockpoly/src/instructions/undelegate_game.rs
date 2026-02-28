use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::Instruction, program::invoke};
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::state::GameState;

use super::delegate_game::DELEGATION_PROGRAM;

#[derive(Accounts)]
#[instruction(game_id: [u8; 32])]
pub struct UndelegateGame<'info> {
    #[account(mut)]
    pub host: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_GAME_STATE, &game_id],
        bump = game_state.bump,
        constraint = game_state.host == host.key() @ BlockpolyError::HostOnly,
    )]
    pub game_state: Account<'info, GameState>,

    /// CHECK: MagicBlock delegation program
    #[account(address = DELEGATION_PROGRAM)]
    pub delegation_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    // remaining_accounts: PlayerState PDAs to undelegate
}

pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, UndelegateGame<'info>>,
    _game_id: [u8; 32],
) -> Result<()> {
    let host_info = ctx.accounts.host.to_account_info();
    let game_info = ctx.accounts.game_state.to_account_info();
    let delegation_info = ctx.accounts.delegation_program.to_account_info();
    let system_info = ctx.accounts.system_program.to_account_info();

    // Undelegate GameState
    undelegate_single_account(
        &game_info,
        &host_info,
        &delegation_info,
        &system_info,
    )?;

    // Undelegate each PlayerState passed as remaining_accounts
    for player_acc in ctx.remaining_accounts.iter() {
        undelegate_single_account(
            player_acc,
            &host_info,
            &delegation_info,
            &system_info,
        )?;
    }

    Ok(())
}

fn undelegate_single_account<'a>(
    account: &AccountInfo<'a>,
    payer: &AccountInfo<'a>,
    delegation_program: &AccountInfo<'a>,
    system_program: &AccountInfo<'a>,
) -> Result<()> {
    let ix = Instruction {
        program_id: DELEGATION_PROGRAM,
        accounts: vec![
            AccountMeta::new(payer.key(), true),
            AccountMeta::new(account.key(), false),
            AccountMeta::new_readonly(crate::ID, false),
            AccountMeta::new_readonly(system_program.key(), false),
        ],
        data: vec![1], // undelegate discriminator
    };
    invoke(
        &ix,
        &[
            payer.clone(),
            account.clone(),
            delegation_program.clone(),
            system_program.clone(),
        ],
    )?;
    Ok(())
}
