import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  PlayIcon,
  ShareIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  BoltIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

const DashboardRebuilt: React.FC = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState('roadmap');

  const handleLogout = () => {
    // Clear any auth tokens here
    router.push('/');
  };

  const tools = [
    { id: 'roadmap', name: 'Roadmap', icon: ChartBarIcon, color: '#3b82f6' },
    { id: 'ai-assist', name: 'AI Assistant', icon: BoltIcon, color: '#a855f7' },
    { id: 'deploy', name: 'Deploy', icon: RocketLaunchIcon, color: '#10b981' },
    { id: '3d-view', name: '3D View', icon: CubeIcon, color: '#f59e0b' }
  ];

  const projects = [
    { id: 1, name: 'Mobile App Redesign', status: 'In Progress', progress: 75 },
    { id: 2, name: 'Website Landing Page', status: 'Completed', progress: 100 },
    { id: 3, name: 'Dashboard UI Kit', status: 'Planning', progress: 25 }
  ];

  return (
    <div style={{
      backgroundColor: '#0a0a0b',
      color: '#ffffff',
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex'
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '280px' : '80px',
        background: '#1a1a1b',
        borderRight: '1px solid #333',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 40
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '1.5rem 1rem',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              background: 'linear-gradient(135deg, #00d2ff, #00ff88)',
              borderRadius: '0.5rem'
            }}></div>
            {sidebarOpen && (
              <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                ProtoThrive
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            {sidebarOpen ?
              <XMarkIcon style={{ width: '1.5rem', height: '1.5rem' }} /> :
              <Bars3Icon style={{ width: '1.5rem', height: '1.5rem' }} />
            }
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            {sidebarOpen && (
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem'
              }}>
                Tools
              </h3>
            )}

            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: selectedTool === tool.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  border: selectedTool === tool.id ? '1px solid #3b82f6' : '1px solid transparent',
                  borderRadius: '0.75rem',
                  color: selectedTool === tool.id ? '#3b82f6' : '#9ca3af',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  gap: '0.75rem'
                }}
              >
                <tool.icon style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  color: selectedTool === tool.id ? tool.color : '#9ca3af'
                }} />
                {sidebarOpen && (
                  <span style={{ fontWeight: '500' }}>{tool.name}</span>
                )}
              </button>
            ))}
          </div>

          {/* Projects */}
          {sidebarOpen && (
            <div>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem'
              }}>
                Recent Projects
              </h3>

              {projects.slice(0, 3).map((project) => (
                <div
                  key={project.id}
                  style={{
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    background: '#2a2a2b',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    marginBottom: '0.25rem'
                  }}>
                    {project.name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                    marginBottom: '0.5rem'
                  }}>
                    {project.status}
                  </div>
                  <div style={{
                    width: '100%',
                    height: '2px',
                    background: '#3a3a3b',
                    borderRadius: '1px'
                  }}>
                    <div style={{
                      width: `${project.progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #00d2ff, #00ff88)',
                      borderRadius: '1px'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* User Menu */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #333'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                  Developer
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  developer@protothrive.com
                </div>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => router.push('/settings')}
                style={{
                  background: '#2a2a2b',
                  border: 'none',
                  color: '#9ca3af',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                <Cog6ToothIcon style={{ width: '1rem', height: '1rem' }} />
              </button>
              <button
                onClick={handleLogout}
                style={{
                  background: '#dc2626',
                  border: 'none',
                  color: 'white',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                <ArrowRightOnRectangleIcon style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        marginLeft: sidebarOpen ? '280px' : '80px',
        transition: 'margin-left 0.3s ease',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Bar */}
        <header style={{
          background: '#1a1a1b',
          borderBottom: '1px solid #333',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '0.25rem'
            }}>
              {tools.find(t => t.id === selectedTool)?.name || 'Dashboard'}
            </h1>
            <p style={{
              color: '#9ca3af',
              fontSize: '0.875rem'
            }}>
              Create and manage your prototypes
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{
              background: 'transparent',
              border: '1px solid #333',
              color: '#9ca3af',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ShareIcon style={{ width: '1rem', height: '1rem' }} />
              Share
            </button>

            <button style={{
              background: 'transparent',
              border: '1px solid #333',
              color: '#9ca3af',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <DocumentArrowDownIcon style={{ width: '1rem', height: '1rem' }} />
              Export
            </button>

            <button style={{
              background: 'linear-gradient(135deg, #00d2ff, #00ff88)',
              border: 'none',
              color: '#0a0a0b',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <PlusIcon style={{ width: '1rem', height: '1rem' }} />
              New Project
            </button>
          </div>
        </header>

        {/* Canvas Area */}
        <main style={{
          flex: 1,
          background: '#0a0a0b',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {selectedTool === 'roadmap' && (
            <div style={{
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1), transparent 70%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <div style={{
                textAlign: 'center',
                maxWidth: '500px',
                padding: '2rem'
              }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)'
                }}>
                  <ChartBarIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
                </div>

                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  marginBottom: '1rem',
                  background: 'linear-gradient(135deg, #00d2ff, #00ff88)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Interactive Roadmap Canvas
                </h2>

                <p style={{
                  color: '#9ca3af',
                  marginBottom: '2rem',
                  lineHeight: '1.6'
                }}>
                  Create stunning 2D and 3D roadmaps with drag-and-drop simplicity.
                  AI-powered suggestions help you plan your project timeline.
                </p>

                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button style={{
                    background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
                    border: 'none',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                    Start New Roadmap
                  </button>

                  <button style={{
                    background: 'transparent',
                    border: '1px solid #3b82f6',
                    color: '#3b82f6',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <PlayIcon style={{ width: '1rem', height: '1rem' }} />
                    Watch Tutorial
                  </button>
                </div>
              </div>

              {/* Floating Elements */}
              <div style={{
                position: 'absolute',
                top: '20%',
                left: '10%',
                background: '#1a1a1b',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid #333',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  Project Alpha
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  Status: In Progress
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '20%',
                right: '10%',
                background: '#1a1a1b',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid #333',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  AI Suggestions
                </div>
                <div style={{ fontSize: '0.75rem', color: '#00ff88' }}>
                  3 recommendations ready
                </div>
              </div>
            </div>
          )}

          {selectedTool === 'ai-assist' && (
            <div style={{
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.1), transparent 70%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)'
              }}>
                <BoltIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>

              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '1rem',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                AI Assistant
              </h2>

              <p style={{
                color: '#9ca3af',
                marginBottom: '2rem',
                textAlign: 'center',
                maxWidth: '400px'
              }}>
                Get intelligent suggestions for your roadmap structure,
                automated task generation, and smart insights.
              </p>
            </div>
          )}

          {selectedTool === 'deploy' && (
            <div style={{
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1), transparent 70%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
              }}>
                <RocketLaunchIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>

              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '1rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Deploy & Share
              </h2>

              <p style={{
                color: '#9ca3af',
                marginBottom: '2rem',
                textAlign: 'center',
                maxWidth: '400px'
              }}>
                Deploy your prototypes instantly and share interactive demos
                with your team and stakeholders.
              </p>
            </div>
          )}

          {selectedTool === '3d-view' && (
            <div style={{
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.1), transparent 70%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 0 30px rgba(245, 158, 11, 0.3)'
              }}>
                <CubeIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>

              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '1rem',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                3D Visualization
              </h2>

              <p style={{
                color: '#9ca3af',
                marginBottom: '2rem',
                textAlign: 'center',
                maxWidth: '400px'
              }}>
                Experience your roadmaps in stunning 3D with interactive
                elements and immersive project visualization.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 30,
            display: window.innerWidth < 768 ? 'block' : 'none'
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardRebuilt;// Add getStaticProps for static export
export async function getStaticProps() {
  return {
    props: {},
  };
}

