import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      required,
      className,
      containerClassName,
      leftIcon,
      LeftIcon,
      rightIcon,
      RightIcon,
      rightElement,
      prefix,
      suffix,
      id,
      ...props
    },
    ref
  ) => {
    const IconLeft = LeftIcon || leftIcon;
    const IconRight = RightIcon || rightIcon;
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn('w-full space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 tracking-wide"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative rounded-md shadow-sm">
          {prefix && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm font-medium">
              <span>{prefix}</span>
              {typeof prefix === 'string' && prefix.length > 1 && (
                <span className="mx-2 text-slate-300 font-normal">|</span>
              )}
            </div>
          )}
          {IconLeft && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <IconLeft className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-all focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:text-slate-400 placeholder:text-slate-400 border',
              prefix && (typeof prefix === 'string' && prefix.length > 1 ? 'pl-14' : 'pl-7'),
              IconLeft && 'pl-9',
              (suffix || IconRight || rightElement) && 'pr-9',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
              className
            )}
            {...props}
          />

          {suffix && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs font-medium">
              {suffix}
            </div>
          )}
          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center z-10">
              {rightElement}
            </div>
          )}
          {RightIcon && !rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <RightIcon className="w-4 h-4" />
            </div>
          )}
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
