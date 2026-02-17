use anchor_lang::prelude::*;

#[error_code]
pub enum BlockpolyError {
    #[msg("Game is not in waiting state")]
    GameNotWaiting,
    #[msg("Game is full")]
    GameFull,
    #[msg("Game has not started")]
    GameNotStarted,
    #[msg("Game is already finished")]
    GameFinished,
    #[msg("Not your turn")]
    NotYourTurn,
    #[msg("Wrong turn phase for this action")]
    WrongTurnPhase,
    #[msg("VRF request is pending — wait for randomness callback")]
    VRFPending,
    #[msg("No VRF request is active")]
    VRFNotRequested,
    #[msg("Property is not available for purchase")]
    PropertyNotAvailable,
    #[msg("Property is already owned")]
    PropertyAlreadyOwned,
    #[msg("Property is mortgaged")]
    PropertyMortgaged,
    #[msg("Insufficient BPOLY balance")]
    InsufficientBalance,
    #[msg("You do not own this property")]
    NotPropertyOwner,
    #[msg("You must own the complete color group to build")]
    IncompleteColorSet,
    #[msg("Must build evenly across all properties in the color group")]
    UnevenBuilding,
    #[msg("Maximum number of Liquidity Pools reached (4)")]
    MaxLPsReached,
    #[msg("Property already has Full Protocol status")]
    MaxProtocolReached,
    #[msg("Player is currently in the Rug Pull Zone")]
    PlayerInRugPullZone,
    #[msg("Player has declared bankruptcy")]
    PlayerBankrupt,
    #[msg("Only the game host can perform this action")]
    HostOnly,
    #[msg("A flash loan is already active")]
    FlashLoanAlreadyActive,
    #[msg("Flash loan is overdue — repay before taking new actions")]
    FlashLoanOverdue,
    #[msg("Cannot repay flash loan yet — not enough turns have passed")]
    FlashLoanTooEarly,
    #[msg("Three consecutive doubles — go to Rug Pull Zone")]
    TripleDoublesGoToJail,
    #[msg("Invalid board space index")]
    InvalidSpaceIndex,
    #[msg("Card deck is exhausted")]
    DeckExhausted,
    #[msg("No auction is currently active")]
    AuctionNotActive,
    #[msg("Auction has already been won")]
    AuctionAlreadyWon,
    #[msg("Invalid trade offer")]
    InvalidTradeOffer,
    #[msg("Trade offer has expired")]
    TradeExpired,
    #[msg("Cannot mortgage a property that has buildings")]
    CannotMortgageWithBuildings,
    #[msg("Bid must be higher than current highest bid")]
    BidTooLow,
    #[msg("Cannot unmortgage — insufficient balance")]
    CannotUnmortgage,
    #[msg("Player is not in the Rug Pull Zone")]
    NotInRugPullZone,
    #[msg("Player is still in Rug Pull Zone — wait for escape attempt")]
    StillInRugPullZone,
    #[msg("No Get Out of Rug Pull Free card held")]
    NoJailFreeCard,
    #[msg("Dice not yet rolled this turn")]
    DiceNotRolled,
    #[msg("Landing effect has already been resolved")]
    LandingAlreadyResolved,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Invalid player count — need 2 to 8 players")]
    InvalidPlayerCount,
    #[msg("Player already joined this game")]
    AlreadyJoined,
    #[msg("Trade recipient not in this game")]
    RecipientNotInGame,
}
