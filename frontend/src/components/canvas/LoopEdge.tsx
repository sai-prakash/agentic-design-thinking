interface LoopEdgeProps {
  startX: number;
  startY: number;
  endX: number;
  targetStage: string;
  iteration: number;
}

export function LoopEdge({ startX, startY, endX, iteration }: Omit<LoopEdgeProps, 'targetStage'>) {
  // Draw a smooth arc back to the target node
  const controlY = startY - 60;
  const controlX = startX - (startX - endX) / 2;
  
  // Use a slight offset for the end point to not overlap with markers perfectly
  const pathData = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${startY - 12}`;

  return (
    <g className="animate-in fade-in duration-500">
      <path
        d={pathData}
        fill="none"
        stroke="var(--status-loop)"
        strokeWidth={1.5}
        strokeDasharray="5 5"
        markerEnd="url(#arrow-loop)"
        className="animate-[dash-flow_2s_linear_infinite_reverse]"
        opacity={0.7}
      />
      
      {/* Iteration Badge (Glassmorphism) */}
      <foreignObject x={controlX - 15} y={controlY - 25} width={30} height={30} className="pointer-events-none">
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex items-center gap-1 rounded-full bg-zinc-950/80 px-2 py-0.5 border border-[var(--status-loop)] backdrop-blur-md shadow-lg">
            <span className="font-mono text-[8px] font-black text-[var(--status-loop)]">
              ITER {iteration}
            </span>
          </div>
        </div>
      </foreignObject>
    </g>
  );
}
