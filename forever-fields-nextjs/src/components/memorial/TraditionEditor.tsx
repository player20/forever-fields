"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChefHat,
  Lightbulb,
  Wrench,
  Calendar,
  Quote,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui";

type TraditionType = "recipe" | "wisdom" | "skill" | "tradition" | "saying";

interface Tradition {
  id: string;
  type: TraditionType;
  title: string;
  content: string;
  ingredients?: string[];
  occasion?: string;
  memory?: string;
  addedBy: string;
}

interface TraditionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tradition: Omit<Tradition, "id"> & { id?: string }) => void;
  tradition?: Tradition | null; // If provided, editing mode
  userName?: string; // For addedBy field
}

const typeConfig = {
  recipe: {
    icon: ChefHat,
    label: "Recipe",
    description: "A dish or drink they were known for",
    placeholder: "Instructions for making this recipe...",
  },
  wisdom: {
    icon: Lightbulb,
    label: "Life Wisdom",
    description: "Advice or philosophy they lived by",
    placeholder: "The wisdom or advice in their own words...",
  },
  skill: {
    icon: Wrench,
    label: "Skill",
    description: "Something they knew how to do well",
    placeholder: "How to do this skill, step by step...",
  },
  tradition: {
    icon: Calendar,
    label: "Tradition",
    description: "A ritual or custom they started",
    placeholder: "Describe what this tradition involves...",
  },
  saying: {
    icon: Quote,
    label: "Saying",
    description: "A phrase or expression they always used",
    placeholder: "What this saying meant and when they'd use it...",
  },
};

export function TraditionEditor({
  isOpen,
  onClose,
  onSave,
  tradition,
  userName = "Family Member",
}: TraditionEditorProps) {
  const [type, setType] = useState<TraditionType>("recipe");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [occasion, setOccasion] = useState("");
  const [memory, setMemory] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when editing
  useEffect(() => {
    if (tradition) {
      setType(tradition.type);
      setTitle(tradition.title);
      setContent(tradition.content);
      setIngredients(tradition.ingredients?.length ? tradition.ingredients : [""]);
      setOccasion(tradition.occasion || "");
      setMemory(tradition.memory || "");
    } else {
      // Reset for new tradition
      setType("recipe");
      setTitle("");
      setContent("");
      setIngredients([""]);
      setOccasion("");
      setMemory("");
    }
    setErrors({});
  }, [tradition, isOpen]);

  const addIngredient = () => {
    setIngredients([...ingredients, ""]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!content.trim()) {
      newErrors.content = type === "recipe" ? "Instructions are required" : "Content is required";
    }

    if (type === "recipe") {
      const filledIngredients = ingredients.filter((i) => i.trim());
      if (filledIngredients.length === 0) {
        newErrors.ingredients = "At least one ingredient is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const filledIngredients = ingredients.filter((i) => i.trim());

    onSave({
      id: tradition?.id,
      type,
      title: title.trim(),
      content: content.trim(),
      ingredients: type === "recipe" ? filledIngredients : undefined,
      occasion: occasion.trim() || undefined,
      memory: memory.trim() || undefined,
      addedBy: tradition?.addedBy || userName,
    });

    onClose();
  };

  const config = typeConfig[type];
  const TypeIcon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-8 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="font-serif text-xl text-gray-900">
                {tradition ? "Edit" : "Add"} Tradition
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(typeConfig) as TraditionType[]).map((t) => {
                    const Icon = typeConfig[t].icon;
                    return (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                          type === t
                            ? "border-sage bg-sage-pale text-sage-dark"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{typeConfig[t].label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">{config.description}</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {type === "saying" ? "The Saying" : "Title"}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    type === "saying"
                      ? '"Well, isn\'t that something!"'
                      : type === "recipe"
                      ? "Famous Chocolate Chip Cookies"
                      : "Enter a title..."
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sage focus:border-sage ${
                    errors.title ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                )}
              </div>

              {/* Ingredients (Recipe only) */}
              {type === "recipe" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ingredients
                  </label>
                  <div className="space-y-2">
                    {ingredients.map((ingredient, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={ingredient}
                          onChange={(e) => updateIngredient(index, e.target.value)}
                          placeholder="1 cup flour..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-sage"
                        />
                        {ingredients.length > 1 && (
                          <button
                            onClick={() => removeIngredient(index)}
                            className="p-2 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addIngredient}
                    className="mt-2 flex items-center gap-1 text-sm text-sage-dark hover:text-sage transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add ingredient
                  </button>
                  {errors.ingredients && (
                    <p className="text-red-500 text-xs mt-1">{errors.ingredients}</p>
                  )}
                </div>
              )}

              {/* Content/Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {type === "recipe" ? "Instructions" : "Description"}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={config.placeholder}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sage focus:border-sage resize-none ${
                    errors.content ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {errors.content && (
                  <p className="text-red-500 text-xs mt-1">{errors.content}</p>
                )}
              </div>

              {/* Occasion (for traditions and recipes) */}
              {(type === "tradition" || type === "recipe") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occasion (optional)
                  </label>
                  <input
                    type="text"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="Christmas Eve, Every Sunday, Birthdays..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-sage"
                  />
                </div>
              )}

              {/* Memory/Story */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Memory (optional)
                </label>
                <textarea
                  value={memory}
                  onChange={(e) => setMemory(e.target.value)}
                  placeholder="Share a story or memory connected to this..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-sage resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Why was this special? When would they do/say this?
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <TypeIcon className="w-4 h-4 mr-2" />
                {tradition ? "Save Changes" : "Add Tradition"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
