'use client';

import React, { useState } from 'react';
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
    icon: <Lock className="h-4 w-4" />,
    description: 'User login and registration system',
  },
  {
    id: 'db-crud',
    label: 'Database CRUD',
    category: 'database',
    icon: <Database className="h-4 w-4" />,
    description: 'Create, read, update, delete operations',
  },
  {
    id: 'user-profile',
    label: 'User Profile',
    category: 'user',
    icon: <User className="h-4 w-4" />,
    description: 'User profile management',
  },
  {
    id: 'ecommerce-cart',
    label: 'Shopping Cart',
    category: 'ecommerce',
    icon: <ShoppingCart className="h-4 w-4" />,
    description: 'E-commerce shopping cart functionality',
  },
  {
    id: 'email-service',
    label: 'Email Service',
    category: 'communication',
    icon: <Mail className="h-4 w-4" />,
    description: 'Email sending and templates',
  },
  {
    id: 'analytics-dashboard',
    label: 'Analytics Dashboard',
    category: 'analytics',
    icon: <BarChart className="h-4 w-4" />,
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

  const categories = Array.from(new Set(templates.map((t) => t.category)));

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
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Template Library</h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            onClick={() => setSelectedCategory(null)}
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              className="text-xs capitalize"
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              draggable
              onDragStart={(e) => onDragStart(e, template)}
              className={cn(
                'p-3 rounded-lg cursor-move transition-all',
                'hover:bg-white/10',
                vibeMode ? 'bg-white/5 border border-neon-purple/20' : 'bg-white/5 border border-white/10'
              )}
            >
              <div className="flex items-start space-x-3">
                <div className={cn(
                  'p-2 rounded',
                  vibeMode ? 'bg-neon-purple/20 text-neon-purple' : 'bg-primary/20 text-primary'
                )}>
                  {template.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{template.label}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-cosmic-dark/80">
        <p className="text-xs text-muted-foreground text-center">
          Drag templates to canvas to add features
        </p>
      </div>
    </div>
  );
}