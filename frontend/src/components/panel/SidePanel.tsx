import { useState, useEffect } from 'react';
import { usePipelineStore } from '../../store/pipeline-store';
import type { EmpathizeData, DefineData, IdeateData, PrototypeData, TestData } from '../../types';
import { EmpathizeView } from '../stages/EmpathizeView';
import { DefineView } from '../stages/DefineView';
import { IdeateView } from '../stages/IdeateView';
import { PrototypeView } from '../stages/PrototypeView';
import { TestView } from '../stages/TestView';
import { STAGE_CONFIG } from '../canvas/StageNode';
import { ApprovalBar } from './ApprovalBar';
import { EditMode } from './EditMode';
import { TracePanel } from './TracePanel';
import { OptimizerBanner } from './OptimizerBanner';
import { FileText, Activity, Clock, Zap, BarChart3 } from 'lucide-react';

export function SidePanel() {
  const { selectedStage, state } = usePipelineStore();
  const [isEditing, setIsEditing] = useState(false);
  
  // Reset edit mode when stage changes
  useEffect(() => {
    setIsEditing(false);
  }, [selectedStage]);

  if (!selectedStage) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-slide-up-fade flex-1">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-overlay)] text-[var(--text-tertiary)] shadow-inner">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="mb-2 font-display text-lg font-semibold text-[var(--text-primary)]">No Stage Selected</h3>
          <p className="max-w-[250px] font-body text-sm text-[var(--text-secondary)]">
            Click on a node in the pipeline canvas to view its detailed output and audit trace.
          </p>
        </div>
        <TracePanel />
      </div>
    );
  }

  const stageData = state?.[selectedStage];
  const config = STAGE_CONFIG[selectedStage];
  const Icon = config.icon;
  
  const renderStageContent = () => {
    if (!stageData || !stageData.data) {
      if (state?.current_stage === selectedStage && !stageData?.status) {
        return (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-[var(--text-secondary)] animate-pulse">
            <Activity className="h-8 w-8 text-[var(--status-running)]" />
            <p className="font-display text-sm tracking-wide">Processing...</p>
          </div>
        );
      }
      return (
        <div className="flex h-64 items-center justify-center text-sm text-[var(--text-tertiary)] italic">
          No output generated yet.
        </div>
      );
    }

    if (isEditing) {
      return <EditMode onCancel={() => setIsEditing(false)} />;
    }

    switch (selectedStage) {
      case 'empathize': return <EmpathizeView data={stageData.data as EmpathizeData} />;
      case 'define': return <DefineView data={stageData.data as DefineData} />;
      case 'ideate': return <IdeateView data={stageData.data as IdeateData} />;
      case 'prototype': return <PrototypeView data={stageData.data as PrototypeData} />;
      case 'test': return <TestView data={stageData.data as TestData} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-slide-up-fade">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shrink-0 shadow-sm relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-overlay)] text-[var(--text-primary)] shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-[var(--text-primary)] leading-tight">
              {config.title}
            </h2>
            <div className="flex items-center gap-2 font-body text-xs">
              <span className="text-[var(--text-secondary)] font-medium">{config.role}</span>
              {stageData?.status && (
                <>
                  <span className="text-[var(--text-tertiary)]">•</span>
                  <span className={`capitalize font-semibold ${
                    stageData.status === 'awaiting_review' ? 'text-[var(--status-review)]' : 
                    stageData.status === 'approved' ? 'text-[var(--status-approved)]' : 
                    stageData.status === 'rejected' ? 'text-red-500' :
                    'text-[var(--text-primary)]'
                  }`}>
                    {stageData.status.replace('_', ' ')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Stage Metadata */}
        {stageData?.timestamp && !isEditing && (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <span className="font-mono">{new Date(stageData.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-3">
              {stageData.latency_ms > 0 && (
                <div className="flex items-center gap-1 text-[10px]">
                  <Zap className="h-3 w-3 text-amber-500" />
                  <span>{(stageData.latency_ms / 1000).toFixed(1)}s</span>
                </div>
              )}
              {stageData.tokens_used > 0 && (
                <div className="flex items-center gap-1 text-[10px]">
                  <BarChart3 className="h-3 w-3 text-emerald-500" />
                  <span>{stageData.tokens_used} tkn</span>
                </div>
              )}
              {stageData.llm_used && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--text-tertiary)] capitalize leading-none">Model</span>
                  <span className="font-mono text-[10px] bg-[var(--bg-overlay)] rounded px-1.5 py-0.5 border border-zinc-700 font-medium">
                    {stageData.llm_used}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-5 scroll-smooth bg-[var(--bg-base)]">
        {renderStageContent()}
      </div>

      {/* Footer Controls */}
      {!isEditing && (
        <>
          <OptimizerBanner />
          { (stageData?.status === "awaiting_review" || stageData?.status === "rejected") && (
            <ApprovalBar 
              isEditing={isEditing} 
              onEditToggle={() => setIsEditing(!isEditing)} 
            />
          )}
        </>
      )}
      
      {/* Trace Panel at the very bottom */}
      <TracePanel />
    </div>
  );
}
