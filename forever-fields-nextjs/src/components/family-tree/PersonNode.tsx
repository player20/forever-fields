"use client";

import { motion } from "framer-motion";
import { User, Flower2, Flame } from "lucide-react";
import type { FamilyMember } from "./types";

interface PersonNodeProps {
  member: FamilyMember;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: (member: FamilyMember) => void;
}

export function PersonNode({ member, isSelected, isHighlighted, onClick }: PersonNodeProps) {
  const initials = `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`;
  const displayName = member.nickname || member.firstName;
  const years =
    member.birthYear && member.deathYear
      ? `${member.birthYear}–${member.deathYear}`
      : member.birthYear
        ? `b. ${member.birthYear}`
        : null;

  // Simulated active candle (in real app, would come from props)
  const hasActiveCandle = member.hasMemorial && member.deathYear;

  return (
    <motion.button
      onClick={() => onClick?.(member)}
      className="flex flex-col items-center gap-2.5 group focus:outline-none relative"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Glow effect for memorial nodes */}
      {member.hasMemorial && (
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(167, 201, 162, 0.4) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Avatar container */}
      <div className="relative">
        {/* Avatar */}
        <div
          className={`relative rounded-full overflow-hidden transition-all duration-300 ${
            isSelected
              ? "ring-4 ring-sage ring-offset-4 ring-offset-cream shadow-xl scale-105"
              : isHighlighted
                ? "ring-3 ring-sage/80 ring-offset-2 ring-offset-cream shadow-lg"
                : "ring-2 ring-sage-pale/60 group-hover:ring-sage group-hover:ring-3 group-hover:shadow-lg"
          } ${member.hasMemorial ? "ring-sage" : "ring-gray-200/50"}`}
          style={{ width: 88, height: 88 }}
        >
          {member.profilePhoto ? (
            <img
              src={member.profilePhoto}
              alt={`${member.firstName} ${member.lastName}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${
                member.hasMemorial
                  ? "bg-gradient-to-br from-sage-pale to-sage/20"
                  : "bg-gradient-to-br from-gray-100 to-gray-50"
              }`}
            >
              {member.hasMemorial ? (
                <span className="text-2xl font-serif font-semibold text-sage-dark">
                  {initials}
                </span>
              ) : (
                <User className="w-10 h-10 text-gray-300" />
              )}
            </div>
          )}

          {/* Memorial flower indicator */}
          {member.hasMemorial && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center shadow-md border-2 border-white">
              <Flower2 className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Active candle indicator with flame animation */}
        {hasActiveCandle && (
          <motion.div
            className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [-2, 2, -2],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-md" />
            <Flame className="w-5 h-5 text-amber-500 relative z-10" />
          </motion.div>
        )}
      </div>

      {/* Name with improved typography */}
      <div className="text-center max-w-28">
        <p
          className={`text-sm font-semibold truncate transition-colors duration-200 ${
            isSelected
              ? "text-sage-dark"
              : isHighlighted
                ? "text-gray-dark"
                : "text-gray-600 group-hover:text-gray-dark"
          }`}
        >
          {displayName}
        </p>
        <p className={`text-xs truncate transition-colors duration-200 ${
          isSelected || isHighlighted ? "text-gray-body" : "text-gray-400"
        }`}>
          {member.lastName}
        </p>
        {years && (
          <p className={`text-xs mt-0.5 transition-colors duration-200 ${
            isSelected ? "text-sage" : "text-gray-400"
          }`}>
            {years}
          </p>
        )}
      </div>
    </motion.button>
  );
}
