import * as React from 'react';
import { motion } from 'framer-motion';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: ({ index, style, item }: { index: number; style: React.CSSProperties; item: T }) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

const VirtualizedList = <T,>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
  overscanCount = 5
}: VirtualizedListProps<T>) => {
  // Simple fallback implementation without react-window
  const visibleItems = React.useMemo(() => {
    const containerHeight = height;
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscanCount;
    return items.slice(0, Math.min(visibleCount, items.length));
  }, [items, height, itemHeight, overscanCount]);

  return (
    <div className={`${className} overflow-y-auto`} style={{ height }}>
      {visibleItems.map((item, index) => {
        const style: React.CSSProperties = {
          height: itemHeight,
          position: 'relative',
        };
        return (
          <div key={index} style={style}>
            {renderItem({ index, style, item })}
          </div>
        );
      })}
    </div>
  );
};

export default VirtualizedList;