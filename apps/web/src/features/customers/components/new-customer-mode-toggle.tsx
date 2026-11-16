import { UserPlus } from 'lucide-react'

interface NewCustomerModeToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id: string
  disabled?: boolean
  description?: string
}

/** Control compartido para el alta inmediata de cliente y vehículo. */
export function NewCustomerModeToggle({
  checked,
  onCheckedChange,
  id,
  disabled = false,
  description = 'Regístralo en el acto junto con su vehículo',
}: NewCustomerModeToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 px-3.5 py-2.5">
      <div className="flex items-center gap-2.5">
        <UserPlus className="size-4 shrink-0 text-primary" />
        <div>
          <label
            htmlFor={id}
            className="cursor-pointer text-sm font-semibold text-foreground"
          >
            ¿Es un cliente nuevo?
          </label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange(event.target.checked)}
        />
        <span className="h-6 w-11 rounded-full bg-input transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-forest peer-checked:after:translate-x-full peer-disabled:cursor-not-allowed peer-disabled:opacity-50" />
      </label>
    </div>
  )
}
