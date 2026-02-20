"use client";

import { motion } from "framer-motion";

interface PlayerTokenProps {
  wallet: string;
  color: string;
  index: number;
  isCurrentPlayer: boolean;
}

export function PlayerToken({
  wallet,
  color,
  index,
  isCurrentPlayer,
}: PlayerTokenProps) {
  const shortWallet = wallet.slice(0, 2).toUpperCase();

  // Offset tokens so they don't overlap when multiple players on same space
  const offsetX = (index % 2) * 14 - 7;
  const offsetY = Math.floor(index / 2) * 14 - 7;

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="absolute pointer-events-none z-10"
      style={{
        bottom: `calc(50% + ${offsetY}px)`,
        left: `calc(50% + ${offsetX}px)`,
        transform: "translate(-50%, 50%)",
      }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white shadow-lg"
        style={{
          background: color,
          boxShadow: isCurrentPlayer
            ? `0 0 8px ${color}, 0 0 12px ${color}55`
            : `0 2px 4px rgba(0,0,0,0.5)`,
          border: isCurrentPlayer ? "1px solid white" : "1px solid rgba(255,255,255,0.3)",
        }}
      >
        {shortWallet}
      </div>
    </motion.div>
  );
}
