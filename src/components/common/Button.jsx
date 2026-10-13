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
        'bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-500 hover:to-emerald-800 active:from-emerald-700 active:to-emerald-900 text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/20 focus:ring-emerald-500/50 font-semibold',
      accent:
        'bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 active:from-orange-600 active:to-orange-800 text-white shadow-sm hover:shadow-md hover:shadow-orange-500/20 focus:ring-orange-500/50 font-semibold',
      secondary:
        'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm hover:shadow focus:ring-emerald-500/20',
      dark:
        'bg-gradient-to-b from-slate-800 to-slate-950 hover:from-slate-700 hover:to-slate-900 active:from-slate-900 active:to-slate-950 text-white shadow-sm focus:ring-slate-900/50',
      danger:
        'bg-gradient-to-b from-rose-500 to-rose-700 hover:from-rose-500 hover:to-rose-800 active:from-rose-700 active:to-rose-900 text-white shadow-sm hover:shadow-md hover:shadow-rose-500/20 focus:ring-rose-500/50',
      outline:
        'bg-transparent hover:bg-emerald-50 text-emerald-700 border border-emerald-600 focus:ring-emerald-500/30',
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
