"use client";

import { useState } from "react";
import { BoardSpace as BoardSpaceData } from "@/lib/board-data";
import { PropertyStateData } from "@/stores/gameStore";
import { GROUP_COLORS, SPACE_TYPES } from "@/lib/constants";
import { PropertyCard } from "./PropertyCard";

interface BoardSpaceProps {
  space: BoardSpaceData;
  property?: PropertyStateData;
  isHighlighted: boolean;
  isCorner: boolean;
  rotation: number; // 0=bottom, 90=left, 180=top, 270=right
}

const SPACE_TYPE_ICONS: Record<number, string> = {
  [SPACE_TYPES.GENESIS]: "⊕",
  [SPACE_TYPES.CARD_ALPHA]: "📡",
  [SPACE_TYPES.CARD_GOVERNANCE]: "🗳",
  [SPACE_TYPES.TAX]: "💸",
  [SPACE_TYPES.RUGPULL]: "🔒",
  [SPACE_TYPES.GO_TO_JAIL]: "🚨",
  [SPACE_TYPES.FREE_PARKING]: "☀",
};

export function BoardSpace({
  space,
  property,
  isHighlighted,
  isCorner,
  rotation,
}: BoardSpaceProps) {
  const [showCard, setShowCard] = useState(false);
  const groupColor = GROUP_COLORS[space.group] ?? "transparent";
  const isProperty =
    space.type === SPACE_TYPES.PROPERTY ||
    space.type === SPACE_TYPES.BRIDGE ||
    space.type === SPACE_TYPES.UTILITY;

  const shortName = space.name.length > 10 ? space.name.slice(0, 9) + "…" : space.name;

  return (
    <div
      className={`
        relative w-full h-full flex flex-col cursor-pointer select-none
        border border-[#1a1a3e] overflow-hidden transition-all
        ${isHighlighted ? "ring-2 ring-[#00ff88]" : ""}
        ${isCorner ? "bg-[#0f0f2a]" : "bg-[#080816]"}
        hover:bg-[#0d0d22]
      `}
      style={{ transform: `rotate(${rotation}deg)` }}
      onClick={() => isProperty && setShowCard(true)}
    >
      {/* Color bar at top (for properties) */}
      {isProperty && space.group !== 255 && (
        <div
          className="w-full"
          style={{
            height: "20%",
            background: groupColor,
            opacity: 0.85,
          }}
        />
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-0.5 gap-0.5">
        {/* Space icon for non-property types */}
        {!isProperty && (
          <span className="text-base leading-none">
            {SPACE_TYPE_ICONS[space.type] ?? ""}
          </span>
        )}

        {/* Name */}
        <span className="text-[8px] leading-tight text-center text-slate-300 font-medium">
          {shortName}
        </span>

        {/* Price */}
        {space.price > 0 && (
          <span className="text-[7px] text-[#ffd700] font-mono">
            {space.price}
          </span>
        )}

        {/* Building markers */}
        {property && (property.liquidityPools > 0 || property.isFullProtocol) && (
          <div className="flex gap-0.5">
            {property.isFullProtocol ? (
              <span className="text-[8px]">🏛</span>
            ) : (
              Array.from({ length: property.liquidityPools }).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 bg-[#00ff88] rounded-sm" />
              ))
            )}
          </div>
        )}

        {/* Mortgage indicator */}
        {property?.isMortgaged && (
          <span className="text-[7px] text-red-400">MTGD</span>
        )}
      </div>

      {/* Owner color indicator */}
      {property && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ background: "#9945ff" }}
        />
      )}

      {/* Property detail card on hover */}
      {showCard && isProperty && (
        <PropertyCard
          space={space}
          property={property}
          onClose={() => setShowCard(false)}
        />
      )}
    </div>
  );
}
