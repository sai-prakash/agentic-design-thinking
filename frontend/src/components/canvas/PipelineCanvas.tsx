import { usePipelineStore } from '../../store/pipeline-store';
import { StageNode } from './StageNode';
import { FlowEdge } from './FlowEdge';
import { LoopEdge } from './LoopEdge';
import type { StageName } from '../../types';

const STAGES: StageName[] = ["empathize", "define", "ideate", "prototype", "test"];

export function PipelineCanvas() {
  const { state } = usePipelineStore();
  
  // Canvas settings
  const canvasWidth = 860;
  const canvasHeight = 160;
  
  const nodeWidth = 120;
  const nodeHeight = 72;
  const gap = 45;
  
  // Calculate X layout
  const totalNodesWidth = (STAGES.length * nodeWidth) + ((STAGES.length - 1) * gap);
  const startX = (canvasWidth - totalNodesWidth) / 2;
  const nodeY = (canvasHeight - nodeHeight) / 2;

  // Track isActive flow
  const _isStageRunning = (stageName: StageName) => {
    return state?.current_stage === stageName && !state?.[stageName]?.status;
  };

  const getStatus = (stageName: StageName) => state?.[stageName]?.status;
  
  return (
    <div className="w-full flex justify-center items-center py-6 px-4 bg-zinc-[var(--bg-base)]">
      <svg 
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} 
        className="w-full max-w-5xl h-auto"
        style={{
          '--dash-offset': '-20'
        } as React.CSSProperties}
      >
        <defs>
          {/* Glass-blur filter for nodes */}
          <filter id="glass-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Glow filter for active elements */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <marker 
            id="arrow" 
            viewBox="0 0 10 10" 
            refX="8" refY="5" 
            markerWidth="4" markerHeight="4" 
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border-default)" />
          </marker>
          
          <marker 
            id="arrow-loop" 
            viewBox="0 0 10 10" 
            refX="8" refY="5" 
            markerWidth="5" markerHeight="5" 
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--status-loop)" />
          </marker>
        </defs>

        {/* Draw Edges */}
        {STAGES.map((stage, i) => {
          if (i === STAGES.length - 1) return null;
          
          const nextStage = STAGES[i + 1];
          const currX = startX + (i * (nodeWidth + gap));
          const nextX = startX + ((i + 1) * (nodeWidth + gap));
          
          // An edge is animated if the source stage is completed 
          // AND the target stage is running or the target is awaiting review
          const currStatus = getStatus(stage);
          const nextStatus = getStatus(nextStage);
          const nextRunning = _isStageRunning(nextStage);
          
          const isAnimated = (currStatus === "approved") && (nextRunning || nextStatus === "awaiting_review");
          
          return (
            <FlowEdge 
              key={`edge-${i}`}
              startX={currX + nodeWidth} 
              startY={nodeY + (nodeHeight / 2)} 
              endX={nextX} 
              endY={nodeY + (nodeHeight / 2)} 
              animated={isAnimated}
            />
          );
        })}
        
        {/* Draw Loop back edges */}
        {state && state.iteration_count > 0 && state.loop_target && (
          <LoopEdge
            startX={startX + (STAGES.indexOf("test") * (nodeWidth + gap)) + (nodeWidth / 2)}
            startY={nodeY}
            endX={startX + (STAGES.indexOf(state.loop_target as StageName) * (nodeWidth + gap)) + (nodeWidth / 2)}
            iteration={state.iteration_count}
          />
        )}

        {/* Draw Nodes */}
        {STAGES.map((stage, i) => (
          <StageNode 
            key={stage}
            stageName={stage} 
            x={startX + (i * (nodeWidth + gap))} 
            y={nodeY} 
          />
        ))}
      </svg>
    </div>
  );
}
