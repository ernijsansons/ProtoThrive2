'use client';

import React, { useCallback }, { useState } from 'react';
import { X, Search, Database, User, ShoppingCart, Mail, Lock, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  description: string;
}

const templates: Template[] = [
  {
    id: 'auth-basic',
    label: 'Authentication',
    category: 'auth',
    icon: <Lock className="h-4 w-4 sm:h-4 w-4 md:h-4 w-4 lg:h-4 w-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />,
    description: 'User login and registration system',
  },
  {
    id: 'db-crud',
    label: 'Database CRUD',
    category: 'database',
    icon: <Database className="h-4 w-4 sm:h-4 w-4 md:h-4 w-4 lg:h-4 w-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />,
    description: 'Create, read, update, delete operations',
  },
  {
    id: 'user-profile',
    label: 'User Profile',
    category: 'user',
    icon: <User className="h-4 w-4 sm:h-4 w-4 md:h-4 w-4 lg:h-4 w-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />,
    description: 'User profile management',
  },
  {
    id: 'ecommerce-cart',
    label: 'Shopping Cart',
    category: 'ecommerce',
    icon: <ShoppingCart className="h-4 w-4 sm:h-4 w-4 md:h-4 w-4 lg:h-4 w-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />,
    description: 'E-commerce shopping cart functionality',
  },
  {
    id: 'email-service',
    label: 'Email Service',
    category: 'communication',
    icon: <Mail className="h-4 w-4 sm:h-4 w-4 md:h-4 w-4 lg:h-4 w-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />,
    description: 'Email sending and templates',
  },
  {
    id: 'analytics-dashboard',
    label: 'Analytics Dashboard',
    category: 'analytics',
    icon: <BarChart className="h-4 w-4 sm:h-4 w-4 md:h-4 w-4 lg:h-4 w-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />,
    description: 'Data visualization and metrics',
  },
];

interface TemplateLibraryProps {
  onClose: () => void;
  vibeMode: boolean;
}

export function TemplateLibrary({ onClose, vibeMode }: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => Array.from(new Set(templates.map((t) => t.category))), []);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const onDragStart = (event: React.DragEvent, template: Template) => {
    event.dataTransfer.setData('application/reactflow', 'custom');
    event.dataTransfer.setData('template', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={cn(
      'absolute top-0 right-0 h-full w-80 z-20',
      vibeMode ? 'glass-dark' : 'glass',
      'border-l border-white/10'
    )}>
      <div className="p-4 border-b border-white/10 sm:p-4 border-b border-white/10 md:p-4 border-b border-white/10 lg:p-4 border-b border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <div className="flex items-center justify-between mb-4 sm:flex items-center justify-between mb-4 md:flex items-center justify-between mb-4 lg:flex items-center justify-between mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <h3 className="text-lg font-semibold sm:text-lg font-semibold md:text-lg font-semibold lg:text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">Template Library</h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-8 w-8 md:h-8 w-8 lg:h-8 w-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="h-4 w-4 sm:h-4 w-4 md:h-4 w-4 lg:h-4 w-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </Button>
        </div>
        
        <div className="relative sm:relative md:relative lg:relative focus:outline-none focus:ring-2 focus:ring-blue-500">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground sm:absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground md:absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground lg:absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-10 bg-white dark:bg-gray-800/5 border-white/10 sm:pl-10 bg-white dark:bg-gray-800/5 border-white/10 md:pl-10 bg-white dark:bg-gray-800/5 border-white/10 lg:pl-10 bg-white dark:bg-gray-800/5 border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="p-4 sm:p-4 md:p-4 lg:p-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <div className="flex flex-wrap gap-2 mb-4 sm:flex flex-wrap gap-2 mb-4 md:flex flex-wrap gap-2 mb-4 lg:flex flex-wrap gap-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <Button
            onClick={() => setSelectedCategory(null)}
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            className="text-xs sm:text-xs md:text-xs lg:text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              className="text-xs capitalize sm:text-xs capitalize md:text-xs capitalize lg:text-xs capitalize focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar sm:space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar md:space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar lg:space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar focus:outline-none focus:ring-2 focus:ring-blue-500">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              draggable
              onDragStart={(e) => onDragStart(e, template)}
              className={cn(
                'p-3 rounded-lg cursor-move transition-all',
                'hover:bg-white dark:bg-gray-800/10',
                vibeMode ? 'bg-white dark:bg-gray-800/5 border border-neon-purple/20' : 'bg-white dark:bg-gray-800/5 border border-white/10'
              )}
            >
              <div className="flex items-start space-x-3 sm:flex items-start space-x-3 md:flex items-start space-x-3 lg:flex items-start space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <div className={cn(
                  'p-2 rounded',
                  vibeMode ? 'bg-neon dark:bg-gray-800-purple/20 text-neon-purple' : 'bg-primary dark:bg-gray-800/20 text-primary'
                )}>
                  {template.icon}
                </div>
                <div className="flex-1 sm:flex-1 md:flex-1 lg:flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <h4 className="font-medium text-sm sm:font-medium text-sm md:font-medium text-sm lg:font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">{template.label}</h4>
                  <p className="text-xs text-muted-foreground mt-1 sm:text-xs text-muted-foreground mt-1 md:text-xs text-muted-foreground mt-1 lg:text-xs text-muted-foreground mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {template.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-cosmic dark:bg-gray-800-dark/80 sm:absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-cosmic dark:bg-gray-800-dark/80 md:absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-cosmic dark:bg-gray-800-dark/80 lg:absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-cosmic dark:bg-gray-800-dark/80 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <p className="text-xs text-muted-foreground text-center sm:text-xs text-muted-foreground text-center md:text-xs text-muted-foreground text-center lg:text-xs text-muted-foreground text-center focus:outline-none focus:ring-2 focus:ring-blue-500">
          Drag templates to canvas to add features
        </p>
      </div>
    </div>
  );
}