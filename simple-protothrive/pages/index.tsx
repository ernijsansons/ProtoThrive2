import { useState } from 'react';
import Head from 'next/head';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  status: 'inactive' | 'active' | 'completed';
}

interface Message {
  id: string;
  type: 'user' | 'grok';
  content: string;
  timestamp: Date;
}

export default function ProtoThrive() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', label: 'Start', x: 100, y: 200, status: 'completed' },
    { id: '2', label: 'Design', x: 300, y: 150, status: 'active' },
    { id: '3', label: 'Develop', x: 500, y: 200, status: 'inactive' },
    { id: '4', label: 'Deploy', x: 700, y: 250, status: 'inactive' },
  ]);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'grok',
      content: 'Welcome to ProtoThrive! I can help you create workflows, generate code, and deploy projects. What would you like to build today?',
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [thriveScore, setThriveScore] = useState(75);
  const [activeView, setActiveView] = useState<'canvas' | 'chat' | 'insights'>('canvas');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      let response = '';
      const input = currentInput.toLowerCase();
      
      if (input.includes('create') || input.includes('build')) {
        response = `🚀 Great! I'll help you create that. Let me add some nodes to your canvas and generate the workflow structure. I can create:

• Frontend components with React/Next.js
• Backend APIs with proper routing
• Database schemas and migrations
• Deployment configurations
• Testing frameworks

What type of application are you thinking of building?`;
        
        // Update canvas with new nodes
        setNodes(prev => prev.map(node => 
          node.id === '2' ? { ...node, status: 'completed' } :
          node.id === '3' ? { ...node, status: 'active' } : node
        ));
        setThriveScore(85);
      } else if (input.includes('e-commerce') || input.includes('shop')) {
        response = `🛍️ Perfect! An e-commerce platform is a great choice. I'll set up:

**Frontend:**
- Product catalog with search/filter
- Shopping cart functionality  
- Checkout process with payment integration
- User authentication & profiles

**Backend:**
- Product management APIs
- Order processing system
- Payment gateway integration
- Inventory management

**Database:**
- Products, orders, users tables
- Shopping cart sessions
- Payment records

Should I start generating the components?`;
        
        setNodes(prev => [
          ...prev,
          { id: '5', label: 'Products', x: 200, y: 300, status: 'active' },
          { id: '6', label: 'Cart', x: 400, y: 350, status: 'inactive' },
          { id: '7', label: 'Payment', x: 600, y: 300, status: 'inactive' },
        ]);
      } else {
        response = `I understand you're asking about "${currentInput}". Here are some ways I can help:

🎨 **Visual Development:** Create drag-drop workflows and 3D roadmaps
🤖 **AI Code Generation:** Generate React components, APIs, and databases  
🔍 **Code Validation:** Analyze code quality and suggest improvements
🚀 **One-Click Deploy:** Deploy to Vercel, Netlify, or cloud platforms
📊 **Project Analytics:** Track progress with Thrive Score metrics

What specific area interests you most?`;
      }

      const grokMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'grok',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, grokMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleNodeClick = (nodeId: string) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, status: node.status === 'inactive' ? 'active' : node.status }
        : node
    ));
    setThriveScore(prev => Math.min(prev + 5, 100));
  };

  return (
    <>
      <Head>
        <title>ProtoThrive - AI-First Visual Development</title>
        <meta name="description" content="Turn ideas into working apps with AI-powered visual workflows" />
      </Head>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <header style={{ 
          padding: '1rem 2rem', 
          borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: 'linear-gradient(45deg, #00ffff, #0080ff)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                PT
              </div>
              <h1 style={{ 
                margin: 0, 
                fontSize: '1.5rem',
                background: 'linear-gradient(45deg, #00ffff, #0080ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                ProtoThrive
              </h1>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                padding: '0.5rem 1rem',
                background: thriveScore >= 80 ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 255, 0, 0.2)',
                border: `1px solid ${thriveScore >= 80 ? '#00ff00' : '#ffff00'}`,
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                Thrive: {thriveScore}%
              </div>
              
              <nav style={{ display: 'flex', gap: '1rem' }}>
                {['canvas', 'chat', 'insights'].map(view => (
                  <button
                    key={view}
                    onClick={() => setActiveView(view as any)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: activeView === view ? 'rgba(0, 255, 255, 0.2)' : 'transparent',
                      border: activeView === view ? '1px solid #00ffff' : '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '5px',
                      color: 'white',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {view}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ padding: '2rem' }}>
          {activeView === 'canvas' && (
            <div>
              <h2 style={{ marginBottom: '2rem', color: '#00ffff' }}>Magic Canvas</h2>
              <div style={{ 
                position: 'relative',
                width: '100%',
                height: '500px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <svg width="100%" height="100%">
                  {/* Connections */}
                  {nodes.slice(0, -1).map((node, index) => {
                    const nextNode = nodes[index + 1];
                    if (!nextNode) return null;
                    return (
                      <line
                        key={`line-${node.id}`}
                        x1={node.x + 50}
                        y1={node.y + 25}
                        x2={nextNode.x + 50}
                        y2={nextNode.y + 25}
                        stroke={node.status === 'completed' ? '#00ff00' : '#666'}
                        strokeWidth="2"
                        strokeDasharray={node.status === 'completed' ? 'none' : '5,5'}
                      />
                    );
                  })}
                  
                  {/* Nodes */}
                  {nodes.map(node => (
                    <g key={node.id}>
                      <rect
                        x={node.x}
                        y={node.y}
                        width="100"
                        height="50"
                        rx="25"
                        fill={
                          node.status === 'completed' ? 'rgba(0, 255, 0, 0.3)' :
                          node.status === 'active' ? 'rgba(0, 255, 255, 0.3)' :
                          'rgba(100, 100, 100, 0.3)'
                        }
                        stroke={
                          node.status === 'completed' ? '#00ff00' :
                          node.status === 'active' ? '#00ffff' :
                          '#666666'
                        }
                        strokeWidth="2"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleNodeClick(node.id)}
                      />
                      <text
                        x={node.x + 50}
                        y={node.y + 30}
                        textAnchor="middle"
                        fill="white"
                        fontSize="12"
                        style={{ pointerEvents: 'none' }}
                      >
                        {node.label}
                      </text>
                    </g>
                  ))}
                </svg>
                
                <div style={{ 
                  position: 'absolute',
                  bottom: '1rem',
                  left: '1rem',
                  background: 'rgba(0, 0, 0, 0.7)',
                  padding: '0.5rem 1rem',
                  borderRadius: '5px',
                  fontSize: '0.9rem'
                }}>
                  💡 Click nodes to activate workflows
                </div>
              </div>
            </div>
          )}

          {activeView === 'chat' && (
            <div>
              <h2 style={{ marginBottom: '2rem', color: '#00ffff' }}>Grok AI Assistant</h2>
              <div style={{
                height: '500px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Messages */}
                <div style={{ 
                  flex: 1,
                  padding: '1rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  {messages.map(message => (
                    <div
                      key={message.id}
                      style={{
                        alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        padding: '1rem',
                        borderRadius: '10px',
                        background: message.type === 'user' 
                          ? 'linear-gradient(45deg, #0080ff, #00ffff)'
                          : 'rgba(100, 100, 100, 0.3)',
                        border: message.type === 'grok' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'
                      }}
                    >
                      <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        opacity: 0.7, 
                        marginTop: '0.5rem' 
                      }}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
                      <div style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        background: 'rgba(100, 100, 100, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ 
                            width: '8px', 
                            height: '8px', 
                            background: '#00ffff',
                            borderRadius: '50%',
                            animation: 'pulse 1s infinite'
                          }}></div>
                          Grok is thinking...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Input */}
                <div style={{ 
                  padding: '1rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  gap: '1rem'
                }}>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask Grok anything about your project..."
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '5px',
                      color: 'white',
                      fontSize: '1rem'
                    }}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: !inputValue.trim() || isLoading 
                        ? 'rgba(100, 100, 100, 0.3)' 
                        : 'linear-gradient(45deg, #00ffff, #0080ff)',
                      border: 'none',
                      borderRadius: '5px',
                      color: 'white',
                      cursor: !inputValue.trim() || isLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeView === 'insights' && (
            <div>
              <h2 style={{ marginBottom: '2rem', color: '#00ffff' }}>Project Insights</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(0, 255, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#00ffff' }}>Thrive Score</h3>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    margin: '0 auto 1rem auto',
                    borderRadius: '50%',
                    background: `conic-gradient(${thriveScore >= 80 ? '#00ff00' : '#ffff00'} ${thriveScore * 3.6}deg, rgba(100, 100, 100, 0.3) 0deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 'bold'
                  }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {thriveScore}%
                    </div>
                  </div>
                  <div style={{ color: '#ccc' }}>
                    {thriveScore >= 90 ? 'Excellent' : 
                     thriveScore >= 80 ? 'Good' : 
                     thriveScore >= 60 ? 'Fair' : 'Needs Work'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer style={{ 
          padding: '1rem 2rem',
          borderTop: '1px solid rgba(0, 255, 255, 0.2)',
          background: 'rgba(0, 0, 0, 0.3)',
          textAlign: 'center',
          color: '#ccc',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              Status: <span style={{ color: '#00ff00' }}>● Ready</span> | 
              Mode: Visual Development | 
              Deploy: <span style={{ color: '#00ffff' }}>Ready</span>
            </div>
            <div>
              ProtoThrive v1.0 - AI-First Visual Development Platform
            </div>
          </div>
        </footer>

        <style jsx global>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          
          * {
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: system-ui, -apple-system, sans-serif;
          }
          
          input:focus, button:focus {
            outline: 2px solid #00ffff;
            outline-offset: 2px;
          }
          
          input::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }
        `}</style>
      </div>
    </>
  );
}