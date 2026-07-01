import { ComponentChildren } from 'preact';
import { ChevronDown } from 'preact-feather';
import { useEffect, useRef, useState } from 'preact/hooks';

export interface SelectMenuOption {
  value: string;
  label: ComponentChildren;
  decoration?: ComponentChildren;
  disabled?: boolean;
}

interface SelectMenuProps {
  label: string;
  value: string;
  options: SelectMenuOption[];
  onChange: (value: string) => void;
  emptyLabel?: string;
  className?: string;
}

export function SelectMenu({ label, value, options, onChange, emptyLabel = 'No options available', className = '' }: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuWidth, setMenuWidth] = useState<number>();
  const [placement, setPlacement] = useState<'below' | 'above'>('below');
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];
  const disabled = options.length === 0;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const buttonRect = buttonRef.current?.getBoundingClientRect();
    const menuRect = menuRef.current?.getBoundingClientRect();
    if (!buttonRect || !menuRect) {
      setPlacement('below');
      return;
    }
    const menuHeight = menuRect.height || menuRef.current?.scrollHeight || 0;
    const belowSpace = window.innerHeight - buttonRect.bottom;
    const aboveSpace = buttonRect.top;
    setMenuWidth(buttonRect.width);
    setPlacement(menuHeight > belowSpace && aboveSpace > belowSpace ? 'above' : 'below');
  }, [open, options.length]);

  function chooseOption(option: SelectMenuOption) {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
  }

  return (
    <div class={`select-menu server-select ${open ? 'is-open' : ''} ${placement === 'above' ? 'is-above' : ''} ${className}`.trim()} ref={rootRef}>
      <button
        ref={buttonRef}
        class="select-menu-button server-select-button"
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((next) => !next)}
      >
        <span>{selected?.label ?? emptyLabel}</span>
        <ChevronDown aria-hidden="true" />
      </button>
      <div ref={menuRef} class="select-menu-list server-menu" role="listbox" aria-label={`${label} list`} style={menuWidth ? { width: `${menuWidth}px` } : undefined}>
        {options.map((option) => (
          <button
            class={`select-menu-option server-option ${option.value === value ? 'is-selected' : ''}`}
            type="button"
            role="option"
            aria-selected={option.value === value}
            aria-disabled={option.disabled ? 'true' : undefined}
            disabled={option.disabled}
            key={option.value}
            onClick={() => chooseOption(option)}
          >
            <span class="radio" />
            <span>{option.label}</span>
            {option.decoration}
          </button>
        ))}
      </div>
    </div>
  );
}
