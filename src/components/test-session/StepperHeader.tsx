'use client';

import { cn } from '@/lib/utils';
import type { TestStep } from '@/types/test-session';
import { Check, ClipboardList, FlaskConical, Upload } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   StepperHeader — visual progress indicator for the
   test workflow wizard (Upload → Review → Testing).
   ═══════════════════════════════════════════════════════ */

interface Step {
  id: TestStep;
  label: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: Step[] = [
  { id: 'upload', label: 'Upload', description: 'Import test data', icon: Upload },
  { id: 'review', label: 'Review', description: 'Verify parameters', icon: ClipboardList },
  { id: 'testing', label: 'Testing', description: 'Run motor tests', icon: FlaskConical },
];

interface StepperHeaderProps {
  currentStep: TestStep;
  completedSteps: Set<TestStep>;
  onStepClick?: (step: TestStep) => void;
}

export function StepperHeader({ currentStep, completedSteps, onStepClick }: StepperHeaderProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full border-b border-slate-200/80 bg-white px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(step.id);
            const isCurrent = step.id === currentStep;
            const isClickable = isCompleted || index <= currentIndex;

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                {/* Step indicator */}
                <button
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300',
                    isClickable && !isCurrent && 'cursor-pointer hover:bg-slate-50',
                    isCurrent && 'bg-indigo-50/80',
                    !isClickable && 'cursor-default opacity-40'
                  )}
                >
                  {/* Icon circle */}
                  <div
                    className={cn(
                      'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300',
                      isCompleted && 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20',
                      isCurrent && !isCompleted && 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20',
                      !isCurrent && !isCompleted && 'bg-slate-100 text-slate-400'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" strokeWidth={2.5} />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                    {/* Active pulse */}
                    {isCurrent && !isCompleted && (
                      <span className="absolute -inset-0.5 rounded-xl animate-pulse-glow" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="hidden sm:block text-left">
                    <p
                      className={cn(
                        'text-sm font-semibold leading-tight transition-colors',
                        isCurrent ? 'text-indigo-700' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                      )}
                    >
                      {step.label}
                    </p>
                    <p
                      className={cn(
                        'text-xs leading-tight mt-0.5',
                        isCurrent ? 'text-indigo-500' : isCompleted ? 'text-emerald-500' : 'text-slate-300'
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </button>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div className="flex-1 mx-3 sm:mx-5">
                    <div className="relative h-[3px] w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn(
                          'absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out',
                          isCompleted
                            ? 'w-full bg-gradient-to-r from-emerald-400 to-emerald-500'
                            : isCurrent
                              ? 'w-1/2 bg-gradient-to-r from-indigo-400 to-indigo-500'
                              : 'w-0'
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
