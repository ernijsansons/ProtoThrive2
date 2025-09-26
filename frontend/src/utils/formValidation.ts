/**
 * Form Validation Utilities
 * Provides comprehensive inline validation for forms
 */

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class FormValidator {
  private static validators = {
    required: (value: any): boolean => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value != null && value !== '';
    },

    email: (value: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },

    minLength: (value: string, min: number): boolean => {
      return value.length >= min;
    },

    maxLength: (value: string, max: number): boolean => {
      return value.length <= max;
    },

    pattern: (value: string, pattern: RegExp): boolean => {
      return pattern.test(value);
    },

    url: (value: string): boolean => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },

    phone: (value: string): boolean => {
      const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
      return phoneRegex.test(value);
    },

    alphanumeric: (value: string): boolean => {
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      return alphanumericRegex.test(value);
    },

    number: (value: any): boolean => {
      return !isNaN(parseFloat(value)) && isFinite(value);
    },

    integer: (value: any): boolean => {
      return Number.isInteger(Number(value));
    },

    range: (value: number, min: number, max: number): boolean => {
      const num = Number(value);
      return num >= min && num <= max;
    }
  };

  static validate(value: any, rules: ValidationRule[]): ValidationResult {
    for (const rule of rules) {
      let isValid = false;

      switch (rule.type) {
        case 'required':
          isValid = this.validators.required(value);
          break;

        case 'email':
          isValid = !value || this.validators.email(value);
          break;

        case 'minLength':
          isValid = !value || this.validators.minLength(value, rule.value);
          break;

        case 'maxLength':
          isValid = !value || this.validators.maxLength(value, rule.value);
          break;

        case 'pattern':
          isValid = !value || this.validators.pattern(value, rule.value);
          break;

        case 'custom':
          isValid = rule.validator ? rule.validator(value) : true;
          break;

        default:
          isValid = true;
      }

      if (!isValid) {
        return {
          isValid: false,
          error: rule.message
        };
      }
    }

    return { isValid: true };
  }

  static validateForm(values: Record<string, any>, schema: Record<string, ValidationRule[]>): Record<string, string> {
    const errors: Record<string, string> = {};

    for (const [field, rules] of Object.entries(schema)) {
      const result = this.validate(values[field], rules);
      if (!result.isValid && result.error) {
        errors[field] = result.error;
      }
    }

    return errors;
  }

  static createSchema(fields: {
    [key: string]: {
      required?: boolean;
      email?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      customMessage?: string;
    }
  }): Record<string, ValidationRule[]> {
    const schema: Record<string, ValidationRule[]> = {};

    for (const [field, config] of Object.entries(fields)) {
      const rules: ValidationRule[] = [];

      if (config.required) {
        rules.push({
          type: 'required',
          message: config.customMessage || `${field} is required`
        });
      }

      if (config.email) {
        rules.push({
          type: 'email',
          message: 'Please enter a valid email address'
        });
      }

      if (config.minLength !== undefined) {
        rules.push({
          type: 'minLength',
          value: config.minLength,
          message: `Must be at least ${config.minLength} characters`
        });
      }

      if (config.maxLength !== undefined) {
        rules.push({
          type: 'maxLength',
          value: config.maxLength,
          message: `Must be no more than ${config.maxLength} characters`
        });
      }

      if (config.pattern) {
        rules.push({
          type: 'pattern',
          value: config.pattern,
          message: 'Invalid format'
        });
      }

      schema[field] = rules;
    }

    return schema;
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }
}

export default FormValidator;