"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { BOARD } from "@/lib/board-data";
import { GROUP_COLORS, GROUP_NAMES, SPACE_TYPES } from "@/lib/constants";

interface BuildModalProps {
  onBuildLP: (spaceIndex: number, siblingLpCounts: number[]) => void;
  onBuildProtocol: (spaceIndex: number) => void;
  onSellLP: (spaceIndex: number) => void;
}

export function BuildModal({ onBuildLP, onBuildProtocol, onSellLP }: BuildModalProps) {
  const { activeModal, myWallet, playerStates, properties, closeModal } = useGameStore();
  const [selected, setSelected] = useState<number | null>(null);

  if (activeModal !== "build") return null;

  const myState = myWallet ? playerStates.get(myWallet) : undefined;
  const ownedSpaces = myState?.propertiesOwned ?? [];

  const selectedSpace = selected !== null ? BOARD[selected] : null;
  const selectedProp = selected !== null ? properties.get(selected) : undefined;

  // Calculate sibling LP counts for the selected property's color group.
  function getSiblingLpCounts(spaceIndex: number): number[] {
    const space = BOARD[spaceIndex];
    if (!space || space.group === 255) return [];
    const siblings = BOARD.filter(
      (s) => s.group === space.group && s.index !== spaceIndex && s.type === SPACE_TYPES.PROPERTY
    );
    return siblings.map((s) => properties.get(s.index)?.liquidityPools ?? 0);
  }

  // Determine what actions are available for the selected property.
  const lps = selectedProp?.liquidityPools ?? 0;
  const canBuildLP = selected !== null && lps < 4 && !selectedProp?.isFullProtocol && !selectedProp?.isMortgaged;
  const canBuildProtocol = selected !== null && lps === 4 && !selectedProp?.isFullProtocol;
  const canSellLP = selected !== null && lps > 0 && !selectedProp?.isFullProtocol;
  const groupColor = selectedSpace ? (GROUP_COLORS[selectedSpace.group] ?? "#1a1a3e") : "#1a1a3e";
  const groupName = selectedSpace ? (GROUP_NAMES[selectedSpace.group] ?? "") : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={closeModal}
    >
      <div
        className="card w-96 p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="text-lg font-bold text-white">Build / Manage</div>
          <div className="text-xs text-slate-500 mt-0.5">Select a property to improve</div>
        </div>

        {/* Property list */}
        <div className="space-y-1.5">
          {ownedSpaces.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-3">No properties owned</p>
          )}
          {ownedSpaces.map((spaceIndex) => {
            const space = BOARD[spaceIndex];
            const prop = properties.get(spaceIndex);
            const color = GROUP_COLORS[space?.group ?? 255] ?? "#333";
            const lpsHere = prop?.liquidityPools ?? 0;
            return (
              <button
                key={spaceIndex}
                onClick={() => setSelected(spaceIndex === selected ? null : spaceIndex)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                  selected === spaceIndex
                    ? "border-[#9945ff] bg-[#9945ff]/10"
                    : "border-[#1a1a3e] bg-[#0d0d22] hover:border-[#9945ff]/40"
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span className="flex-1 text-left text-sm text-slate-200 truncate">
                  {space?.name ?? `Space ${spaceIndex}`}
                </span>
                <span className="text-xs text-slate-500 flex-shrink-0">
                  {prop?.isFullProtocol
                    ? "🏛 Protocol"
                    : prop?.isMortgaged
                    ? "📋 Mortgaged"
                    : lpsHere > 0
                    ? `${"🏊".repeat(lpsHere)} ${lpsHere} LP`
                    : "Unimproved"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Actions for selected property */}
        {selected !== null && selectedSpace && (
          <div className="border-t border-[#1a1a3e] pt-4 space-y-3">
            <div
              className="rounded-lg p-3 text-center"
              style={{ background: groupColor + "33" }}
            >
              <div className="text-xs text-slate-400">{groupName}</div>
              <div className="font-bold text-white">{selectedSpace.name}</div>
              {selectedProp && (
                <div className="text-xs text-slate-400 mt-1">
                  {selectedProp.liquidityPools} LP
                  {selectedProp.isFullProtocol ? " · Full Protocol" : ""}
                  {selectedProp.isMortgaged ? " · Mortgaged" : ""}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {canBuildLP && (
                <button
                  onClick={() => {
                    onBuildLP(selected, getSiblingLpCounts(selected));
                    closeModal();
                  }}
                  className="btn-success text-sm py-2"
                >
                  + Build LP
                  <div className="text-[10px] opacity-70">{selectedSpace.lpCost ?? 50} BPOLY</div>
                </button>
              )}
              {canBuildProtocol && (
                <button
                  onClick={() => {
                    onBuildProtocol(selected);
                    closeModal();
                  }}
                  className="btn-primary text-sm py-2"
                >
                  🏛 Full Protocol
                  <div className="text-[10px] opacity-70">{selectedSpace.lpCost * 4 || 200} BPOLY</div>
                </button>
              )}
              {canSellLP && (
                <button
                  onClick={() => {
                    onSellLP(selected);
                    closeModal();
                  }}
                  className="btn-secondary text-sm py-2"
                >
                  − Sell LP
                  <div className="text-[10px] opacity-70">50% refund</div>
                </button>
              )}
            </div>

            {!canBuildLP && !canBuildProtocol && !canSellLP && (
              <p className="text-xs text-slate-500 text-center">
                {selectedProp?.isMortgaged
                  ? "Cannot build on mortgaged property. Unmortgage it first."
                  : selectedProp?.isFullProtocol
                  ? "This property is at maximum development."
                  : "No build actions available."}
              </p>
            )}
          </div>
        )}

        <button onClick={closeModal} className="btn-secondary w-full text-sm">
          Close
        </button>
      </div>
    </div>
  );
}
