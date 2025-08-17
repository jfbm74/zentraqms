import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  children: React.ReactNode;
  className?: string;
}

interface DropdownToggleProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
  show?: boolean;
}

interface DropdownItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const DropdownContext = React.createContext<{
  isOpen: boolean;
  toggle: () => void;
}>({
  isOpen: false,
  toggle: () => {},
});

export const Dropdown: React.FC<DropdownProps> = ({ children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <DropdownContext.Provider value={{ isOpen, toggle }}>
      <div ref={dropdownRef} className={`dropdown ${className}`}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export const DropdownToggle: React.FC<DropdownToggleProps> = ({ 
  children, 
  className = '', 
  onClick 
}) => {
  const { toggle } = React.useContext(DropdownContext);

  const handleClick = () => {
    toggle();
    onClick?.();
  };

  return (
    <button
      type="button"
      className={`dropdown-toggle ${className}`}
      onClick={handleClick}
      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
    >
      {children}
    </button>
  );
};

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
  children, 
  className = '',
  show
}) => {
  const { isOpen } = React.useContext(DropdownContext);
  const shouldShow = show !== undefined ? show : isOpen;

  return (
    <ul className={`dropdown-menu ${shouldShow ? 'show' : ''} ${className}`}>
      {children}
    </ul>
  );
};

export const DropdownItem: React.FC<DropdownItemProps> = ({ 
  children, 
  className = '', 
  onClick 
}) => {
  const { toggle } = React.useContext(DropdownContext);

  const handleClick = () => {
    onClick?.();
    toggle();
  };

  return (
    <li>
      <button
        type="button"
        className={`dropdown-item ${className}`}
        onClick={handleClick}
        style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
      >
        {children}
      </button>
    </li>
  );
};