interface FlowEdgeProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  animated?: boolean;
}

export function FlowEdge({ startX, startY, endX, endY, animated = false }: FlowEdgeProps) {
  return (
    <g>
      {/* Base Path (Shadow/Subtle) */}
      <path
        d={`M ${startX} ${startY} L ${endX} ${endY}`}
        fill="none"
        stroke="var(--border-subtle)"
        strokeWidth={1.5}
        className="opacity-40"
      />
      
      {/* Active Flow Path */}
      <path
        d={`M ${startX} ${startY} L ${endX} ${endY}`}
        fill="none"
        stroke={animated ? "var(--status-running)" : "var(--border-default)"}
        strokeWidth={2}
        markerEnd="url(#arrow)"
        strokeDasharray={animated ? "4 6" : "none"}
        className={`transition-all duration-700 ease-in-out ${animated ? 'animate-[dash-flow_2s_linear_infinite]' : ''}`}
        filter={animated ? "url(#glow)" : "none"}
      />
    </g>
  );
}
