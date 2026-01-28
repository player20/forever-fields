"use client";

import type { Connection, TreeNodePosition } from "./types";

interface ConnectionLinesProps {
  connections: Connection[];
  positions: Map<string, TreeNodePosition>;
  containerWidth: number;
  containerHeight: number;
}

export function ConnectionLines({
  connections,
  positions,
  containerWidth,
  containerHeight,
}: ConnectionLinesProps) {
  const getPath = (connection: Connection): string | null => {
    const from = positions.get(connection.fromId);
    const to = positions.get(connection.toId);

    if (!from || !to) return null;

    // Adjust coordinates based on node type and connection type
    const fromNodeSize = from.type === "pet" ? 28 : 40; // half of node width
    const toNodeSize = to.type === "pet" ? 28 : 40;

    // Calculate connection points
    let x1 = from.x;
    let y1 = from.y;
    let x2 = to.x;
    let y2 = to.y;

    if (connection.type === "spouse") {
      // Horizontal line at the middle of the nodes
      y1 = from.y;
      y2 = to.y;
      // Adjust x to edge of nodes
      if (x1 < x2) {
        x1 += fromNodeSize;
        x2 -= toNodeSize;
      } else {
        x1 -= fromNodeSize;
        x2 += toNodeSize;
      }
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }

    if (connection.type === "parent-child") {
      // Curved line from bottom of parent to top of child
      y1 = from.y + fromNodeSize; // bottom of parent
      y2 = to.y - toNodeSize - 20; // top of child (with name offset)

      // Calculate control points for smooth curve
      const midY = (y1 + y2) / 2;

      return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
    }

    if (connection.type === "pet-owner") {
      // Dotted line from person to pet (handled in stroke style)
      y1 = from.y + fromNodeSize;
      y2 = to.y - toNodeSize - 10;

      const midY = (y1 + y2) / 2;
      return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
    }

    return null;
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={containerWidth}
      height={containerHeight}
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Gradient for lines */}
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a7c9a2" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#a7c9a2" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="petLineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b38f1f" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#b38f1f" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {connections.map((connection, index) => {
        const path = getPath(connection);
        if (!path) return null;

        const isPetConnection = connection.type === "pet-owner";
        const isSpouse = connection.type === "spouse";

        return (
          <path
            key={`${connection.fromId}-${connection.toId}-${index}`}
            d={path}
            fill="none"
            stroke={isPetConnection ? "url(#petLineGradient)" : "url(#lineGradient)"}
            strokeWidth={isSpouse ? 3 : 2}
            strokeDasharray={isPetConnection ? "4 4" : undefined}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
