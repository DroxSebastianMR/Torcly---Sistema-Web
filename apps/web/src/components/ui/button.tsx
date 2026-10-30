import { LoaderCircle } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
const variants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-transparent px-[18px] text-sm font-semibold leading-none transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out hover:not-disabled:-translate-y-px active:not-disabled:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_6px_16px_rgb(23_99_76_/_18%)] hover:bg-primary/90',
        outline:
          'border-primary/70 bg-card text-primary hover:border-primary hover:bg-muted',
        ghost: 'text-primary hover:bg-muted',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        dangerOutline:
          'border-red-500 bg-[linear-gradient(to_right,rgb(220_38_38)_50%,var(--card)_50%)] bg-[position:100%_0] bg-[length:200%_100%] text-red-700 transition-[color,background-position,border-color,box-shadow,transform] duration-200 hover:border-red-600 hover:bg-[position:0_0] hover:text-white hover:shadow-[0_6px_16px_rgb(239_68_68_/_20%)]',
        excelOutline:
          'border-[#217346] bg-[linear-gradient(to_top,var(--card)_50%,#217346_50%)] bg-[position:0_100%] bg-[length:100%_200%] text-[#1c613b] transition-[color,background-position,border-color,box-shadow,transform] duration-200 hover:border-[#217346] hover:bg-[position:0_0] hover:text-white hover:shadow-[0_6px_16px_rgb(33_115_70_/_22%)]',
      },
      size: {
        sm: 'min-h-[34px] px-3 text-xs',
        md: 'min-h-11 px-[18px] text-sm',
        lg: 'min-h-12 px-[22px] text-[15px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)
export function Button({
  className,
  variant,
  size,
  asChild = false,
  disabled,
  loading = false,
  'aria-busy': ariaBusy,
  ...props
}: ComponentProps<'button'> &
  VariantProps<typeof variants> & { asChild?: boolean; loading?: boolean }) {
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      className={cn(variants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || ariaBusy}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
      {props.children}
    </Component>
  )
}
