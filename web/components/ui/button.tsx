import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand/90 shadow-[0_12px_28px_-14px_rgba(8,124,255,0.9)]',
  secondary: 'bg-muted text-foreground hover:bg-muted/80 border border-border',
  outline: 'border border-border bg-transparent hover:bg-muted text-foreground',
  ghost: 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
  danger:
    'bg-danger text-white hover:bg-danger/90 shadow-[0_12px_28px_-14px_rgba(255,70,85,0.8)]',
  success:
    'bg-mint text-navy hover:bg-mint/90 shadow-[0_12px_28px_-14px_rgba(0,214,154,0.8)]',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 rounded-lg px-3 text-xs gap-1.5',
  md: 'h-10 rounded-xl px-4 text-sm gap-2',
  lg: 'h-12 rounded-xl px-6 text-base gap-2',
  icon: 'h-9 w-9 rounded-xl p-0',
};

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}): string {
  return cn(
    'inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}
