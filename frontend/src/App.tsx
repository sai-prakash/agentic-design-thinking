import { usePipelineStore } from './store/pipeline-store';
import { useEventSource } from './hooks/use-event-source';
import { Landing } from './components/Landing';
import { WorkspaceTopBar } from './components/workspace/WorkspaceTopBar';
import { ChatPanel } from './components/chat/ChatPanel';
import { CanvasPages } from './components/workspace/CanvasPages';

export default function App() {
  const { sessionId } = usePipelineStore();

  useEventSource(sessionId);

  // Landing state — no session yet
  if (!sessionId) {
    return (
      <div className="h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] font-body">
        <Landing />
      </div>
    );
  }

  // Workspace state — session active
  return (
    <div className="flex h-screen w-full flex-col bg-[var(--bg-base)] text-[var(--text-primary)] font-body">
      <WorkspaceTopBar />
      <div className="flex flex-1 overflow-hidden">
        <ChatPanel />
        <CanvasPages />
      </div>
    </div>
  );
}
