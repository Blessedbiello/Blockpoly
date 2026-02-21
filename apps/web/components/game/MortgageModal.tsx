"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { BOARD } from "@/lib/board-data";
import { GROUP_COLORS, GROUP_NAMES } from "@/lib/constants";

interface MortgageModalProps {
  onMortgage: (spaceIndex: number) => void;
  onUnmortgage: (spaceIndex: number) => void;
}

export function MortgageModal({ onMortgage, onUnmortgage }: MortgageModalProps) {
  const { activeModal, myWallet, playerStates, properties, closeModal } = useGameStore();
  const [selected, setSelected] = useState<number | null>(null);

  if (activeModal !== "mortgage") return null;

  const myState = myWallet ? playerStates.get(myWallet) : undefined;
  const ownedSpaces = myState?.propertiesOwned ?? [];

  const selectedProp = selected !== null ? properties.get(selected) : undefined;
  const selectedSpace = selected !== null ? BOARD[selected] : null;

  const mortgageValue = selectedSpace ? Math.floor((selectedSpace.price ?? 0) / 2) : 0;
  const unmortgageCost = selectedSpace
    ? Math.floor((selectedSpace.price ?? 0) / 2 * 1.1)
    : 0;

  const canUnmortgage =
    selectedProp?.isMortgaged &&
    myState &&
    myState.bpolyBalance >= BigInt(unmortgageCost * 1_000_000);

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
          <div className="text-lg font-bold text-white">Mortgage Properties</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Receive 50% of price · Unmortgage at 110%
          </div>
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
                <span className="text-xs flex-shrink-0">
                  {prop?.isMortgaged ? (
                    <span className="text-amber-400">📋 Mortgaged</span>
                  ) : prop?.liquidityPools && prop.liquidityPools > 0 ? (
                    <span className="text-slate-500">🏊 Has LPs</span>
                  ) : (
                    <span className="text-slate-500">
                      {Math.floor((space?.price ?? 0) / 2)} BPOLY
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Actions for selected property */}
        {selected !== null && selectedSpace && (
          <div className="border-t border-[#1a1a3e] pt-4 space-y-3">
            <div className="bg-[#0d0d22] rounded-lg p-3 text-sm space-y-1.5">
              <div className="font-semibold text-white">{selectedSpace.name}</div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Mortgage value</span>
                <span className="text-slate-300">{mortgageValue} BPOLY</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Unmortgage cost</span>
                <span className="text-slate-300">{unmortgageCost} BPOLY</span>
              </div>
              {selectedProp?.isMortgaged && (
                <div className="text-xs text-amber-400">Currently mortgaged</div>
              )}
            </div>

            {selectedProp?.isMortgaged ? (
              <button
                onClick={() => {
                  onUnmortgage(selected);
                  closeModal();
                }}
                disabled={!canUnmortgage}
                className="btn-success w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Unmortgage ({unmortgageCost} BPOLY)
              </button>
            ) : selectedProp?.liquidityPools && selectedProp.liquidityPools > 0 ? (
              <p className="text-xs text-slate-500 text-center">
                Sell all LPs before mortgaging.
              </p>
            ) : (
              <button
                onClick={() => {
                  onMortgage(selected);
                  closeModal();
                }}
                className="btn-danger w-full"
              >
                Mortgage (+{mortgageValue} BPOLY)
              </button>
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
