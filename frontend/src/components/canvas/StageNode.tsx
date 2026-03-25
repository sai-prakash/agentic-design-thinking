import type { StageName } from '../../types';
import { usePipelineStore } from '../../store/pipeline-store';
import { Search, Target, Lightbulb, Code, CheckCircle, Check, Loader2, AlertCircle } from 'lucide-react';

export const STAGE_CONFIG: Record<StageName, { title: string, role: string, icon: React.FC<any> }> = {
  empathize: { title: "Empathize", role: "UX Researcher", icon: Search },
  define: { title: "Define", role: "Strategist", icon: Target },
  ideate: { title: "Ideate", role: "Design Lead", icon: Lightbulb },
  prototype: { title: "Prototype", role: "Dev Lead", icon: Code },
  test: { title: "Test", role: "QA Lead", icon: CheckCircle }
};

interface StageNodeProps {
  x: number;
  y: number;
  stageName: StageName;
}

export function StageNode({ x, y, stageName }: StageNodeProps) {
  const { state, selectedStage, setSelectedStage } = usePipelineStore();
  const config = STAGE_CONFIG[stageName];
  const Icon = config.icon;
  
  const stageOutput = state?.[stageName];
  const isActive = state?.current_stage === stageName && state?.current_stage !== "test" && !stageOutput?.status;
  
  const status = stageOutput?.status || (isActive ? "running" : "idle");
  const isSelected = selectedStage === stageName;

  // Node dimensions
  const width = 120;
  const height = 72;
  const radius = 12;

  let fill = "var(--bg-elevated)";
  let stroke = "var(--border-subtle)";
  let pulse = false;
  let StatusIcon = null;
  let statusColor = "var(--text-secondary)";

  if (status === "running") {
    fill = "var(--bg-surface)"; // Darker
    stroke = "var(--status-running)";
    pulse = true;
    StatusIcon = Loader2;
    statusColor = "var(--status-running)";
  } else if (status === "awaiting_review") {
    fill = "var(--bg-surface)";
    stroke = "var(--status-review)";
    pulse = true;
    StatusIcon = AlertCircle;
    statusColor = "var(--status-review)";
  } else if (status === "approved") {
    fill = "var(--bg-surface)";
    stroke = "var(--status-approved)";
    StatusIcon = Check;
    statusColor = "var(--status-approved)";
  } else if (status === "rejected" || status === "error") {
    fill = "var(--bg-surface)";
    stroke = "var(--status-error)";
    StatusIcon = AlertCircle;
    statusColor = "var(--status-error)";
  }

  return (
    <g 
      transform={`translate(${x}, ${y})`} 
      onClick={() => setSelectedStage(stageName)}
      className="group cursor-pointer"
    >
      {/* Dynamic Glow / Pulse */}
      {pulse && (
        <rect
          x={-4} y={-4} width={width + 8} height={height + 8} rx={radius + 4}
          fill="none"
          stroke={stroke}
          strokeWidth={1}
          className={status === "running" ? "animate-[pulse-ring-blue_2s_infinite]" : "animate-[pulse-ring-amber_3s_infinite]"}
          opacity={0.3}
        />
      )}
      
      {/* Main Node Body (Glassmorphism) */}
      <rect
        x={0} y={0} width={width} height={height} rx={radius}
        fill={fill}
        fillOpacity={0.8}
        stroke={isSelected ? "var(--border-focus)" : stroke}
        strokeWidth={isSelected ? 2 : 1}
        className="transition-all duration-300 group-hover:stroke-[var(--text-secondary)]"
        filter="url(#glass-blur)"
      />

      {/* Hover Highlight Overlay */}
      <rect
        x={0} y={0} width={width} height={height} rx={radius}
        fill="white"
        fillOpacity={0}
        className="transition-all duration-300 group-hover:fill-opacity-[0.03]"
        pointerEvents="none"
      />

      {/* Content wrapper */}
      <foreignObject x={0} y={0} width={width} height={height} className="pointer-events-none">
        <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center transition-transform duration-300 group-hover:scale-105">
          <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900/50 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
            <Icon className="h-4 w-4" style={{ color: isSelected ? "var(--border-focus)" : "var(--text-primary)" }} />
          </div>
          <span className="font-display text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-primary)] leading-none">
            {config.title}
          </span>
          <span className="font-body text-[8px] font-medium text-[var(--text-tertiary)] leading-none mt-1 group-hover:text-[var(--text-secondary)] transition-colors">
            {config.role}
          </span>
        </div>
      </foreignObject>

      {/* Status Badge (Mini-pill) */}
      <foreignObject x={width / 2 - 20} y={height - 10} width={40} height={14} className="pointer-events-none overflow-visible">
        <div className="flex items-center justify-center">
          <div 
            className="flex items-center gap-1 rounded-full px-1.5 py-0.5 border shadow-sm backdrop-blur-md"
            style={{ 
              backgroundColor: "rgba(9, 9, 11, 0.8)",
              borderColor: stroke,
              color: statusColor
            }}
          >
            {StatusIcon && <StatusIcon className={`h-2 w-2 ${status === 'running' ? 'animate-spin' : ''}`} />}
            <span className="font-mono text-[7px] font-bold uppercase tracking-tighter">
              {status}
            </span>
          </div>
        </div>
      </foreignObject>

      {/* Selection Ring (Animated) */}
      {isSelected && (
        <rect
          x={-2} y={-2} width={width + 4} height={height + 4} rx={radius + 2}
          fill="none"
          stroke="var(--border-focus)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          className="animate-[dash-flow_2s_linear_infinite]"
          opacity={0.6}
        />
      )}
    </g>
  );
}
