import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  RocketLaunchIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const SignupRebuilt: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    company: '',
    role: '',
    teamSize: '',
    useCase: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const signupSteps = [
    {
      id: 1,
      title: "Create your account",
      description: "Join thousands of teams building faster with ProtoThrive",
      icon: SparklesIcon
    },
    {
      id: 2,
      title: "Tell us about yourself",
      description: "Help us personalize your experience",
      icon: UsersIcon
    },
    {
      id: 3,
      title: "Welcome to ProtoThrive!",
      description: "Your account is ready. Let's start building!",
      icon: RocketLaunchIcon
    }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (!agreedToTerms) {
        newErrors.terms = 'Please agree to the terms and conditions';
      }
    }

    if (step === 2) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.role) newErrors.role = 'Please select your role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNextStep = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 1) {
      setIsSubmitting(true);
      try {
        // Simulate account creation
        await new Promise(resolve => setTimeout(resolve, 1500));
        setCurrentStep(2);
      } catch (error) {
        setErrors({ submit: 'Failed to create account. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
      // Complete onboarding after a brief delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getCurrentStepData = () => signupSteps.find(step => step.id === currentStep);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#111827',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#ffffff', fontSize: '1.125rem' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #111827 0%, #1e3a8a 50%, #7c3aed 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute',
          top: '-10rem',
          right: '-10rem',
          width: '20rem',
          height: '20rem',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderRadius: '50%',
          filter: 'blur(3rem)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-10rem',
          left: '-10rem',
          width: '20rem',
          height: '20rem',
          backgroundColor: 'rgba(168, 85, 247, 0.2)',
          borderRadius: '50%',
          filter: 'blur(3rem)'
        }}></div>
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '64rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem',
          alignItems: 'center'
        }}>
          {/* Left side - Progress and info */}
          <div style={{
            color: '#ffffff',
            paddingRight: '2rem'
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem'
                }}>
                  {React.createElement(getCurrentStepData()?.icon || SparklesIcon, {
                    style: { width: '1.5rem', height: '1.5rem' }
                  })}
                </div>
                <div>
                  <h1 style={{
                    fontSize: '1.875rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}>
                    {getCurrentStepData()?.title}
                  </h1>
                  <p style={{ color: '#bfdbfe' }}>{getCurrentStepData()?.description}</p>
                </div>
              </div>
            </div>

            {/* Progress steps */}
            <div style={{ marginBottom: '2rem' }}>
              {signupSteps.map((step, index) => (
                <div key={step.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '1rem',
                    backgroundColor: currentStep > step.id ? '#10b981' : currentStep === step.id ? '#3b82f6' : '#4b5563',
                    transition: 'all 0.3s ease'
                  }}>
                    {currentStep > step.id ? (
                      <CheckIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    ) : (
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{step.id}</span>
                    )}
                  </div>
                  <div style={{
                    opacity: currentStep >= step.id ? 1 : 0.5,
                    transition: 'opacity 0.3s ease'
                  }}>
                    <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{step.title}</h3>
                    <p style={{ fontSize: '0.875rem', color: '#d1d5db' }}>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: '#10b981',
                marginBottom: '0.75rem'
              }}>
                <CheckIcon style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} />
                <span>14-day free trial</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: '#10b981',
                marginBottom: '0.75rem'
              }}>
                <CheckIcon style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} />
                <span>No credit card required</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: '#10b981'
              }}>
                <CheckIcon style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {currentStep === 1 && (
              <div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: errors.email ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      ':focus': {
                        borderColor: '#3b82f6',
                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                      }
                    }}
                    placeholder="Enter your email"
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = errors.email ? '#ef4444' : '#d1d5db'}
                  />
                  {errors.email && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.email}</p>}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        paddingRight: '3rem',
                        border: errors.password ? '1px solid #ef4444' : '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      placeholder="Create a password"
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = errors.password ? '#ef4444' : '#d1d5db'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        padding: '0'
                      }}
                    >
                      {showPassword ? (
                        <EyeSlashIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                      ) : (
                        <EyeIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                      )}
                    </button>
                  </div>
                  {errors.password && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.password}</p>}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Confirm password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: errors.confirmPassword ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    placeholder="Confirm your password"
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = errors.confirmPassword ? '#ef4444' : '#d1d5db'}
                  />
                  {errors.confirmPassword && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.confirmPassword}</p>}
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    style={{ marginTop: '0.25rem', marginRight: '0.75rem' }}
                  />
                  <label htmlFor="terms" style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                    I agree to ProtoThrive's{' '}
                    <a href="#" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Privacy Policy</a>
                  </label>
                </div>
                {errors.terms && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{errors.terms}</p>}

                {errors.submit && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    marginBottom: '1.5rem'
                  }}>
                    <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{errors.submit}</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      First name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: errors.firstName ? '1px solid #ef4444' : '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      placeholder="John"
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = errors.firstName ? '#ef4444' : '#d1d5db'}
                    />
                    {errors.firstName && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.firstName}</p>}
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Last name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: errors.lastName ? '1px solid #ef4444' : '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      placeholder="Doe"
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = errors.lastName ? '#ef4444' : '#d1d5db'}
                    />
                    {errors.lastName && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.lastName}</p>}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Company (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    placeholder="Your company name"
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    What's your role?
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: errors.role ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      backgroundColor: '#ffffff'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = errors.role ? '#ef4444' : '#d1d5db'}
                  >
                    <option value="">Select your role</option>
                    <option value="product-manager">Product Manager</option>
                    <option value="designer">Designer</option>
                    <option value="developer">Developer</option>
                    <option value="founder">Founder/CEO</option>
                    <option value="consultant">Consultant</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.role && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.role}</p>}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Team size
                  </label>
                  <select
                    value={formData.teamSize}
                    onChange={(e) => handleInputChange('teamSize', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      backgroundColor: '#ffffff'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  >
                    <option value="">Select team size</option>
                    <option value="1">Just me</option>
                    <option value="2-5">2-5 people</option>
                    <option value="6-20">6-20 people</option>
                    <option value="21-100">21-100 people</option>
                    <option value="100+">100+ people</option>
                  </select>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{
                  width: '5rem',
                  height: '5rem',
                  background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}>
                  <CheckIcon style={{ width: '2.5rem', height: '2.5rem', color: '#ffffff' }} />
                </div>

                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#111827',
                  marginBottom: '1rem'
                }}>
                  Welcome to ProtoThrive! 🎉
                </h2>
                <p style={{
                  color: '#4b5563',
                  marginBottom: '1.5rem'
                }}>
                  Your account has been created successfully. You'll be redirected to your dashboard in a moment.
                </p>

                <div style={{
                  background: 'linear-gradient(135deg, #eff6ff, #f3e8ff)',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                    🚀 Ready to start building? Create your first project and experience the power of AI-assisted prototyping!
                  </p>
                </div>
              </div>
            )}

            {/* Form actions */}
            {currentStep < 3 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '2rem'
              }}>
                {currentStep > 1 ? (
                  <button
                    onClick={handleBackStep}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      fontWeight: '500',
                      cursor: 'pointer',
                      padding: '0.5rem'
                    }}
                  >
                    Back
                  </button>
                ) : (
                  <div></div>
                )}

                <button
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    color: '#ffffff',
                    padding: '0.75rem 2rem',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    opacity: isSubmitting ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isSubmitting && (
                    <div style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '0.5rem'
                    }}></div>
                  )}
                  {currentStep === 1 ? 'Create Account' : 'Continue'}
                  <ArrowRightIcon style={{ width: '1.25rem', height: '1.25rem', marginLeft: '0.5rem' }} />
                </button>
              </div>
            )}

            {/* Sign in link */}
            {currentStep === 1 && (
              <div style={{
                textAlign: 'center',
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <p style={{ color: '#4b5563' }}>
                  Already have an account?{' '}
                  <button
                    onClick={() => router.push('/login')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3b82f6',
                      textDecoration: 'underline',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS keyframes for spinner */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SignupRebuilt;