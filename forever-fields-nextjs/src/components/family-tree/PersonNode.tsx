"use client";

import { motion } from "framer-motion";
import { User, Flower2 } from "lucide-react";
import type { FamilyMember } from "./types";

interface PersonNodeProps {
  member: FamilyMember;
  isSelected?: boolean;
  onClick?: (member: FamilyMember) => void;
}

export function PersonNode({ member, isSelected, onClick }: PersonNodeProps) {
  const initials = `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`;
  const displayName = member.nickname || member.firstName;
  const years =
    member.birthYear && member.deathYear
      ? `${member.birthYear}–${member.deathYear}`
      : member.birthYear
        ? `b. ${member.birthYear}`
        : null;

  return (
    <motion.button
      onClick={() => onClick?.(member)}
      className="flex flex-col items-center gap-2 group focus:outline-none"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar */}
      <div
        className={`relative w-20 h-20 rounded-full overflow-hidden transition-all duration-300 ${
          isSelected
            ? "ring-4 ring-sage ring-offset-2 shadow-lg"
            : "ring-2 ring-sage-pale group-hover:ring-sage group-hover:shadow-md"
        } ${member.hasMemorial ? "ring-sage" : "ring-gray-200"}`}
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
              member.hasMemorial ? "bg-sage-pale" : "bg-gray-100"
            }`}
          >
            {member.hasMemorial ? (
              <span className="text-xl font-serif font-semibold text-sage-dark">
                {initials}
              </span>
            ) : (
              <User className="w-8 h-8 text-gray-400" />
            )}
          </div>
        )}

        {/* Memorial indicator */}
        {member.hasMemorial && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-sage flex items-center justify-center shadow-sm">
            <Flower2 className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="text-center max-w-24">
        <p
          className={`text-sm font-medium truncate ${
            isSelected ? "text-sage-dark" : "text-gray-dark"
          }`}
        >
          {displayName}
        </p>
        <p className="text-xs text-gray-body truncate">{member.lastName}</p>
        {years && <p className="text-xs text-gray-400 mt-0.5">{years}</p>}
      </div>
    </motion.button>
  );
}
