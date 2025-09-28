/**
 * @fileoverview ProtoThrive Agent Chat Interface
 * Multi-agent AI chat system with specialized agents
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  UserIcon,
  CpuChipIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  agentType?: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  specialization: string[];
}

const agents: Agent[] = [
  {
    id: 'strategic-planner',
    name: 'Strategic Planner',
    description: 'Roadmap analysis and task decomposition',
    icon: '🎯',
    color: 'blue',
    specialization: ['planning', 'architecture', 'strategy']
  },
  {
    id: 'tdd-implementer',
    name: 'TDD Implementer',
    description: 'Test-driven development specialist',
    icon: '🧪',
    color: 'green',
    specialization: ['testing', 'tdd', 'quality']
  },
  {
    id: 'security-auditor',
    name: 'Security Auditor',
    description: 'OWASP compliance and vulnerability scanning',
    icon: '🔒',
    color: 'red',
    specialization: ['security', 'audit', 'compliance']
  },
  {
    id: 'performance-optimizer',
    name: 'Performance Optimizer',
    description: 'Code optimization and latency reduction',
    icon: '⚡',
    color: 'yellow',
    specialization: ['performance', 'optimization', 'scaling']
  },
  {
    id: 'grug-reviewer',
    name: 'Grug Code Reviewer',
    description: 'Simplicity-focused code review',
    icon: '🗿',
    color: 'gray',
    specialization: ['review', 'simplicity', 'maintainability']
  },
  {
    id: 'edge-innovator',
    name: 'Edge Innovator',
    description: 'Cutting-edge technology integration',
    icon: '🚀',
    color: 'purple',
    specialization: ['innovation', 'emerging-tech', 'research']
  }
];

interface AgentChatInterfaceProps {
  projectId?: string;
  onAgentAction?: (action: string, data: any) => void;
  className?: string;
}

const AgentChatInterface: React.FC<AgentChatInterfaceProps> = ({
  projectId,
  onAgentAction,
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI agent coordinator. I can connect you with any of our 14 specialized agents. What would you like help with today?',
      sender: 'agent',
      agentType: 'coordinator',
      timestamp: new Date(),
      status: 'sent'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('coordinator');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Simulate agent processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const agentResponse = await generateAgentResponse(inputValue, selectedAgent);

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: agentResponse.content,
        sender: 'agent',
        agentType: agentResponse.agentType,
        timestamp: new Date(),
        status: 'sent'
      };

      setMessages(prev => [...prev, agentMessage]);

      if (agentResponse.action && onAgentAction) {
        onAgentAction(agentResponse.action, agentResponse.actionData);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        sender: 'agent',
        agentType: 'coordinator',
        timestamp: new Date(),
        status: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAgentResponse = async (input: string, agentId: string) => {
    // Simulate different agent responses based on input and selected agent
    const responses = {
      'strategic-planner': {
        content: `I've analyzed your request. Here's a strategic breakdown: ${input}. I recommend breaking this into 3 phases with clear milestones and dependencies.`,
        agentType: 'strategic-planner',
        action: 'create-roadmap-nodes',
        actionData: { type: 'strategic-plan', input }
      },
      'tdd-implementer': {
        content: `From a TDD perspective, let's start with tests. I'll help you write comprehensive test cases for: ${input}. We should aim for 95%+ coverage.`,
        agentType: 'tdd-implementer',
        action: 'generate-tests',
        actionData: { type: 'test-suite', input }
      },
      'security-auditor': {
        content: `Security assessment for: ${input}. I've identified potential vulnerabilities and OWASP compliance requirements. Let me provide a security checklist.`,
        agentType: 'security-auditor',
        action: 'security-scan',
        actionData: { type: 'security-audit', input }
      },
      'performance-optimizer': {
        content: `Performance analysis for: ${input}. I can optimize this for sub-10ms response times. Here are my recommendations for scaling and optimization.`,
        agentType: 'performance-optimizer',
        action: 'optimize-performance',
        actionData: { type: 'performance-tune', input }
      },
      'grug-reviewer': {
        content: `Grug think: ${input} too complex! Grug make simple. Remove fancy stuff. Use rock-solid patterns. Grug show better way.`,
        agentType: 'grug-reviewer',
        action: 'simplify-code',
        actionData: { type: 'simplification', input }
      },
      'edge-innovator': {
        content: `Fascinating! ${input} could benefit from cutting-edge approaches. Consider WebAssembly, edge computing, or AI integration. Let me prototype some innovative solutions.`,
        agentType: 'edge-innovator',
        action: 'innovate-solution',
        actionData: { type: 'innovation', input }
      },
      'coordinator': {
        content: `I understand you need help with: ${input}. Based on this, I recommend working with our Security Auditor and Performance Optimizer. Would you like me to connect you?`,
        agentType: 'coordinator',
        action: 'route-to-agent',
        actionData: { recommendedAgents: ['security-auditor', 'performance-optimizer'], input }
      }
    };

    return responses[agentId as keyof typeof responses] || responses.coordinator;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAgentInfo = (agentType: string) => {
    return agents.find(agent => agent.id === agentType) || {
      id: 'coordinator',
      name: 'AI Coordinator',
      icon: '🤖',
      color: 'blue'
    };
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <ClockIcon className="h-3 w-3 text-gray-400 animate-spin" />;
      case 'sent':
        return <CheckCircleIcon className="h-3 w-3 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center">
          <CpuChipIcon className="h-6 w-6 text-blue-600 mr-2" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Agent Chat</h3>
            <p className="text-sm text-gray-500">14 specialized agents at your service</p>
          </div>
        </div>
        <SparklesIcon className="h-5 w-5 text-purple-600" />
      </div>

      {/* Agent Selector */}
      <div className="p-3 border-b border-gray-100 bg-gray-50">
        <div className="flex flex-wrap gap-2">
          {agents.slice(0, 6).map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedAgent === agent.id
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="mr-1">{agent.icon}</span>
              {agent.name}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-xs lg:max-w-md ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 ${message.sender === 'user' ? 'ml-3' : 'mr-3'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {message.sender === 'user' ? (
                    <UserIcon className="h-4 w-4" />
                  ) : (
                    <span className="text-sm">{getAgentInfo(message.agentType || 'coordinator').icon}</span>
                  )}
                </div>
              </div>
              <div className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {message.sender === 'agent' && (
                  <span className="text-xs text-gray-500 mb-1">
                    {getAgentInfo(message.agentType || 'coordinator').name}
                  </span>
                )}
                <div className={`px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <div className="flex items-center mt-1 space-x-1">
                  <span className="text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {getStatusIcon(message.status)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex mr-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-sm">{getAgentInfo(selectedAgent).icon}</span>
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask ${getAgentInfo(selectedAgent).name} for help...`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Currently chatting with <strong>{getAgentInfo(selectedAgent).name}</strong>
        </p>
      </div>
    </div>
  );
};

export default AgentChatInterface;