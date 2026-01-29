"use client";

import { motion } from "framer-motion";
import { PawPrint, Flower2, Bird, Cat, Dog, Flame } from "lucide-react";
import type { Pet } from "./types";

interface PetNodeProps {
  pet: Pet;
  isSelected?: boolean;
  onClick?: (pet: Pet) => void;
}

function getSpeciesIcon(species: Pet["species"]) {
  switch (species) {
    case "dog":
      return Dog;
    case "cat":
      return Cat;
    case "bird":
      return Bird;
    default:
      return PawPrint;
  }
}

export function PetNode({ pet, isSelected, onClick }: PetNodeProps) {
  const SpeciesIcon = getSpeciesIcon(pet.species);
  const years =
    pet.birthYear && pet.deathYear
      ? `${pet.birthYear}–${pet.deathYear}`
      : pet.birthYear
        ? `b. ${pet.birthYear}`
        : null;

  // Simulated active candle
  const hasActiveCandle = pet.hasMemorial && pet.deathYear;

  return (
    <motion.button
      onClick={() => onClick?.(pet)}
      className="flex flex-col items-center gap-2 group focus:outline-none relative"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Glow effect for memorial pets */}
      {pet.hasMemorial && (
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-xl pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(212, 175, 55, 0.35) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4],
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
        {/* Avatar - Rounded square for pets */}
        <div
          className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
            isSelected
              ? "ring-4 ring-gold ring-offset-4 ring-offset-cream shadow-xl scale-105"
              : "ring-2 ring-gold-light/60 group-hover:ring-gold group-hover:ring-3 group-hover:shadow-lg"
          } ${pet.hasMemorial ? "ring-gold" : "ring-gray-200/50"}`}
          style={{ width: 64, height: 64 }}
        >
          {pet.profilePhoto ? (
            <img
              src={pet.profilePhoto}
              alt={pet.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${
                pet.hasMemorial
                  ? "bg-gradient-to-br from-gold-light to-gold/20"
                  : "bg-gradient-to-br from-cream-warm to-cream"
              }`}
            >
              <SpeciesIcon
                className={`w-7 h-7 ${pet.hasMemorial ? "text-gold-dark" : "text-gray-300"}`}
              />
            </div>
          )}

          {/* Paw badge */}
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-gold-light to-gold/40 flex items-center justify-center shadow-md border-2 border-white">
            <PawPrint className="w-3.5 h-3.5 text-gold-dark" />
          </div>

          {/* Memorial indicator */}
          {pet.hasMemorial && (
            <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center shadow-md border-2 border-white">
              <Flower2 className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>

        {/* Active candle indicator */}
        {hasActiveCandle && (
          <motion.div
            className="absolute -top-2 -left-2 w-6 h-6 flex items-center justify-center"
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
            <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-sm" />
            <Flame className="w-4 h-4 text-amber-500 relative z-10" />
          </motion.div>
        )}
      </div>

      {/* Name */}
      <div className="text-center max-w-20">
        <p
          className={`text-xs font-semibold truncate transition-colors duration-200 ${
            isSelected ? "text-gold-dark" : "text-gray-600 group-hover:text-gray-dark"
          }`}
        >
          {pet.name}
        </p>
        {years && (
          <p className={`text-[10px] mt-0.5 transition-colors duration-200 ${
            isSelected ? "text-gold" : "text-gray-400"
          }`}>
            {years}
          </p>
        )}
      </div>
    </motion.button>
  );
}
