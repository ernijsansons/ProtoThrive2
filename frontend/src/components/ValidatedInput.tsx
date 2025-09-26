/**
 * Validated Input Component with Inline Validation
 * Fixes UX-004: Form validation not inline
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FormValidator, ValidationRule } from '@/utils/formValidation';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ValidatedInputProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  rules?: ValidationRule[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
  showSuccess?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  helpText?: string;
  'aria-describedby'?: string;
  'data-testid'?: string;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  rules = [],
  placeholder,
  required = false,
  disabled = false,
  autoComplete,
  className = '',
  showSuccess = true,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
  helpText,
  'aria-describedby': ariaDescribedBy,
  'data-testid': dataTestId
}) => {
  const [error, setError] = useState<string>('');
  const [touched, setTouched] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Add required rule if prop is set
  const validationRules = useMemo(() => {
    if (required && !rules.some(r => r.type === 'required')) {
      return [
        { type: 'required' as const, message: `${label} is required` },
        ...rules
      ];
    }
    return rules;
  }, [required, rules, label]);

  // Debounced validation function
  const debouncedValidate = useMemo(
    () => FormValidator.debounce((inputValue: string) => {
      setIsValidating(true);
      const result = FormValidator.validate(inputValue, validationRules);

      if (result.isValid) {
        setError('');
        setIsValid(true);
      } else {
        setError(result.error || '');
        setIsValid(false);
      }
      setIsValidating(false);
    }, debounceMs),
    [validationRules, debounceMs]
  );

  // Validate on change if enabled
  useEffect(() => {
    if (validateOnChange && touched && value) {
      debouncedValidate(value);
    }
  }, [value, touched, validateOnChange, debouncedValidate]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (!touched) {
      setTouched(true);
    }
  }, [onChange, touched]);

  const handleBlur = useCallback(() => {
    setTouched(true);

    if (validateOnBlur) {
      const result = FormValidator.validate(value, validationRules);
      if (result.isValid) {
        setError('');
        setIsValid(true);
      } else {
        setError(result.error || '');
        setIsValid(false);
      }
    }

    onBlur?.();
  }, [value, validationRules, validateOnBlur, onBlur]);

  const inputId = `input-${name}`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;

  const ariaProps = {
    'aria-invalid': touched && !!error,
    'aria-describedby': [
      ariaDescribedBy,
      error && touched ? errorId : null,
      helpText ? helpId : null
    ].filter(Boolean).join(' ') || undefined,
    'aria-required': required
  };

  const inputClasses = `
    w-full px-4 py-2 border rounded-lg transition-all duration-200
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${touched && error
      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
      : touched && isValid && showSuccess
      ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-200'
      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
    }
    focus:outline-none
    ${className}
  `.trim();

  const InputComponent = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className="form-field mb-4">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>

      <div className="relative">
        <InputComponent
          id={inputId}
          name={name}
          type={type === 'textarea' ? undefined : type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={inputClasses}
          data-testid={dataTestId || `input-${name}`}
          {...ariaProps}
        />

        {/* Validation status icons */}
        {touched && !isValidating && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {error ? (
              <AlertCircle
                className="w-5 h-5 text-red-500"
                aria-hidden="true"
              />
            ) : isValid && showSuccess ? (
              <CheckCircle
                className="w-5 h-5 text-green-500"
                aria-hidden="true"
              />
            ) : null}
          </div>
        )}
      </div>

      {/* Help text */}
      {helpText && !error && (
        <p id={helpId} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}

      {/* Error message with animation */}
      {touched && error && (
        <p
          id={errorId}
          className="mt-1 text-sm text-red-600 animate-fadeIn"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default ValidatedInput;