// Ultimate AI Utilities
export const ultimateAI = {
  // Advanced natural language processing
  nlp: {
    sentiment: (text: string): 'positive' | 'negative' | 'neutral' => {
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful'];
      const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disgusting'];
      
      const words = text.toLowerCase().split('\s+');
      const positiveCount = words.filter(word => positiveWords.includes(word)).length;
      const negativeCount = words.filter(word => negativeWords.includes(word)).length;
      
      if (positiveCount > negativeCount) return 'positive';
      if (negativeCount > positiveCount) return 'negative';
      return 'neutral';
    },
    
    extractKeywords: (text: string): string[] => {
      const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
      const words = text.toLowerCase().split(/\s+/);
      
      return words
        .filter(word => word.length > 3 && !stopWords.includes(word))
        .slice(0, 10);
    },
    
    summarize: (text: string, maxLength: number = 150): string => {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const summary = sentences.slice(0, 2).join('. ');
      
      return summary.length > maxLength 
        ? summary.substring(0, maxLength) + '...'
        : summary;
    }
  },
  
  // Advanced recommendation engine
  recommendations: {
    collaborative: (userPreferences: any[], allUsers: any[]): any[] => {
      // Mock collaborative filtering
      return allUsers
        .filter(user => user.id !== userPreferences[0]?.userId)
        .slice(0, 5);
    },
    
    contentBased: (userHistory: any[], availableItems: any[]): any[] => {
      // Mock content-based filtering
      const userKeywords = userHistory.flatMap(item => 
        ultimateAI.nlp.extractKeywords(item.title || item.description || '')
      );
      
      return availableItems
        .filter(item => {
          const itemKeywords = ultimateAI.nlp.extractKeywords(item.title || item.description || '');
          return itemKeywords.some(keyword => userKeywords.includes(keyword));
        })
        .slice(0, 5);
    }
  },
  
  // Advanced predictive analytics
  predictive: {
    timeSeries: (data: number[], periods: number = 7): number[] => {
      // Simple moving average prediction
      const avg = data.slice(-5).reduce((sum, val) => sum + val, 0) / 5;
      return Array(periods).fill(avg);
    },
    
    classification: (features: any, model: any): string => {
      // Mock classification
      const score = Math.random();
      return score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';
    }
  },
  
  // Advanced chatbot utilities
  chatbot: {
    responses: {
      greeting: ['Hello!', 'Hi there!', 'Welcome!'],
      farewell: ['Goodbye!', 'See you later!', 'Take care!'],
      unknown: ['I'm not sure about that.', 'Could you rephrase that?', 'I don't understand.']
    },
    
    getResponse: (input: string): string => {
      const lowerInput = input.toLowerCase();
      
      if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
        return ultimateAI.chatbot.responses.greeting[
          Math.floor(Math.random() * ultimateAI.chatbot.responses.greeting.length)
        ];
      }
      
      if (lowerInput.includes('bye') || lowerInput.includes('goodbye')) {
        return ultimateAI.chatbot.responses.farewell[
          Math.floor(Math.random() * ultimateAI.chatbot.responses.farewell.length)
        ];
      }
      
      return ultimateAI.chatbot.responses.unknown[
        Math.floor(Math.random() * ultimateAI.chatbot.responses.unknown.length)
      ];
    }
  }
};

// Advanced AI hooks
export const useUltimateAI = () => {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiModel, setAiModel] = useState('advanced');
  
  const analyzeSentiment = useCallback((text: string) => {
    return ultimateAI.nlp.sentiment(text);
  }, []);
  
  const getRecommendations = useCallback((userData: any, availableData: any[]) => {
    return ultimateAI.recommendations.contentBased(userData, availableData);
  }, []);
  
  const predictTrends = useCallback((data: number[]) => {
    return ultimateAI.predictive.timeSeries(data);
  }, []);
  
  const chatResponse = useCallback((input: string) => {
    return ultimateAI.chatbot.getResponse(input);
  }, []);
  
  return {
    aiEnabled,
    setAiEnabled,
    aiModel,
    setAiModel,
    analyzeSentiment,
    getRecommendations,
    predictTrends,
    chatResponse
  };
};
