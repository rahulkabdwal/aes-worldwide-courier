import { Button } from "@/components/ui/button";

type ExpandableFormSectionProps = {
  title: string;
  actionLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  disabled?: boolean;
};

export function ExpandableFormSection({
  title,
  actionLabel,
  open,
  onOpenChange,
  children,
  disabled = false,
}: ExpandableFormSectionProps) {
  const hideLabel = actionLabel.replace(/^(Add|Upload|Edit)\s+/i, "");

  return (
    <section className="border-t border-neutral-200 pt-5">
      <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      <Button
        type="button"
        variant="outline"
        className="mt-3"
        onClick={() => onOpenChange(!open)}
        disabled={disabled}
        aria-expanded={open}
      >
        {open ? `− Hide ${hideLabel}` : `+ ${actionLabel}`}
      </Button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}
