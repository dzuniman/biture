import React, { useState, useRef, useEffect } from 'react';

export interface ActionMenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: 'normal' | 'primary' | 'danger' | 'success';
  disabled?: boolean;
}

interface ActionMenuProps {
  items?: ActionMenuItem[];
  children?: React.ReactNode;
  label?: string;
}

export default function ActionMenu({ items, children, label = 'Actions ▾' }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const calculatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const itemCount = items?.length || 3;
    const estimatedHeight = itemCount * 36 + 16;

    const spaceBelow = window.innerHeight - rect.bottom;
    const opensUpward = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    const rightOffset = Math.max(8, window.innerWidth - rect.right);

    if (opensUpward) {
      setMenuStyle({
        position: 'fixed',
        bottom: `${window.innerHeight - rect.top + 4}px`,
        right: `${rightOffset}px`,
        zIndex: 99999,
        maxHeight: '300px',
        overflowY: 'auto'
      });
    } else {
      setMenuStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        right: `${rightOffset}px`,
        zIndex: 99999,
        maxHeight: '300px',
        overflowY: 'auto'
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen) {
        calculatePosition();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        type="button"
        className="btn-secondary small"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        style={{
          padding: '5px 10px',
          fontSize: '0.78rem',
          background: '#081d31',
          color: '#ffffff',
          border: '1px solid #1e293b',
          borderRadius: '6px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}
      >
        <span>{label}</span>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#ffffff',
            border: '1.5px solid #000000',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)',
            padding: '6px',
            minWidth: '130px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            ...menuStyle
          }}
        >
          {items && items.length > 0 ? (
            items.map((item, idx) => (
              <button
                key={idx}
                type="button"
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  item.onClick();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  color:
                    item.variant === 'danger'
                      ? '#dc2626'
                      : item.variant === 'success'
                      ? '#16a34a'
                      : item.variant === 'primary'
                      ? '#2563eb'
                      : '#334155',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.background = item.variant === 'danger' ? '#fef2f2' : '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            ))
          ) : (
            <div style={{ padding: '6px 8px' }} onClick={() => setIsOpen(false)}>
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
