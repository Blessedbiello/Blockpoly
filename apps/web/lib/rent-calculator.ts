import { BOARD, GROUP_MEMBERS } from "./board-data";
import { SPACE_TYPES } from "./constants";

export interface RentParams {
  spaceIndex: number;
  liquidityPools: number;
  isFullProtocol: boolean;
  isMortgaged: boolean;
  ownerProperties: number[]; // all spaces owned by the landlord
  diceTotalForUtility: number;
  bullRunActive: boolean;
}

export function calculateRent(params: RentParams): number {
  const {
    spaceIndex,
    liquidityPools,
    isFullProtocol,
    isMortgaged,
    ownerProperties,
    diceTotalForUtility,
    bullRunActive,
  } = params;

  if (isMortgaged) return 0;

  const space = BOARD[spaceIndex];
  let rent = 0;

  if (space.type === SPACE_TYPES.BRIDGE) {
    const bridgesOwned = ownerProperties.filter(
      (p) => BOARD[p].type === SPACE_TYPES.BRIDGE
    ).length;
    rent = space.bridgeRents[Math.min(bridgesOwned - 1, 3)];
  } else if (space.type === SPACE_TYPES.UTILITY) {
    const utilitiesOwned = ownerProperties.filter(
      (p) => BOARD[p].type === SPACE_TYPES.UTILITY
    ).length;
    const multiplier = utilitiesOwned >= 2 ? 10 : 4;
    rent = diceTotalForUtility * multiplier;
  } else if (space.type === SPACE_TYPES.PROPERTY) {
    if (isFullProtocol) {
      rent = space.protocolRent;
    } else if (liquidityPools > 0) {
      rent = space.lpRents[liquidityPools - 1];
    } else {
      // Check monopoly (all group members owned by same player)
      const groupMembers = GROUP_MEMBERS[space.group] ?? [];
      const hasMonopoly = groupMembers.every((m) => ownerProperties.includes(m));
      rent = hasMonopoly ? space.baseRent * 2 : space.baseRent;

      // Bull Run doubles base rent
      if (bullRunActive && hasMonopoly) {
        rent = space.baseRent * 2; // already doubled, no stack
      } else if (bullRunActive) {
        rent = rent * 2;
      }
    }
  }

  return rent;
}
