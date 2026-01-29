"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  Lightbulb,
  Wrench,
  Calendar,
  Quote,
  Heart,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui";

interface Tradition {
  id: string;
  type: "recipe" | "wisdom" | "skill" | "tradition" | "saying";
  title: string;
  content: string;
  ingredients?: string[];
  occasion?: string;
  memory?: string;
  addedBy: string;
}

interface TraditionsLegacyProps {
  traditions: Tradition[];
  name: string;
  canEdit?: boolean;
  onAdd?: () => void;
  onEdit?: (tradition: Tradition) => void;
  onDelete?: (id: string) => void;
}

const categoryConfig = {
  recipe: {
    icon: ChefHat,
    label: "Recipes",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  wisdom: {
    icon: Lightbulb,
    label: "Life Wisdom",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  skill: {
    icon: Wrench,
    label: "Skills",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  tradition: {
    icon: Calendar,
    label: "Traditions",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  saying: {
    icon: Quote,
    label: "Sayings",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
  },
};

type CategoryType = keyof typeof categoryConfig | "all";

export function TraditionsLegacy({
  traditions,
  name,
  canEdit = false,
  onAdd,
  onEdit,
  onDelete,
}: TraditionsLegacyProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const categories: CategoryType[] = ["all", "recipe", "wisdom", "skill", "tradition", "saying"];

  const filteredTraditions = activeCategory === "all"
    ? traditions
    : traditions.filter((t) => t.type === activeCategory);

  const getCategoryCount = (type: CategoryType) => {
    if (type === "all") return traditions.length;
    return traditions.filter((t) => t.type === type).length;
  };

  const handleDelete = (id: string) => {
    onDelete?.(id);
    setDeleteConfirmId(null);
  };

  if (traditions.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-12 h-12 text-sage-light mx-auto mb-4" />
        <h3 className="font-serif text-lg text-sage-dark mb-2">
          Preserve {name}&apos;s Legacy
        </h3>
        <p className="text-sage-dark/70 max-w-md mx-auto mb-6">
          Share recipes, wisdom, skills, traditions, and sayings that made {name} special.
          These treasures deserve to be remembered and passed down.
        </p>
        {canEdit && onAdd && (
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Tradition
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      {canEdit && onAdd && (
        <div className="flex justify-end">
          <Button onClick={onAdd} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Tradition
          </Button>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const count = getCategoryCount(category);
          if (category !== "all" && count === 0) return null;

          const config = category === "all" ? null : categoryConfig[category];
          const Icon = config?.icon || Heart;

          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                transition-all duration-200
                ${activeCategory === category
                  ? category === "all"
                    ? "bg-sage text-white"
                    : `${config?.bgColor} ${config?.color} ring-2 ring-offset-1 ${config?.borderColor}`
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{category === "all" ? "All" : config?.label}</span>
              <span className="text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Traditions Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filteredTraditions.map((tradition) => {
            const config = categoryConfig[tradition.type];
            const Icon = config.icon;
            const isExpanded = expandedId === tradition.id;
            const isConfirmingDelete = deleteConfirmId === tradition.id;

            return (
              <motion.div
                key={tradition.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`
                  rounded-xl border-2 ${config.borderColor} ${config.bgColor}
                  overflow-hidden transition-shadow hover:shadow-md relative
                `}
              >
                {/* Delete Confirmation Overlay */}
                <AnimatePresence>
                  {isConfirmingDelete && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center p-4"
                    >
                      <p className="text-gray-700 text-center mb-4">
                        Delete &ldquo;{tradition.title}&rdquo;?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(tradition.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : tradition.id)}
                      className="flex-1 flex items-start gap-3 text-left"
                    >
                      <div className={`p-2 rounded-lg bg-white/80 ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-lg text-gray-900 truncate">
                            {tradition.type === "saying" ? `"${tradition.title}"` : tradition.title}
                          </h3>
                        </div>
                        {tradition.occasion && (
                          <p className="text-sm text-gray-500 mt-0.5">{tradition.occasion}</p>
                        )}
                        {!isExpanded && tradition.type !== "recipe" && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {tradition.content}
                          </p>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Edit/Delete buttons */}
                      {canEdit && (
                        <>
                          <button
                            onClick={() => onEdit?.(tradition)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(tradition.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white/50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Expand/Collapse */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : tradition.id)}
                        className={`p-1.5 ${config.color} transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {/* Recipe Ingredients */}
                        {tradition.type === "recipe" && tradition.ingredients && (
                          <div className="bg-white/60 rounded-lg p-3">
                            <h4 className="font-medium text-gray-700 text-sm mb-2">Ingredients</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {tradition.ingredients.map((ingredient, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-amber-500 mt-1">•</span>
                                  {ingredient}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Main Content */}
                        <div className="bg-white/60 rounded-lg p-3">
                          {tradition.type === "recipe" && (
                            <h4 className="font-medium text-gray-700 text-sm mb-2">Instructions</h4>
                          )}
                          <p className="text-sm text-gray-700 whitespace-pre-line">
                            {tradition.content}
                          </p>
                        </div>

                        {/* Memory/Story */}
                        {tradition.memory && (
                          <div className="bg-white/40 rounded-lg p-3 border border-white/60">
                            <p className="text-sm text-gray-600 italic">
                              &ldquo;{tradition.memory}&rdquo;
                            </p>
                            <p className="text-xs text-gray-500 mt-1">— {tradition.addedBy}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
