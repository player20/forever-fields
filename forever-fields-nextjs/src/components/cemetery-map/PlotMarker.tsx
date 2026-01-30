"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { PawPrint, Flower2, Flame, User } from "lucide-react";
import type { MemorialPlot } from "./types";

interface PlotMarkerProps {
  plot: MemorialPlot;
  isSelected?: boolean;
  onClick?: () => void;
}

export function PlotMarker({ plot, isSelected, onClick }: PlotMarkerProps) {
  const isPet = plot.type === "pet";
  const initials = plot.name.split(' ').map(n => n[0]).join('').substring(0, 2);

  return (
    <motion.button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group focus:outline-none relative"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Glow effect for memorial plots */}
      {plot.hasMemorial && (
        <motion.div
          className={`absolute top-0 left-1/2 -translate-x-1/2 ${isPet ? 'w-14 h-14 rounded-xl' : 'w-16 h-16 rounded-full'} pointer-events-none`}
          style={{
            background: isPet
              ? "radial-gradient(circle, rgba(212, 175, 55, 0.4) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(167, 201, 162, 0.4) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Avatar */}
      <div className="relative">
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isPet ? "rounded-xl" : "rounded-full"
          } ${
            isSelected
              ? `ring-4 ${isPet ? 'ring-gold' : 'ring-sage'} ring-offset-2 shadow-xl scale-110`
              : `ring-3 ${isPet ? 'ring-gold-light' : 'ring-sage-pale'} group-hover:${isPet ? 'ring-gold' : 'ring-sage'} shadow-lg`
          }`}
          style={{
            width: isPet ? 40 : 48,
            height: isPet ? 40 : 48,
          }}
        >
          {plot.profilePhoto ? (
            <Image
              src={plot.profilePhoto}
              alt={plot.name}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${
                plot.hasMemorial
                  ? isPet
                    ? "bg-gradient-to-br from-gold-light to-gold/30"
                    : "bg-gradient-to-br from-sage-pale to-sage/30"
                  : "bg-gradient-to-br from-gray-100 to-gray-50"
              }`}
            >
              {isPet ? (
                <PawPrint className={`w-5 h-5 ${plot.hasMemorial ? 'text-gold-dark' : 'text-gray-400'}`} />
              ) : plot.hasMemorial ? (
                <span className="text-sm font-serif font-semibold text-sage-dark">
                  {initials}
                </span>
              ) : (
                <User className="w-5 h-5 text-gray-400" />
              )}
            </div>
          )}
        </div>

        {/* Active candle indicator */}
        {plot.hasActiveCandle && (
          <motion.div
            className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center"
            animate={{
              scale: [1, 1.15, 1],
              rotate: [-3, 3, -3],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="absolute inset-0 rounded-full bg-amber-400/40 blur-sm" />
            <Flame className="w-3.5 h-3.5 text-amber-500 relative z-10" />
          </motion.div>
        )}

        {/* Memorial indicator */}
        {plot.hasMemorial && (
          <div className={`absolute -bottom-1 ${isPet ? '-left-1' : '-right-1'} w-4 h-4 rounded-full bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center shadow-sm border-2 border-white`}>
            <Flower2 className="w-2.5 h-2.5 text-white" />
          </div>
        )}

        {/* Pet badge */}
        {isPet && (
          <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-gold-light flex items-center justify-center shadow-sm border-2 border-white">
            <PawPrint className="w-2.5 h-2.5 text-gold-dark" />
          </div>
        )}
      </div>

      {/* Name label */}
      <div className="px-2 py-0.5 bg-white/95 rounded shadow-sm max-w-20">
        <p className="text-[10px] font-medium text-gray-700 truncate">
          {plot.name.split(' ')[0]}
        </p>
      </div>
    </motion.button>
  );
}
