'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';

interface CustomNodeData {
  label: string;
  status: 'gray' | 'neon';
  templateMatch?: string;
  uiPreview?: string;
  details?: Record<string, unknown>;
}

export const CustomNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  const isComplete = data.status === 'neon';

  return (
    <div
      className={cn(
        'px-4 py-2 shadow-lg rounded-lg border transition-all duration-300',
        isComplete
          ? 'bg-neon dark:bg-gray-800-blue/20 border-neon-blue text-neon-blue neon-glow-sm'
          : 'bg-cosmic dark:bg-gray-800-medium border-white/20 text-white',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-cosmic-dark'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={cn(
          'w-3 h-3 border-2',
          isComplete ? 'bg-neon dark:bg-gray-800-blue border-neon-blue' : 'bg-cosmic dark:bg-gray-800-light border-white/20'
        )}
      />
      
      <div className="flex items-center space-x-2 sm:flex items-center space-x-2 md:flex items-center space-x-2 lg:flex items-center space-x-2">
        {isComplete ? (
          <CheckCircle2 className="h-4 w-4 sm:h-4 w-4 md:h-4 w-4 lg:h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4 sm:h-4 w-4 md:h-4 w-4 lg:h-4 w-4" />
        )}
        <div className="text-sm font-medium sm:text-sm font-medium md:text-sm font-medium lg:text-sm font-medium">{data.label}</div>
        {data.templateMatch && (
          <Sparkles className="h-3 w-3 text-neon-purple sm:h-3 w-3 text-neon-purple md:h-3 w-3 text-neon-purple lg:h-3 w-3 text-neon-purple" />
        )}
      </div>

      {data.uiPreview && (
        <div className="mt-2 p-2 bg-black dark:bg-gray-800/20 rounded sm:mt-2 p-2 bg-black dark:bg-gray-800/20 rounded md:mt-2 p-2 bg-black dark:bg-gray-800/20 rounded lg:mt-2 p-2 bg-black dark:bg-gray-800/20 rounded">
          <img
            src={data.uiPreview}
            alt="UI Preview"
            className="w-full h-20 object-cover rounded sm:w-full h-20 object-cover rounded md:w-full h-20 object-cover rounded lg:w-full h-20 object-cover rounded"
          />
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(
          'w-3 h-3 border-2',
          isComplete ? 'bg-neon dark:bg-gray-800-blue border-neon-blue' : 'bg-cosmic dark:bg-gray-800-light border-white/20'
        )}
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';