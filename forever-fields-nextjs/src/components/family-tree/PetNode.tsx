"use client";

import { motion } from "framer-motion";
import { PawPrint, Flower2, Bird, Cat, Dog } from "lucide-react";
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

  return (
    <motion.button
      onClick={() => onClick?.(pet)}
      className="flex flex-col items-center gap-1.5 group focus:outline-none"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar - Rounded square for pets */}
      <div
        className={`relative w-14 h-14 rounded-xl overflow-hidden transition-all duration-300 ${
          isSelected
            ? "ring-4 ring-gold ring-offset-2 shadow-lg"
            : "ring-2 ring-gold-light group-hover:ring-gold group-hover:shadow-md"
        } ${pet.hasMemorial ? "ring-gold" : "ring-gray-200"}`}
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
              pet.hasMemorial ? "bg-gold-light" : "bg-cream-warm"
            }`}
          >
            <SpeciesIcon
              className={`w-6 h-6 ${pet.hasMemorial ? "text-gold-dark" : "text-gray-400"}`}
            />
          </div>
        )}

        {/* Paw badge */}
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold-light flex items-center justify-center shadow-sm border border-gold/30">
          <PawPrint className="w-3 h-3 text-gold-dark" />
        </div>

        {/* Memorial indicator */}
        {pet.hasMemorial && (
          <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-sage flex items-center justify-center shadow-sm">
            <Flower2 className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="text-center max-w-16">
        <p
          className={`text-xs font-medium truncate ${
            isSelected ? "text-gold-dark" : "text-gray-dark"
          }`}
        >
          {pet.name}
        </p>
        {years && <p className="text-[10px] text-gray-400">{years}</p>}
      </div>
    </motion.button>
  );
}
