# Input Validation Utilities
import re
from typing import Any, Dict, List, Optional
from dataclasses import dataclass

@dataclass
class ValidationError:
    field: str
    message: str
    code: str

class InputValidator:
    """Comprehensive input validation"""
    
    def __init__(self):
        self.errors: List[ValidationError] = []
    
    def validate_email(self, email: str, field_name: str = 'email') -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            self.errors.append(ValidationError(
                field=field_name,
                message='Invalid email format',
                code='INVALID_EMAIL'
            ))
            return False
        return True
    
    def validate_password(self, password: str, field_name: str = 'password') -> bool:
        """Validate password strength with enhanced security"""
        if len(password) < 12:
            self.errors.append(ValidationError(
                field=field_name,
                message='Password must be at least 12 characters long',
                code='PASSWORD_TOO_SHORT'
            ))
            return False
        
        if not re.search(r'[A-Z]', password):
            self.errors.append(ValidationError(
                field=field_name,
                message='Password must contain at least one uppercase letter',
                code='PASSWORD_NO_UPPERCASE'
            ))
            return False
        
        if not re.search(r'[a-z]', password):
            self.errors.append(ValidationError(
                field=field_name,
                message='Password must contain at least one lowercase letter',
                code='PASSWORD_NO_LOWERCASE'
            ))
            return False
        
        if not re.search(r'\d', password):
            self.errors.append(ValidationError(
                field=field_name,
                message='Password must contain at least one digit',
                code='PASSWORD_NO_DIGIT'
            ))
            return False
        
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
            self.errors.append(ValidationError(
                field=field_name,
                message='Password must contain at least one special character',
                code='PASSWORD_NO_SPECIAL'
            ))
            return False
        
        # Check for common weak patterns
        weak_patterns = [
            r'(123|abc|qwe|password|admin|user)',
            r'(.)\1{2,}',  # Repeated characters
            r'(qwerty|asdfgh|zxcvbn)',
            r'(111|222|333|444|555|666|777|888|999|000)'
        ]
        
        for pattern in weak_patterns:
            if re.search(pattern, password.lower()):
                self.errors.append(ValidationError(
                    field=field_name,
                    message='Password contains weak patterns',
                    code='PASSWORD_WEAK_PATTERN'
                ))
                return False
        
        return True
    
    def validate_string_length(self, value: str, min_length: int, max_length: int, 
                              field_name: str) -> bool:
        """Validate string length"""
        if len(value) < min_length:
            self.errors.append(ValidationError(
                field=field_name,
                message=f'Value must be at least {min_length} characters long',
                code='VALUE_TOO_SHORT'
            ))
            return False
        
        if len(value) > max_length:
            self.errors.append(ValidationError(
                field=field_name,
                message=f'Value must be no more than {max_length} characters long',
                code='VALUE_TOO_LONG'
            ))
            return False
        
        return True
    
    def sanitize_html(self, html: str) -> str:
        """Sanitize HTML input"""
        # Remove potentially dangerous tags
        dangerous_tags = ['script', 'iframe', 'object', 'embed', 'form']
        for tag in dangerous_tags:
            html = re.sub(f'<{tag}[^>]*>.*?</{tag}>', '', html, flags=re.IGNORECASE | re.DOTALL)
            html = re.sub(f'<{tag}[^>]*>', '', html, flags=re.IGNORECASE)
        
        # Remove dangerous attributes
        dangerous_attrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'javascript:']
        for attr in dangerous_attrs:
            html = re.sub(f'{attr}=["'][^"']*["']', '', html, flags=re.IGNORECASE)
        
        return html
    
    def validate_json_schema(self, data: Dict[str, Any], schema: Dict[str, Any]) -> bool:
        """Validate data against JSON schema"""
        # Simple JSON schema validation
        for field, rules in schema.items():
            if field not in data:
                if rules.get('required', False):
                    self.errors.append(ValidationError(
                        field=field,
                        message=f'Required field {field} is missing',
                        code='MISSING_REQUIRED_FIELD'
                    ))
                    return False
                continue
            
            value = data[field]
            
            # Type validation
            expected_type = rules.get('type')
            if expected_type and not isinstance(value, expected_type):
                self.errors.append(ValidationError(
                    field=field,
                    message=f'Field {field} must be of type {expected_type.__name__}',
                    code='INVALID_TYPE'
                ))
                return False
            
            # String length validation
            if isinstance(value, str) and 'min_length' in rules:
                if not self.validate_string_length(value, rules['min_length'], 
                                                 rules.get('max_length', 1000), field):
                    return False
        
        return True
    
    def get_errors(self) -> List[ValidationError]:
        """Get all validation errors"""
        return self.errors.copy()
    
    def has_errors(self) -> bool:
        """Check if there are any validation errors"""
        return len(self.errors) > 0
    
    def clear_errors(self):
        """Clear all validation errors"""
        self.errors.clear()
    
    def validate_ip_address(self, ip: str, field_name: str = 'ip') -> bool:
        """Validate IP address format and security"""
        try:
            import ipaddress
            ip_obj = ipaddress.ip_address(ip)
            
            # Block private IPs for external validation
            if ip_obj.is_private or ip_obj.is_loopback:
                self.errors.append(ValidationError(
                    field=field_name,
                    message='Private or loopback IP addresses are not allowed',
                    code='INVALID_IP_PRIVATE'
                ))
                return False
            
            return True
        except ValueError:
            self.errors.append(ValidationError(
                field=field_name,
                message='Invalid IP address format',
                code='INVALID_IP_FORMAT'
            ))
            return False
    
    def validate_phone_number(self, phone: str, field_name: str = 'phone') -> bool:
        """Validate phone number format"""
        # Remove all non-digit characters
        digits_only = re.sub(r'\D', '', phone)
        
        if len(digits_only) < 10 or len(digits_only) > 15:
            self.errors.append(ValidationError(
                field=field_name,
                message='Phone number must be between 10 and 15 digits',
                code='INVALID_PHONE_LENGTH'
            ))
            return False
        
        return True
    
    def validate_credit_card(self, card_number: str, field_name: str = 'credit_card') -> bool:
        """Validate credit card number using Luhn algorithm"""
        # Remove spaces and dashes
        digits = re.sub(r'\D', '', card_number)
        
        if len(digits) < 13 or len(digits) > 19:
            self.errors.append(ValidationError(
                field=field_name,
                message='Credit card number must be between 13 and 19 digits',
                code='INVALID_CARD_LENGTH'
            ))
            return False
        
        # Luhn algorithm
        total = 0
        is_even = False
        
        for digit in reversed(digits):
            digit = int(digit)
            if is_even:
                digit *= 2
                if digit > 9:
                    digit -= 9
            total += digit
            is_even = not is_even
        
        if total % 10 != 0:
            self.errors.append(ValidationError(
                field=field_name,
                message='Invalid credit card number',
                code='INVALID_CARD_CHECKSUM'
            ))
            return False
        
        return True
    
    def validate_social_security(self, ssn: str, field_name: str = 'ssn') -> bool:
        """Validate Social Security Number format"""
        # Remove dashes and spaces
        digits = re.sub(r'\D', '', ssn)
        
        if len(digits) != 9:
            self.errors.append(ValidationError(
                field=field_name,
                message='SSN must be exactly 9 digits',
                code='INVALID_SSN_LENGTH'
            ))
            return False
        
        # Check for invalid patterns
        invalid_patterns = [
            r'^000', r'^666', r'^9\d{2}',  # Invalid first 3 digits
            r'^(\d)\1{8}$',  # All same digits
            r'^123456789$', r'^987654321$'  # Sequential
        ]
        
        for pattern in invalid_patterns:
            if re.match(pattern, digits):
                self.errors.append(ValidationError(
                    field=field_name,
                    message='Invalid SSN pattern',
                    code='INVALID_SSN_PATTERN'
                ))
                return False
        
        return True
