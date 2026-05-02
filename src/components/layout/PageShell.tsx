interface Props {
  left?: React.ReactNode;
  center: React.ReactNode;
  right?: React.ReactNode;
}

export function PageShell({ left, center, right }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-8">
        {/* Left sidebar — hidden on mobile */}
        {left && (
          <aside className="hidden lg:block">
            {left}
          </aside>
        )}
        {/* Center — always visible */}
        <main className={left ? "" : "lg:col-start-2"}>
          {center}
        </main>
        {/* Right sidebar — hidden on mobile */}
        {right && (
          <aside className="hidden lg:block">
            {right}
          </aside>
        )}
      </div>
    </div>
  );
}
