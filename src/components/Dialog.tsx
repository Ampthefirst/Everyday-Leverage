import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';

/** Accessible modal built on <dialog>: focus is trapped and Esc closes. */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="dlg-title"
      className="m-auto w-[min(40rem,calc(100vw-2rem))] border-[3px] border-double border-rule bg-surface p-0 text-text backdrop:bg-black/70"
    >
      <div className="flex items-center justify-between border-b border-rule px-5 py-2">
        <h2 id="dlg-title" className="text-3xl text-primary">
          {title}
        </h2>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
    </dialog>
  );
}
