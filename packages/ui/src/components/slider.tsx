import * as React from 'react';
import { cn } from '../lib/utils';

export interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  min?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  formatLabel?: (value: number) => string;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, max = 100, min = 0, step = 1, value, defaultValue, onValueChange, formatLabel, disabled, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue ?? min);
    const currentValue = value !== undefined ? value : internalValue;

    const trackRef = React.useRef<HTMLDivElement>(null);

    const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const rawValue = min + ratio * (max - min);
      const stepped = Math.round(rawValue / step) * step;
      const clamped = Math.max(min, Math.min(max, stepped));
      if (value === undefined) setInternalValue(clamped);
      onValueChange?.(clamped);
    };

    const percentage = ((currentValue - min) / (max - min)) * 100;

    return (
      <div
        ref={ref}
        className={cn('relative flex w-full touch-none select-none items-center', className)}
        {...props}
      >
        <div
          ref={trackRef}
          className="relative h-2 w-full grow overflow-hidden rounded-full bg-surface-hover"
        >
          <div
            className="absolute h-full w-full origin-left bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'block h-5 w-5 rounded-full border border-border bg-surface-elevated shadow-sm transition-transform',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:pointer-events-none disabled:opacity-50',
            currentValue === min && 'translate-x-0',
            currentValue === max && 'translate-x-full',
            !disabled && currentValue !== min && currentValue !== max && 'translate-x-[50%]'
          )}
          style={{
            '--dx': `${percentage}%`,
          } as React.CSSProperties}
          onPointerDown={handlePointerDown}
        />
        {formatLabel && (
          <span className="ml-3 text-xs text-muted tabular-nums">
            {formatLabel(currentValue)}
          </span>
        )}
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
