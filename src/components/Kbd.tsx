/** A shortcut key shown beside a control, for sighted keyboard users. Screen readers get aria-keyshortcuts. */
export function Kbd({ k, inverse = false }: { k: string; inverse?: boolean }) {
  return (
    <kbd
      aria-hidden="true"
      className={`hidden min-w-6 rounded border px-1.5 text-center font-sans text-sm leading-5 font-medium md:inline-block ${inverse ? 'border-on-primary/50 text-on-primary' : 'border-border text-faint'}`}
    >
      {k}
    </kbd>
  );
}
