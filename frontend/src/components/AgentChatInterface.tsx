import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface TypingIndicatorProps {
  isVisible: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center space-x-2 px-4 py-3 bg-dark-tertiary/60 rounded-lg border border-neon-blue-primary/20 backdrop-blur-lg"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-blue flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-neon-blue-primary"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
          <span className="text-xs text-neon-blue-light">AI is thinking...</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ChatBubbleProps {
  message: {
    id: string;
    sender: 'user' | 'agent';
    message: string;
    timestamp: Date;
  };
  index: number;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, index }) => {
  const isUser = message.sender === 'user';
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 50 : -50, scale: 0.8 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        x: 0, 
        scale: isVisible ? 1 : 0.8 
      }}
      transition={{ 
        duration: 0.5, 
        type: 'spring',
        stiffness: 100,
        damping: 15
      }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div className="flex items-end space-x-2">
          {/* Avatar */}
          {!isUser && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 rounded-full bg-gradient-blue flex items-center justify-center flex-shrink-0 mb-1"
            >
              <SparklesIcon className="w-5 h-5 text-white" />
            </motion.div>
          )}

          {/* Message Content */}
          <div
            className={`rounded-2xl px-4 py-3 backdrop-blur-lg border relative ${
              isUser
                ? 'bg-gradient-blue border-neon-blue-primary/30 text-white'
                : 'bg-dark-tertiary/80 border-neon-green-primary/30 text-text-primary'
            }`}
          >
            {/* Message text */}
            <p className="text-sm leading-relaxed">{message.message}</p>
            
            {/* Timestamp */}
            <div className={`text-xs mt-2 ${isUser ? 'text-blue-200' : 'text-text-muted'}`}>
              {formatTime(message.timestamp)}
            </div>

            {/* Glow effect for agent messages */}
            {!isUser && (
              <div className="absolute -inset-1 bg-gradient-green rounded-2xl blur opacity-20 -z-10" />
            )}
          </div>

          {/* User Avatar */}
          {isUser && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 rounded-full bg-gradient-green flex items-center justify-center flex-shrink-0 mb-1"
            >
              <span className="text-sm font-bold text-white">U</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const AgentChatInterface: React.FC = () => {
  const { 
    insightsPanel: { chatHistory, isTyping },
    addChatMessage,
    setAgentTyping
  } = useStore();
  
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  // Simulate agent responses
  const simulateAgentResponse = async (userMessage: string) => {
    setAgentTyping(true);
    
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    const responses = [
      "I understand what you're looking for. Let me help you create that feature with the best practices in mind.",
      "Great idea! I can assist you with implementing that. Would you like me to start with the component structure?",
      "That's an interesting challenge. I'll guide you through the implementation step by step.",
      "Perfect! I can help optimize that for better performance and user experience.",
      "Excellent question! Let me provide you with a comprehensive solution for this."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    setAgentTyping(false);
    addChatMessage({
      sender: 'agent',
      message: randomResponse
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const messageText = inputMessage.trim();
    setInputMessage('');

    // Add user message
    addChatMessage({
      sender: 'user',
      message: messageText
    });

    // Simulate agent response
    await simulateAgentResponse(messageText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-3 p-4 border-b border-neon-blue-primary/20 backdrop-blur-lg"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-blue flex items-center justify-center">
          <SparklesIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-neon-blue-primary">AI Assistant</h3>
          <p className="text-xs text-text-muted">Always here to help</p>
        </div>
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="ml-auto w-2 h-2 rounded-full bg-neon-green-primary"
        />
      </motion.div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        <AnimatePresence>
          {chatHistory.map((message, index) => (
            <ChatBubble
              key={message.id}
              message={message}
              index={index}
            />
          ))}
        </AnimatePresence>
        
        {/* Typing Indicator */}
        <TypingIndicator isVisible={isTyping} />
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.form
        onSubmit={handleSendMessage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-t border-neon-blue-primary/20 backdrop-blur-lg"
      >
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask AI anything..."
            className="input-elite w-full pr-12 py-3 text-sm bg-dark-secondary/60 backdrop-blur-lg border-2 border-neon-blue-primary/30 rounded-full text-text-primary placeholder-text-muted focus:border-neon-blue-primary focus:ring-2 focus:ring-neon-blue-primary/20 transition-all duration-300"
          />
          
          <motion.button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              inputMessage.trim() && !isTyping
                ? 'bg-gradient-blue hover:shadow-glow-blue text-white'
                : 'bg-dark-hover text-text-muted cursor-not-allowed'
            }`}
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Quick Action Suggestions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 flex flex-wrap gap-2"
        >
          {[
            '🚀 Create component',
            '🎨 Improve design',
            '⚡ Optimize performance',
            '🔧 Debug issue'
          ].map((suggestion) => (
            <motion.button
              key={suggestion}
              onClick={() => setInputMessage(suggestion.slice(2).trim())}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1 text-xs rounded-full bg-dark-tertiary/60 border border-neon-blue-primary/20 text-text-secondary hover:border-neon-blue-primary/40 hover:text-neon-blue-light transition-all duration-300"
            >
              {suggestion}
            </motion.button>
          ))}
        </motion.div>
      </motion.form>
    </div>
  );
};

export default AgentChatInterface;