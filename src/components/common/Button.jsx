import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      type = 'button',
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed select-none press-scale';

    const variants = {
      primary:
        'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 shadow-sm hover:shadow-md hover:shadow-amber-500/25 focus:ring-amber-500/50 font-bold',
      accent:
        'bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 active:from-amber-600 active:to-amber-800 text-slate-950 shadow-sm hover:shadow-md hover:shadow-amber-500/20 focus:ring-amber-500/50 font-bold',
      secondary:
        'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm hover:shadow focus:ring-emerald-500/20',
      dark:
        'bg-slate-950 hover:bg-slate-900 active:bg-black text-amber-400 border border-amber-500/30 shadow-sm focus:ring-amber-500/40 font-bold',
      danger:
        'bg-gradient-to-b from-rose-500 to-rose-700 hover:from-rose-500 hover:to-rose-800 active:from-rose-700 active:to-rose-900 text-white shadow-sm hover:shadow-md hover:shadow-rose-500/20 focus:ring-rose-500/50',
      outline:
        'bg-transparent hover:bg-amber-50/70 text-amber-700 border border-amber-500 focus:ring-amber-500/30 font-bold',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-600 active:bg-slate-200 focus:ring-slate-300',
    };

    const sizes = {
      sm: 'px-2.5 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : LeftIcon ? (
          <LeftIcon className="w-4 h-4" />
        ) : null}
        {children}
        {!isLoading && RightIcon && <RightIcon className="w-4 h-4" />}
      </button>
    );
  }
);

Button.displayName = 'Button';
