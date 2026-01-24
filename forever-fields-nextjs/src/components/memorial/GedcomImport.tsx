"use client";

import { useState, useCallback } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { parseGedcom, convertToFamilyTreeFormat, GedcomParseResult } from "@/lib/gedcom";

interface GedcomImportProps {
  onImport: (data: {
    nodes: Array<{
      id: string;
      gender: "male" | "female";
      parents?: { id: string; type: "blood" }[];
      spouses?: { id: string; type: "married" }[];
      children?: { id: string; type: "blood" }[];
    }>;
    people: Record<string, {
      id: string;
      name: string;
      birthYear?: string;
      deathYear?: string;
      isDeceased?: boolean;
    }>;
  }) => void;
  onCancel?: () => void;
}

export function GedcomImport({ onImport, onCancel }: GedcomImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<GedcomParseResult | null>(null);
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParseResult(null);
      setSelectedRoot(null);
      setError(null);
    }
  }, []);

  const handleParse = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const result = parseGedcom(content);

      if (result.people.length === 0) {
        setError("No people found in the GEDCOM file. Please check the file format.");
        return;
      }

      setParseResult(result);

      // Auto-select the first person as root
      if (result.people.length > 0) {
        setSelectedRoot(result.people[0].id);
      }
    } catch (err) {
      setError(`Error parsing file: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  const handleImport = useCallback(() => {
    if (!parseResult) return;

    const converted = convertToFamilyTreeFormat(parseResult);
    onImport(converted);
  }, [parseResult, onImport]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith(".ged") || droppedFile.name.endsWith(".gedcom"))) {
      setFile(droppedFile);
      setParseResult(null);
      setSelectedRoot(null);
      setError(null);
    } else {
      setError("Please drop a GEDCOM file (.ged or .gedcom)");
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Family Tree</CardTitle>
        <CardDescription>
          Upload a GEDCOM file from Ancestry, FamilySearch, or other genealogy software
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        {!parseResult && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-sage-light rounded-lg p-8 text-center hover:border-sage transition-colors"
          >
            <div className="text-5xl mb-4">🌳</div>
            <p className="text-gray-600 mb-4">
              Drag and drop a GEDCOM file here, or click to browse
            </p>
            <input
              type="file"
              accept=".ged,.gedcom"
              onChange={handleFileSelect}
              className="hidden"
              id="gedcom-input"
            />
            <label htmlFor="gedcom-input" className="inline-block">
              <span className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium border border-sage rounded-xl cursor-pointer hover:bg-sage/10 transition-colors">
                Choose File
              </span>
            </label>
            {file && (
              <p className="mt-4 text-sm text-sage">
                Selected: {file.name}
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Parse Button */}
        {file && !parseResult && (
          <div className="flex justify-center">
            <Button onClick={handleParse} disabled={isLoading}>
              {isLoading ? "Parsing..." : "Parse GEDCOM File"}
            </Button>
          </div>
        )}

        {/* Parse Results */}
        {parseResult && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-sage-pale rounded-lg p-4">
              <h3 className="font-medium text-sage-dark mb-2">Found in file:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-2xl mr-2">👤</span>
                  <span className="font-medium">{parseResult.people.length}</span> people
                </div>
                <div>
                  <span className="text-2xl mr-2">👨‍👩‍👧‍👦</span>
                  <span className="font-medium">{parseResult.families.length}</span> families
                </div>
              </div>
            </div>

            {/* People List */}
            <div>
              <h3 className="font-medium text-sage-dark mb-2">
                Select root person (featured in tree):
              </h3>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {parseResult.people.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => setSelectedRoot(person.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-sage-pale/50 transition-colors ${
                      selectedRoot === person.id ? "bg-sage-pale" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sage-dark">{person.name || "Unknown"}</p>
                        <p className="text-sm text-gray-500">
                          {person.birthYear && `Born ${person.birthYear}`}
                          {person.birthYear && person.deathYear && " - "}
                          {person.deathYear && `Died ${person.deathYear}`}
                          {!person.birthYear && !person.deathYear && "Dates unknown"}
                        </p>
                      </div>
                      {selectedRoot === person.id && (
                        <span className="text-sage text-xl">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setParseResult(null);
                  setSelectedRoot(null);
                }}
              >
                Choose Different File
              </Button>
              <Button onClick={handleImport} disabled={!selectedRoot}>
                Import Family Tree
              </Button>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-sm text-gray-500 space-y-2">
          <p className="font-medium">Where to get GEDCOM files:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>Ancestry.com:</strong> Tree Settings → Export Tree</li>
            <li><strong>FamilySearch:</strong> Tree → Settings → Export</li>
            <li><strong>MyHeritage:</strong> Family Tree → Actions → Export</li>
            <li><strong>Findmypast:</strong> Family Tree → Export</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
