"use client";

import { BoardSpace } from "@/lib/board-data";
import { PropertyStateData } from "@/stores/gameStore";
import { GROUP_COLORS, GROUP_NAMES, SPACE_TYPES } from "@/lib/constants";

interface PropertyCardProps {
  space: BoardSpace;
  property?: PropertyStateData;
  onClose: () => void;
}

export function PropertyCard({ space, property, onClose }: PropertyCardProps) {
  const groupColor = GROUP_COLORS[space.group] ?? "#333";
  const groupName = GROUP_NAMES[space.group] ?? "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="card w-72 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with group color */}
        <div
          className="p-4 text-center"
          style={{ background: groupColor, minHeight: "80px" }}
        >
          <div className="text-xs font-semibold text-white/80 uppercase tracking-wider">
            {groupName}
          </div>
          <div className="text-xl font-bold text-white mt-1">{space.name}</div>
        </div>

        {/* Rent table */}
        <div className="p-4 space-y-2 text-sm">
          {space.type === SPACE_TYPES.PROPERTY && (
            <>
              <RentRow label="Base Rent" value={space.baseRent} />
              <RentRow label="1 Liquidity Pool" value={space.lpRents[0]} />
              <RentRow label="2 Liquidity Pools" value={space.lpRents[1]} />
              <RentRow label="3 Liquidity Pools" value={space.lpRents[2]} />
              <RentRow label="4 Liquidity Pools" value={space.lpRents[3]} />
              <RentRow label="Full Protocol" value={space.protocolRent} highlight />
              <div className="border-t border-[#1a1a3e] pt-2 mt-2">
                <RentRow label="LP Pool Cost" value={space.lpCost} muted />
                <RentRow label="Mortgage Value" value={space.mortgageValue} muted />
              </div>
            </>
          )}

          {space.type === SPACE_TYPES.BRIDGE && (
            <>
              <RentRow label="1 Bridge" value={space.bridgeRents[0]} />
              <RentRow label="2 Bridges" value={space.bridgeRents[1]} />
              <RentRow label="3 Bridges" value={space.bridgeRents[2]} />
              <RentRow label="4 Bridges" value={space.bridgeRents[3]} />
              <div className="border-t border-[#1a1a3e] pt-2 mt-2">
                <RentRow label="Mortgage Value" value={space.mortgageValue} muted />
              </div>
            </>
          )}

          {space.type === SPACE_TYPES.UTILITY && (
            <>
              <div className="text-slate-400 text-xs">
                If 1 owned: Roll dice × 4 BPOLY
              </div>
              <div className="text-slate-400 text-xs">
                If both owned: Roll dice × 10 BPOLY
              </div>
            </>
          )}

          {/* Owner info */}
          {property && (
            <div className="border-t border-[#1a1a3e] pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Owner</span>
                <span className="font-mono text-slate-300 text-[10px]">
                  {property.owner.toString().slice(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">LPs Built</span>
                <span className="text-[#00ff88]">{property.liquidityPools}</span>
              </div>
              {property.isFullProtocol && (
                <div className="text-[#ffd700] text-xs text-center font-semibold">
                  FULL PROTOCOL
                </div>
              )}
              {property.isMortgaged && (
                <div className="text-red-400 text-xs text-center font-semibold">
                  MORTGAGED
                </div>
              )}
            </div>
          )}

          {!property && space.price > 0 && (
            <div className="border-t border-[#1a1a3e] pt-2 mt-2 text-center">
              <div className="text-slate-400 text-xs">Price</div>
              <div className="bpoly-amount text-lg">{space.price} BPOLY</div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors border-t border-[#1a1a3e]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function RentRow({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between text-xs">
      <span className={muted ? "text-slate-500" : "text-slate-400"}>{label}</span>
      <span
        className={`font-mono font-semibold ${
          highlight
            ? "text-[#ffd700]"
            : muted
            ? "text-slate-500"
            : "text-slate-200"
        }`}
      >
        {value} BPOLY
      </span>
    </div>
  );
}
