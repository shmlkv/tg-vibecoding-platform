'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  allowCustom?: boolean;
  customLabel?: string;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  openUpward: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search or type custom...',
  disabled = false,
  allowCustom = false,
  customLabel = 'Use custom:',
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 300,
    openUpward: true,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const isCustomValue = allowCustom && value && !selectedOption;

  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(search.toLowerCase()) ||
      option.value.toLowerCase().includes(search.toLowerCase()) ||
      option.description?.toLowerCase().includes(search.toLowerCase())
  );

  const showCustomOption =
    allowCustom &&
    search.trim() &&
    !options.some(
      (o) =>
        o.value.toLowerCase() === search.toLowerCase() ||
        o.label.toLowerCase() === search.toLowerCase()
    );

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
      setSearch('');
    },
    [onChange]
  );

  const handleCustomSelect = useCallback(() => {
    if (search.trim()) {
      onChange(search.trim());
      setIsOpen(false);
      setSearch('');
    }
  }, [onChange, search]);

  // Calculate dropdown position using fixed positioning
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const minTopPadding = 8; // minimum padding from top of screen
    const gap = 4; // gap between trigger and dropdown
    const searchInputHeight = 52; // approximate height of search input area
    const minDropdownHeight = 120;
    const preferredMaxHeight = 280;

    // Space available above and below the trigger
    const spaceAbove = triggerRect.top - minTopPadding;
    const spaceBelow = viewportHeight - triggerRect.bottom - minTopPadding;

    // Determine if we should open upward or downward
    const openUpward = spaceAbove > spaceBelow;

    let top: number;
    let maxHeight: number;

    if (openUpward) {
      // Open above: dropdown bottom aligns just above trigger
      // maxHeight is limited by space above minus search input
      maxHeight = Math.min(preferredMaxHeight, spaceAbove - searchInputHeight - gap);
      maxHeight = Math.max(minDropdownHeight, maxHeight);

      // Calculate top position: trigger top - gap - total dropdown height
      // Total dropdown height = maxHeight + searchInputHeight
      const totalDropdownHeight = maxHeight + searchInputHeight;
      top = triggerRect.top - gap - totalDropdownHeight;

      // Ensure it doesn't go above screen
      if (top < minTopPadding) {
        top = minTopPadding;
        maxHeight = triggerRect.top - gap - minTopPadding - searchInputHeight;
        maxHeight = Math.max(minDropdownHeight, maxHeight);
      }
    } else {
      // Open below: dropdown top aligns just below trigger
      top = triggerRect.bottom + gap;
      maxHeight = Math.min(preferredMaxHeight, spaceBelow - searchInputHeight - gap);
      maxHeight = Math.max(minDropdownHeight, maxHeight);
    }

    setDropdownPosition({
      top,
      left: triggerRect.left,
      width: triggerRect.width,
      maxHeight,
      openUpward,
    });
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate position when opened
  useLayoutEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen, calculatePosition]);

  // Recalculate on resize/scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => calculatePosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isOpen, calculatePosition]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure dropdown is rendered
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      } else if (e.key === 'Enter' && showCustomOption) {
        e.preventDefault();
        handleCustomSelect();
      }
    },
    [showCustomOption, handleCustomSelect]
  );

  const isOpeningUpward = dropdownPosition.openUpward;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '10px',
          border: '1px solid var(--tg-theme-hint-color, #ccc)',
          backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
          color: 'var(--tg-theme-text-color, #000)',
          fontSize: '14px',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          opacity: disabled ? 0.6 : 1,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          outline: 'none',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {isCustomValue ? (
            <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{value}</span>
          ) : selectedOption ? (
            <>
              {selectedOption.icon && <span style={{ marginRight: '4px' }}>{selectedOption.icon}</span>}
              {selectedOption.label}
            </>
          ) : (
            <span style={{ color: 'var(--tg-theme-hint-color, #999)' }}>{placeholder}</span>
          )}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="var(--tg-theme-hint-color, #999)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown - using fixed positioning */}
      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            backgroundColor: 'var(--tg-theme-bg-color, #fff)',
            border: '1px solid var(--tg-theme-hint-color, #ccc)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            zIndex: 9999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: isOpeningUpward ? 'column-reverse' : 'column',
            animation: isOpeningUpward ? 'comboboxSlideUp 0.15s ease-out' : 'comboboxSlideDown 0.15s ease-out',
          }}
        >
          <style>{`
            @keyframes comboboxSlideDown {
              from {
                opacity: 0;
                transform: translateY(-8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes comboboxSlideUp {
              from {
                opacity: 0;
                transform: translateY(8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>

          {/* Search input */}
          <div style={{
            padding: '8px',
            borderTop: isOpeningUpward ? '1px solid var(--tg-theme-hint-color, #eee)' : 'none',
            borderBottom: isOpeningUpward ? 'none' : '1px solid var(--tg-theme-hint-color, #eee)',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--tg-theme-hint-color, #ccc)',
                backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                color: 'var(--tg-theme-text-color, #000)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Options list */}
          <div
            style={{
              maxHeight: dropdownPosition.maxHeight,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '8px',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Custom value option */}
            {showCustomOption && (
              <button
                type="button"
                onClick={handleCustomSelect}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: 'var(--tg-theme-text-color, #000)',
                  fontSize: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <span style={{ fontWeight: 500 }}>{customLabel}</span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: 'var(--tg-theme-link-color, #3390ec)',
                  }}
                >
                  {search}
                </span>
              </button>
            )}

            {filteredOptions.length === 0 && !showCustomOption ? (
              <div
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  color: 'var(--tg-theme-hint-color, #999)',
                  fontSize: '13px',
                }}
              >
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isSelected
                        ? 'var(--tg-theme-button-color, #3390ec)'
                        : 'transparent',
                      color: isSelected
                        ? 'var(--tg-theme-button-text-color, #fff)'
                        : 'var(--tg-theme-text-color, #000)',
                      fontSize: '14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      marginBottom: '2px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      transition: 'background-color 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor =
                          'var(--tg-theme-secondary-bg-color, #f5f5f5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {option.icon && <span>{option.icon}</span>}
                      <span style={{ fontWeight: 500 }}>{option.label}</span>
                      {isSelected && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          style={{ marginLeft: 'auto' }}
                        >
                          <path
                            d="M2.5 7.5L5.5 10.5L11.5 4.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    {option.description && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: isSelected
                            ? 'rgba(255, 255, 255, 0.8)'
                            : 'var(--tg-theme-hint-color, #999)',
                        }}
                      >
                        {option.description}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
