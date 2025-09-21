import React from 'react';
import { useRouter } from 'next/router';
import { ArrowRightIcon, PlayIcon, CheckIcon, StarIcon } from '@heroicons/react/24/outline';

const LandingRebuilt: React.FC = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/signup');
  };

  const handleSignIn = () => {
    router.push('/login');
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      color: '#111827',
      minHeight: '100vh',
      width: '100%',
      fontFamily: 'Inter, system-ui, sans-serif',
      lineHeight: '1.6'
    }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e5e7eb',
        zIndex: 50,
        padding: '0 2rem'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '4rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
              borderRadius: '0.5rem'
            }}></div>
            <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>
              ProtoThrive
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <a href="#features" style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}>
              Features
            </a>
            <a href="#pricing" style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}>
              Pricing
            </a>
            <button
              onClick={handleSignIn}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#6b7280',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Sign In
            </button>
            <button
              onClick={handleGetStarted}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'transform 0.2s'
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        paddingTop: '6rem',
        paddingBottom: '3rem',
        background: 'linear-gradient(to bottom right, #f9fafb, #ffffff, #eff6ff)',
        padding: '6rem 2rem 3rem'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '3rem',
          alignItems: 'center'
        }}>
          {/* Left Content */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: '800',
              lineHeight: '1.1',
              marginBottom: '1.5rem',
              color: '#111827'
            }}>
              Transform Ideas Into{' '}
              <span style={{
                background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Reality
              </span>
            </h1>

            <p style={{
              fontSize: '1.25rem',
              color: '#6b7280',
              marginBottom: '2rem',
              maxWidth: '600px',
              margin: '0 auto 2rem'
            }}>
              The AI-powered platform that turns your wildest product ideas into stunning prototypes.
              Visualize, collaborate, and ship faster than ever before.
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <button
                onClick={handleGetStarted}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '0.75rem',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s'
                }}
              >
                Start Building Free
                <ArrowRightIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>

              <button style={{
                background: 'transparent',
                color: '#374151',
                border: '2px solid #d1d5db',
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}>
                <PlayIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                Watch Demo
              </button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              alignItems: 'center',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                Free 14-day trial
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                No credit card required
              </div>
            </div>
          </div>

          {/* Right Content - 3D Placeholder */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '400px',
              height: '400px',
              background: 'linear-gradient(135deg, #ddd6fe, #e0e7ff)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}>
              <div style={{
                fontSize: '4rem',
                fontWeight: '800',
                color: '#6366f1',
                marginBottom: '1rem'
              }}>
                3D
              </div>
              <p style={{ color: '#6b7280', textAlign: 'center', fontSize: '1.125rem' }}>
                Interactive Demo
              </p>
              <p style={{ color: '#9ca3af', textAlign: 'center', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Coming soon
              </p>

              {/* Floating elements */}
              <div style={{
                position: 'absolute',
                top: '-1rem',
                left: '-1rem',
                background: 'white',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                2,847 active projects
              </div>

              <div style={{
                position: 'absolute',
                bottom: '-1rem',
                right: '-1rem',
                background: 'white',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                87% faster shipping
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: '5rem 2rem',
        background: '#f9fafb'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '800',
              marginBottom: '1.5rem',
              color: '#111827'
            }}>
              Everything you need to{' '}
              <span style={{
                background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                build faster
              </span>
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#6b7280',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              From concept to deployment, ProtoThrive provides all the tools you need.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            {[
              { title: 'AI-Powered Design', desc: 'Transform ideas into stunning prototypes with intelligent design assistance.' },
              { title: 'Smart Roadmapping', desc: 'Visualize project timelines in 2D and 3D with automated task generation.' },
              { title: 'Real-time Collaboration', desc: 'Work seamlessly with your team using live cursors and instant sync.' },
              { title: 'Instant Deployment', desc: 'Deploy prototypes to the cloud with one click and share demos instantly.' }
            ].map((feature, index) => (
              <div key={index} style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '1rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s'
              }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  color: 'white',
                  fontSize: '1.25rem',
                  fontWeight: '700'
                }}>
                  {index + 1}
                </div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  color: '#111827'
                }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={{
        padding: '5rem 2rem',
        background: 'white'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '800',
              marginBottom: '1.5rem',
              color: '#111827'
            }}>
              Loved by teams at{' '}
              <span style={{
                background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                leading companies
              </span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {[
              { name: 'Sarah Chen', role: 'Head of Product', company: 'TechFlow Inc', content: 'ProtoThrive transformed our product development cycle. We\'re shipping 3x faster.' },
              { name: 'Marcus Rodriguez', role: 'Engineering Director', company: 'InnovateLabs', content: 'The AI assistance is mind-blowing. It\'s like having a senior designer on every project.' },
              { name: 'Emily Watson', role: 'Startup Founder', company: 'NextGen Ventures', content: 'We went from idea to investor demo in 48 hours. ProtoThrive is our secret weapon.' }
            ].map((testimonial, index) => (
              <div key={index} style={{
                background: '#f9fafb',
                padding: '1.5rem',
                borderRadius: '1rem'
              }}>
                <div style={{ display: 'flex', marginBottom: '1rem' }}>
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} style={{
                      width: '1rem',
                      height: '1rem',
                      color: '#fbbf24',
                      fill: '#fbbf24'
                    }} />
                  ))}
                </div>
                <p style={{ color: '#374151', fontStyle: 'italic', marginBottom: '1rem' }}>
                  "{testimonial.content}"
                </p>
                <div>
                  <h4 style={{ fontWeight: '600', color: '#111827' }}>{testimonial.name}</h4>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{
        padding: '5rem 2rem',
        background: '#f9fafb'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '800',
              marginBottom: '1.5rem',
              color: '#111827'
            }}>
              Simple, transparent pricing
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#6b7280'
            }}>
              Choose the plan that's right for your team
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            maxWidth: '60rem',
            margin: '0 auto'
          }}>
            {[
              { name: 'Starter', price: 'Free', period: 'forever', features: ['3 active projects', 'Basic templates', 'Community support', '2D visualization'] },
              { name: 'Pro', price: '$29', period: 'per month', features: ['Unlimited projects', 'Premium templates', 'Priority support', '3D visualization', 'AI features', 'Team collaboration'], popular: true },
              { name: 'Enterprise', price: 'Custom', period: 'contact us', features: ['Everything in Pro', 'SSO integration', 'Advanced security', 'Dedicated support', 'Custom integrations'] }
            ].map((tier, index) => (
              <div key={index} style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '1rem',
                boxShadow: tier.popular ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: tier.popular ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                position: 'relative'
              }}>
                {tier.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-0.75rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
                    color: 'white',
                    padding: '0.25rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    Most Popular
                  </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    marginBottom: '0.5rem',
                    color: '#111827'
                  }}>
                    {tier.name}
                  </h3>
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{
                      fontSize: '2.5rem',
                      fontWeight: '800',
                      color: '#111827'
                    }}>
                      {tier.price}
                    </span>
                    {tier.period !== 'contact us' && (
                      <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                        /{tier.period}
                      </span>
                    )}
                  </div>
                </div>

                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  marginBottom: '2rem'
                }}>
                  {tier.features.map((feature, idx) => (
                    <li key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <CheckIcon style={{
                        width: '1rem',
                        height: '1rem',
                        color: '#10b981',
                        marginRight: '0.75rem',
                        flexShrink: 0
                      }} />
                      <span style={{ color: '#374151' }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleGetStarted}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: tier.popular ? 'linear-gradient(135deg, #3b82f6, #a855f7)' : '#f3f4f6',
                    color: tier.popular ? 'white' : '#111827'
                  }}
                >
                  {tier.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '5rem 2rem',
        background: 'linear-gradient(135deg, #3b82f6, #a855f7)'
      }}>
        <div style={{
          maxWidth: '60rem',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '800',
            marginBottom: '1.5rem',
            color: 'white'
          }}>
            Ready to transform your ideas?
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '2rem'
          }}>
            Join thousands of teams building the future with ProtoThrive
          </p>

          <div style={{
            display: 'flex',
            maxWidth: '400px',
            margin: '0 auto 2rem',
            gap: '1rem'
          }}>
            <input
              type="email"
              placeholder="Enter your email"
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1rem'
              }}
            />
            <button
              onClick={handleGetStarted}
              style={{
                background: 'white',
                color: '#3b82f6',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Get Started
            </button>
          </div>

          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.875rem'
          }}>
            Start your free 14-day trial. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '3rem 2rem',
        background: '#111827'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
                borderRadius: '0.5rem'
              }}></div>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'white'
              }}>
                ProtoThrive
              </span>
            </div>

            <div style={{
              display: 'flex',
              gap: '1.5rem',
              color: '#9ca3af'
            }}>
              <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Privacy</a>
              <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Terms</a>
              <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Contact</a>
            </div>
          </div>

          <div style={{
            paddingTop: '2rem',
            borderTop: '1px solid #374151',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            <p>&copy; 2025 ProtoThrive. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingRebuilt;