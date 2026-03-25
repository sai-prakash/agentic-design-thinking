export function MainLayout({ children, sidePanel }: { children: React.ReactNode, sidePanel?: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
      <main className="flex flex-1 flex-col overflow-auto bg-[var(--bg-base)]">
        <div className="mx-auto w-full max-w-6xl flex-1 p-6 flex flex-col items-center">
          {children}
        </div>
      </main>
      
      {sidePanel && (
        <aside className="border-l bg-[var(--bg-surface)] w-full lg:w-[420px] shrink-0 border-t lg:border-t-0 flex flex-col h-full lg:h-auto overflow-hidden">
          {sidePanel}
        </aside>
      )}
    </div>
  );
}
