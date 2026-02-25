'use client';

/* ═══════════════════════════════════════════════════════
   TestSessionSkeleton — Loading state for the
   TestingStep component.

   Mirrors the layout of the real UI with animated
   pulse placeholders so the transition feels smooth.
   ═══════════════════════════════════════════════════════ */

export function PulseLine({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 ${className}`}
    />
  );
}

/** Skeleton for the StatusIndicator bar */
export function StatusBarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 bg-slate-50/80 px-4 py-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"
        >
          <div className="h-3 w-3 animate-pulse rounded-full bg-slate-200" />
          <PulseLine className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for the Real-Time Data card grid */
export function RealTimeDataSkeleton() {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <div className="h-6 w-6 animate-pulse rounded-lg bg-slate-200" />
        <PulseLine className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm"
          >
            <PulseLine className="mb-2 h-3 w-16" />
            <PulseLine className="h-7 w-14" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Combined full-page skeleton for the entire testing step */
export function TestingStepSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Status bar skeleton */}
      <StatusBarSkeleton />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Model info skeleton */}
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <PulseLine className="h-3 w-12" />
                <PulseLine className="h-9 w-28 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Real-time data skeleton */}
          <RealTimeDataSkeleton />

          {/* Detailed test data skeleton */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-6 w-6 animate-pulse rounded-lg bg-slate-200" />
              <PulseLine className="h-4 w-36" />
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <PulseLine className="mb-4 h-4 w-48 border-b border-slate-200 pb-3" />
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex justify-between border-b border-slate-100 pb-2.5">
                        <PulseLine className="h-3.5 w-36" />
                        <PulseLine className="h-3.5 w-12" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Sidebar skeleton */}
        <aside className="hidden md:flex w-28 flex-col border-l border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-center border-b border-slate-200" style={{ flex: '0 0 40%' }}>
            <PulseLine className="h-10 w-20 rounded-lg" />
          </div>
          <div className="flex flex-col items-center justify-center gap-3" style={{ flex: '0 0 60%' }}>
            <PulseLine className="h-3 w-16" />
            <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-200" />
            <PulseLine className="h-6 w-12" />
          </div>
        </aside>
      </div>

      {/* Bottom bar skeleton */}
      <div className="shrink-0 flex items-center justify-between border-t border-slate-200/80 bg-white px-4 py-2 sm:px-6">
        <PulseLine className="h-10 w-36 rounded-xl" />
        <PulseLine className="h-10 w-44 rounded-xl" />
      </div>
    </div>
  );
}
