import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ultimatePerformance, useUltimatePerformance } from '../utils/ultimate-performance';

// Advanced Data Table with Virtual Scrolling
export const AdvancedDataTable: React.FC<{ data: any[] }> = ({ data }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);
  const { measureRender } = useUltimatePerformance();
  
  const visibleRange = useMemo(() => 
    ultimatePerformance.virtualScroll.calculateVisibleRange(
      scrollTop, containerHeight, 50, data.length
    ), [scrollTop, containerHeight, data.length]
  );
  
  const visibleData = useMemo(() => 
    data.slice(visibleRange.startIndex, visibleRange.endIndex), 
    [data, visibleRange]
  );
  
  const handleScroll = useCallback(
    ultimatePerformance.throttle((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, 16),
    []
  );
  
  useEffect(() => {
    const cleanup = measureRender('AdvancedDataTable');
    return cleanup;
  });
  
  return (
    <div 
      className="overflow-auto border rounded-lg"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: data.length * 50 }}>
        <div style={{ transform: `translateY(${visibleRange.startIndex * 50}px)` }}>
          {visibleData.map((item, index) => (
            <div key={visibleRange.startIndex + index} className="p-4 border-b">
              {JSON.stringify(item)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Advanced Search with Debouncing
export const AdvancedSearch: React.FC<{ onSearch: (query: string) => void }> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const debouncedSearch = useCallback(
    ultimatePerformance.debounce((searchQuery: string) => {
      onSearch(searchQuery);
      // Mock suggestions
      setSuggestions(['suggestion1', 'suggestion2', 'suggestion3']);
    }, 300),
    [onSearch]
  );
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };
  
  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Search..."
      />
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-1">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="p-2 hover:bg-gray-100 cursor-pointer">
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Advanced Loading States
export const AdvancedLoading: React.FC<{ isLoading: boolean; children: React.ReactNode }> = ({
  isLoading,
  children
}) => {
  const [showSpinner, setShowSpinner] = useState(false);
  
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowSpinner(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShowSpinner(false);
    }
  }, [isLoading]);
  
  if (isLoading && showSpinner) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-4 border-blue-400 opacity-20"></div>
        </div>
        <div className="ml-4">
          <div className="text-lg font-semibold text-gray-700">Loading...</div>
          <div className="text-sm text-gray-500">Please wait while we process your request</div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};
