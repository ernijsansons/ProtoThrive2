/**
 * Validated Form Component
 * Complete form management with inline validation
 */

import React, { useState, useCallback, FormEvent } from 'react';
import { FormValidator, ValidationRule } from '@/utils/formValidation';
import ValidatedInput from './ValidatedInput';

interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea';
  rules?: ValidationRule[];
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  autoComplete?: string;
}

interface ValidatedFormProps {
  fields: FormField[];
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
  submitText?: string;
  className?: string;
  showSuccess?: boolean;
  resetOnSubmit?: boolean;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export const ValidatedForm: React.FC<ValidatedFormProps> = ({
  fields,
  onSubmit,
  submitText = 'Submit',
  className = '',
  showSuccess = true,
  resetOnSubmit = false,
  children,
  'data-testid': dataTestId
}) => {
  const [values, setValues] = useState<Record<string, string>>(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateField = useCallback((name: string, value: string) => {
    const field = fields.find(f => f.name === name);
    if (!field) return '';

    const rules = field.rules || [];
    if (field.required && !rules.some(r => r.type === 'required')) {
      rules.unshift({
        type: 'required',
        message: `${field.label} is required`
      });
    }

    const result = FormValidator.validate(value, rules);
    return result.isValid ? '' : result.error || '';
  }, [fields]);

  const validateAllFields = useCallback(() => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const error = validateField(field.name, values[field.name]);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [fields, values, validateField]);

  const handleFieldChange = useCallback((name: string) => (value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setSubmitError('');
    setSubmitSuccess(false);

    // Clear error for this field if it's valid
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  const handleFieldBlur = useCallback((name: string) => () => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [values, validateField]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = fields.reduce((acc, field) => ({ ...acc, [field.name]: true }), {});
    setTouched(allTouched);

    // Validate all fields
    if (!validateAllFields()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      await onSubmit(values);
      setSubmitSuccess(true);

      if (resetOnSubmit) {
        setValues(fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {}));
        setTouched({});
        setErrors({});
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'An error occurred. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = fields.every(field => {
    const error = validateField(field.name, values[field.name]);
    return !error;
  });

  return (
    <form
      onSubmit={handleSubmit}
      className={`validated-form ${className}`}
      data-testid={dataTestId || 'validated-form'}
      noValidate
    >
      {fields.map(field => (
        <ValidatedInput
          key={field.name}
          name={field.name}
          label={field.label}
          type={field.type}
          value={values[field.name]}
          onChange={handleFieldChange(field.name)}
          onBlur={handleFieldBlur(field.name)}
          rules={field.rules}
          placeholder={field.placeholder}
          required={field.required}
          helpText={field.helpText}
          autoComplete={field.autoComplete}
          showSuccess={showSuccess}
          data-testid={`form-field-${field.name}`}
        />
      ))}

      {children}

      {/* Submit error message */}
      {submitError && (
        <div
          className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm font-medium">Error</p>
          <p className="text-sm">{submitError}</p>
        </div>
      )}

      {/* Submit success message */}
      {submitSuccess && showSuccess && (
        <div
          className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-medium">Success!</p>
          <p className="text-sm">Form submitted successfully.</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting || !isFormValid}
        className={`
          w-full px-6 py-3 font-medium rounded-lg transition-all duration-200
          ${isSubmitting || !isFormValid
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        data-testid="form-submit-button"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Submitting...
          </span>
        ) : (
          submitText
        )}
      </button>
    </form>
  );
};

export default ValidatedForm;