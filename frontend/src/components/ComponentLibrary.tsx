// PROTOTHRIVE UI COMPONENT LIBRARY
// Use these components everywhere for consistency

import React, { ReactNode } from 'react';

// ============ BUTTONS ============
interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  href?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  onClick,
  href,
  className = '',
  type = 'button',
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
  };
  const sizeClasses = {
    small: 'btn-small',
    medium: '',
    large: 'btn-large',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes} type={type}>
      {children}
    </button>
  );
};

// ============ CARDS ============
interface CardProps {
  children: ReactNode;
  glow?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, glow = false, className = '' }) => {
  return (
    <div className={`card ${glow ? 'card-glow' : ''} ${className}`}>
      {children}
    </div>
  );
};

// ============ SECTION ============
interface SectionProps {
  children: ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({ children, className = '' }) => {
  return (
    <section className={`section ${className}`}>
      <div className="container">{children}</div>
    </section>
  );
};

// ============ GRADIENT TEXT ============
interface GradientTextProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export const GradientText: React.FC<GradientTextProps> = ({ children, as: Tag = 'span' }) => {
  return <Tag className="gradient-text">{children}</Tag>;
};

// ============ INPUT ============
interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  name?: string;
  id?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  name,
  id,
}) => {
  return (
    <div className="form-group">
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <input
        type={type}
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        name={name}
        id={id}
      />
    </div>
  );
};

// ============ LOADING SPINNER ============
export const LoadingSpinner: React.FC = () => (
  <div className="spinner">
    <div className="spinner-circle"></div>
  </div>
);
