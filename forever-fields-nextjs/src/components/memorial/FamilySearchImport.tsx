"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui";
import { SimplifiedPerson, FamilyTreeData } from "@/lib/familysearch/types";

interface FamilySearchImportProps {
  onImport: (data: {
    nodes: Array<{
      id: string;
      gender: "male" | "female";
      parents?: { id: string; type: "blood" }[];
      spouses?: { id: string; type: "married" }[];
      children?: { id: string; type: "blood" }[];
    }>;
    people: Record<
      string,
      {
        id: string;
        name: string;
        birthYear?: string;
        deathYear?: string;
        isDeceased?: boolean;
      }
    >;
  }) => void;
  onCancel?: () => void;
}

interface FamilySearchUser {
  id: string;
  displayName: string;
  personId?: string;
}

interface ImportOptions {
  includeAncestors: boolean;
  ancestorGenerations: number;
  includeDescendants: boolean;
  descendantGenerations: number;
  includeSpouses: boolean;
  excludeLiving: boolean;
}

export function FamilySearchImport({ onImport, onCancel }: FamilySearchImportProps) {
  const [_isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [fsUser, setFsUser] = useState<FamilySearchUser | null>(null);
  const [treeData, setTreeData] = useState<FamilyTreeData | null>(null);
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"connect" | "options" | "preview">("connect");

  const [options, setOptions] = useState<ImportOptions>({
    includeAncestors: true,
    ancestorGenerations: 4,
    includeDescendants: false,
    descendantGenerations: 2,
    includeSpouses: true,
    excludeLiving: true,
  });

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = () => {
      try {
        const fsUserCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("fs_user="));
        if (fsUserCookie) {
          const userData = JSON.parse(
            decodeURIComponent(fsUserCookie.split("=")[1])
          );
          setFsUser(userData);
          setIsConnected(true);
          setStep("options");
        }
      } catch {
        // Not connected
      }
    };

    checkConnection();

    // Check for connection callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("connected") === "true") {
      checkConnection();
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (urlParams.get("error")) {
      setError(urlParams.get("message") || "Failed to connect to FamilySearch");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch("/api/familysearch/auth");
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to FamilySearch OAuth
      window.location.href = data.authUrl;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start connection"
      );
      setIsConnecting(false);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    try {
      await fetch("/api/familysearch/auth", { method: "DELETE" });
      setIsConnected(false);
      setFsUser(null);
      setTreeData(null);
      setStep("connect");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disconnect"
      );
    }
  }, []);

  const handleFetchTree = useCallback(async () => {
    if (!fsUser?.personId) {
      setError("No person ID found. Please try reconnecting.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        personId: fsUser.personId,
        includeAncestors: String(options.includeAncestors),
        ancestorGenerations: String(options.ancestorGenerations),
        includeDescendants: String(options.includeDescendants),
        descendantGenerations: String(options.descendantGenerations),
        includeSpouses: String(options.includeSpouses),
        excludeLiving: String(options.excludeLiving),
      });

      const response = await fetch(`/api/familysearch/tree?${params}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setTreeData(data.tree);
      setSelectedRoot(data.tree.rootPerson.id);
      setStep("preview");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch family tree"
      );
    } finally {
      setIsLoading(false);
    }
  }, [fsUser, options]);

  const handleImport = useCallback(() => {
    if (!treeData) return;

    // Convert FamilySearch data to the format expected by the family tree component
    const nodes: Array<{
      id: string;
      gender: "male" | "female";
      parents?: { id: string; type: "blood" }[];
      spouses?: { id: string; type: "married" }[];
      children?: { id: string; type: "blood" }[];
    }> = [];

    const people: Record<
      string,
      {
        id: string;
        name: string;
        birthYear?: string;
        deathYear?: string;
        isDeceased?: boolean;
      }
    > = {};

    // Helper to add a person
    const addPerson = (person: SimplifiedPerson) => {
      if (people[person.id]) return;

      people[person.id] = {
        id: person.id,
        name: person.displayName,
        birthYear: person.birthDate?.split("-")[0],
        deathYear: person.deathDate?.split("-")[0],
        isDeceased: !person.isLiving,
      };

      nodes.push({
        id: person.id,
        gender: person.gender === "male" ? "male" : "female",
      });
    };

    // Add root person
    addPerson(treeData.rootPerson);

    // Add ancestors
    for (const ancestor of treeData.ancestors) {
      addPerson(ancestor);
    }

    // Add descendants
    for (const descendant of treeData.descendants) {
      addPerson(descendant);
    }

    // Add spouses
    for (const spouse of treeData.spouses) {
      addPerson(spouse);
      // Link spouse to root
      const rootNode = nodes.find((n) => n.id === treeData.rootPerson.id);
      if (rootNode) {
        rootNode.spouses = rootNode.spouses || [];
        rootNode.spouses.push({ id: spouse.id, type: "married" });
      }
    }

    onImport({ nodes, people });
  }, [treeData, onImport]);

  // Render connect step
  if (step === "connect") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect to FamilySearch</CardTitle>
          <CardDescription>
            Import your family tree directly from FamilySearch.org
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🌳</div>
            <h3 className="text-xl font-medium text-sage-dark mb-2">
              FamilySearch Integration
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Connect your FamilySearch account to import your family tree data
              directly. We&apos;ll only import deceased individuals to protect
              privacy.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 mb-4 max-w-md mx-auto">
                {error}
              </div>
            )}

            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              isLoading={isConnecting}
              size="lg"
            >
              {isConnecting ? "Connecting..." : "Connect FamilySearch"}
            </Button>
          </div>

          <div className="border-t pt-6">
            <p className="text-sm text-gray-500 text-center">
              Don&apos;t have a FamilySearch account?{" "}
              <a
                href="https://www.familysearch.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sage hover:underline"
              >
                Create one for free
              </a>
            </p>
          </div>

          {onCancel && (
            <div className="flex justify-end pt-4">
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Render options step
  if (step === "options") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Options</CardTitle>
          <CardDescription>
            Choose what to import from your FamilySearch tree
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection status */}
          <div className="bg-sage-pale rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-medium text-sage-dark">Connected</p>
                <p className="text-sm text-gray-600">
                  Logged in as {fsUser?.displayName}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              {error}
            </div>
          )}

          {/* Import options */}
          <div className="space-y-4">
            {/* Ancestors */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="includeAncestors"
                checked={options.includeAncestors}
                onChange={(e) =>
                  setOptions({ ...options, includeAncestors: e.target.checked })
                }
                className="mt-1 h-4 w-4 text-sage focus:ring-sage rounded"
              />
              <div className="flex-1">
                <label
                  htmlFor="includeAncestors"
                  className="font-medium text-gray-dark cursor-pointer"
                >
                  Include Ancestors
                </label>
                <p className="text-sm text-gray-500">
                  Import parents, grandparents, and great-grandparents
                </p>
                {options.includeAncestors && (
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-sm text-gray-600">Generations:</label>
                    <select
                      value={options.ancestorGenerations}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          ancestorGenerations: parseInt(e.target.value, 10),
                        })
                      }
                      className="border border-gray-200 rounded px-2 py-1 text-sm"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={n}>
                          {n} generation{n > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Descendants */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="includeDescendants"
                checked={options.includeDescendants}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    includeDescendants: e.target.checked,
                  })
                }
                className="mt-1 h-4 w-4 text-sage focus:ring-sage rounded"
              />
              <div className="flex-1">
                <label
                  htmlFor="includeDescendants"
                  className="font-medium text-gray-dark cursor-pointer"
                >
                  Include Descendants
                </label>
                <p className="text-sm text-gray-500">
                  Import children and grandchildren
                </p>
                {options.includeDescendants && (
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-sm text-gray-600">Generations:</label>
                    <select
                      value={options.descendantGenerations}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          descendantGenerations: parseInt(e.target.value, 10),
                        })
                      }
                      className="border border-gray-200 rounded px-2 py-1 text-sm"
                    >
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          {n} generation{n > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Spouses */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="includeSpouses"
                checked={options.includeSpouses}
                onChange={(e) =>
                  setOptions({ ...options, includeSpouses: e.target.checked })
                }
                className="mt-1 h-4 w-4 text-sage focus:ring-sage rounded"
              />
              <div className="flex-1">
                <label
                  htmlFor="includeSpouses"
                  className="font-medium text-gray-dark cursor-pointer"
                >
                  Include Spouses
                </label>
                <p className="text-sm text-gray-500">
                  Import spouse information
                </p>
              </div>
            </div>

            {/* Privacy note */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-2">
                <span className="text-amber-600">⚠️</span>
                <div>
                  <p className="text-sm text-amber-800 font-medium">
                    Privacy Protection
                  </p>
                  <p className="text-sm text-amber-700">
                    Only deceased individuals will be imported. Living persons
                    are automatically excluded to protect their privacy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleFetchTree}
              disabled={isLoading}
              isLoading={isLoading}
            >
              {isLoading ? "Fetching..." : "Fetch Family Tree"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render preview step
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview Import</CardTitle>
        <CardDescription>
          Review the data that will be imported
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        )}

        {treeData && (
          <>
            {/* Summary */}
            <div className="bg-sage-pale rounded-lg p-4">
              <h3 className="font-medium text-sage-dark mb-2">
                Found in your tree:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-2xl mr-2">👤</span>
                  <span className="font-medium">1</span> root person
                </div>
                <div>
                  <span className="text-2xl mr-2">👴</span>
                  <span className="font-medium">{treeData.ancestors.length}</span>{" "}
                  ancestors
                </div>
                <div>
                  <span className="text-2xl mr-2">👶</span>
                  <span className="font-medium">
                    {treeData.descendants.length}
                  </span>{" "}
                  descendants
                </div>
                <div>
                  <span className="text-2xl mr-2">💑</span>
                  <span className="font-medium">{treeData.spouses.length}</span>{" "}
                  spouses
                </div>
              </div>
            </div>

            {/* Root Person */}
            <div>
              <h3 className="font-medium text-sage-dark mb-2">Root Person:</h3>
              <div className="bg-white border border-sage rounded-lg p-4">
                <p className="font-medium text-lg">
                  {treeData.rootPerson.displayName}
                </p>
                <p className="text-sm text-gray-500">
                  {treeData.rootPerson.birthDate &&
                    `Born ${treeData.rootPerson.birthDate}`}
                  {treeData.rootPerson.birthDate &&
                    treeData.rootPerson.deathDate &&
                    " - "}
                  {treeData.rootPerson.deathDate &&
                    `Died ${treeData.rootPerson.deathDate}`}
                </p>
                {treeData.rootPerson.birthPlace && (
                  <p className="text-sm text-gray-500">
                    📍 {treeData.rootPerson.birthPlace}
                  </p>
                )}
              </div>
            </div>

            {/* Ancestors Preview */}
            {treeData.ancestors.length > 0 && (
              <div>
                <h3 className="font-medium text-sage-dark mb-2">
                  Ancestors ({treeData.ancestors.length}):
                </h3>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {treeData.ancestors.map((person) => (
                    <div
                      key={person.id}
                      className="px-4 py-2 border-b border-gray-100 last:border-0"
                    >
                      <p className="font-medium text-sm">{person.displayName}</p>
                      <p className="text-xs text-gray-500">
                        {person.lifespan || "Dates unknown"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Spouses Preview */}
            {treeData.spouses.length > 0 && (
              <div>
                <h3 className="font-medium text-sage-dark mb-2">
                  Spouses ({treeData.spouses.length}):
                </h3>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                  {treeData.spouses.map((person) => (
                    <div
                      key={person.id}
                      className="px-4 py-2 border-b border-gray-100 last:border-0"
                    >
                      <p className="font-medium text-sm">{person.displayName}</p>
                      <p className="text-xs text-gray-500">
                        {person.lifespan || "Dates unknown"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="ghost" onClick={() => setStep("options")}>
            Back to Options
          </Button>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleImport} disabled={!treeData || !selectedRoot}>
            Import Family Tree
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
