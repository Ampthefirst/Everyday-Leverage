import { useId, useRef, type ReactNode, type KeyboardEvent } from 'react';
import { withTransition } from '../app/transition';

export interface TabDef<T extends string> {
  id: T;
  label: string;
}

/** WAI-ARIA tabs with arrow-key navigation. */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  children,
  label,
}: {
  tabs: TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
  children: ReactNode;
  label: string;
}) {
  const base = useId();
  // The underline glides to the chosen tab (one shared view-transition name per tab list).
  const line = `tab-line-${base.replace(/[^a-z0-9]/gi, '')}`;
  const choose = (id: T) => withTransition(() => onChange(id));
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next >= 0) {
      e.preventDefault();
      choose(tabs[next].id);
      refs.current[next]?.focus();
    }
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-rule px-2">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`${base}-tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`${base}-panel`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => choose(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`tap relative shrink-0 px-3 text-base font-semibold whitespace-nowrap ${active === t.id ? 'text-text' : 'text-muted hover:text-text'}`}
          >
            {t.label}
            {active === t.id && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-0.5 bg-text"
                style={{ viewTransitionName: line }}
              />
            )}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${base}-panel`}
        aria-labelledby={`${base}-tab-${active}`}
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto p-4"
      >
        {children}
      </div>
    </div>
  );
}
