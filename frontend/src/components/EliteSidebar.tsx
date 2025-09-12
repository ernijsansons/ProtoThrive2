'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRightIcon, 
  ChevronDownIcon,
  ChevronLeftIcon,
  FolderIcon,
  FolderOpenIcon,
  DocumentIcon,
  Squares2X2Icon,
  ChartBarIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  CursorArrowRaysIcon,
  TableCellsIcon,
  MagnifyingGlassIcon,
  TagIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Template Categories with Icons
const TEMPLATE_CATEGORIES = {
  'ui-components': { name: 'UI Components', icon: Squares2X2Icon, color: 'neon-blue' },
  'data-visualization': { name: 'Data Visualization', icon: ChartBarIcon, color: 'neon-green' },
  'ecommerce': { name: 'E-commerce', icon: ShoppingCartIcon, color: 'neon-purple' },
  'forms': { name: 'Forms', icon: ClipboardDocumentListIcon, color: 'neon-cyan' },
  'navigation': { name: 'Navigation', icon: CursorArrowRaysIcon, color: 'neon-pink' },
  'tables': { name: 'Tables & Data', icon: TableCellsIcon, color: 'neon-orange' },
};

// Comprehensive Template Data (50+ templates)
const TEMPLATE_DATA = [
  // UI Components (15 templates)
  { id: 'ui-1', name: 'Hero Section', category: 'ui-components', thumbnail: '🎯', description: 'Dynamic hero with CTA buttons' },
  { id: 'ui-2', name: 'Feature Cards', category: 'ui-components', thumbnail: '🃏', description: 'Interactive feature showcase' },
  { id: 'ui-3', name: 'Testimonials', category: 'ui-components', thumbnail: '💬', description: 'Customer review carousel' },
  { id: 'ui-4', name: 'Pricing Tables', category: 'ui-components', thumbnail: '💰', description: 'Subscription tier layouts' },
  { id: 'ui-5', name: 'Team Grid', category: 'ui-components', thumbnail: '👥', description: 'Team member showcase' },
  { id: 'ui-6', name: 'Gallery Grid', category: 'ui-components', thumbnail: '🖼️', description: 'Image gallery layout' },
  { id: 'ui-7', name: 'Blog Cards', category: 'ui-components', thumbnail: '📝', description: 'Article preview cards' },
  { id: 'ui-8', name: 'Stats Counter', category: 'ui-components', thumbnail: '📊', description: 'Animated counters' },
  { id: 'ui-9', name: 'Timeline', category: 'ui-components', thumbnail: '⏰', description: 'Event timeline layout' },
  { id: 'ui-10', name: 'FAQ Accordion', category: 'ui-components', thumbnail: '❓', description: 'Collapsible Q&A' },
  { id: 'ui-11', name: 'Modal Dialog', category: 'ui-components', thumbnail: '🪟', description: 'Popup overlay component' },
  { id: 'ui-12', name: 'Notification Toast', category: 'ui-components', thumbnail: '🔔', description: 'Alert messages' },
  { id: 'ui-13', name: 'Progress Steps', category: 'ui-components', thumbnail: '👣', description: 'Multi-step progress' },
  { id: 'ui-14', name: 'Card Stack', category: 'ui-components', thumbnail: '🗂️', description: 'Layered card design' },
  { id: 'ui-15', name: 'Video Player', category: 'ui-components', thumbnail: '🎥', description: 'Custom video controls' },

  // Data Visualization (12 templates)
  { id: 'data-1', name: 'Dashboard Analytics', category: 'data-visualization', thumbnail: '📈', description: 'KPI dashboard layout' },
  { id: 'data-2', name: 'Line Charts', category: 'data-visualization', thumbnail: '📉', description: 'Time series visualization' },
  { id: 'data-3', name: 'Bar Charts', category: 'data-visualization', thumbnail: '📊', description: 'Comparison bar graphs' },
  { id: 'data-4', name: 'Pie Charts', category: 'data-visualization', thumbnail: '🥧', description: 'Distribution charts' },
  { id: 'data-5', name: 'Heatmaps', category: 'data-visualization', thumbnail: '🌡️', description: 'Data density maps' },
  { id: 'data-6', name: 'Funnel Charts', category: 'data-visualization', thumbnail: '🪣', description: 'Conversion funnels' },
  { id: 'data-7', name: 'Gauge Meters', category: 'data-visualization', thumbnail: '⏲️', description: 'Progress indicators' },
  { id: 'data-8', name: 'Network Graph', category: 'data-visualization', thumbnail: '🕸️', description: 'Node relationships' },
  { id: 'data-9', name: 'Treemap', category: 'data-visualization', thumbnail: '🗺️', description: 'Hierarchical data' },
  { id: 'data-10', name: 'Scatter Plot', category: 'data-visualization', thumbnail: '⚡', description: 'Correlation analysis' },
  { id: 'data-11', name: 'Kanban Board', category: 'data-visualization', thumbnail: '📋', description: 'Task management' },
  { id: 'data-12', name: 'Calendar View', category: 'data-visualization', thumbnail: '📅', description: 'Event scheduling' },

  // E-commerce (10 templates)
  { id: 'ecom-1', name: 'Product Grid', category: 'ecommerce', thumbnail: '🛍️', description: 'Product showcase grid' },
  { id: 'ecom-2', name: 'Shopping Cart', category: 'ecommerce', thumbnail: '🛒', description: 'Cart with checkout' },
  { id: 'ecom-3', name: 'Product Detail', category: 'ecommerce', thumbnail: '🔍', description: 'Product page layout' },
  { id: 'ecom-4', name: 'Checkout Flow', category: 'ecommerce', thumbnail: '💳', description: 'Payment process' },
  { id: 'ecom-5', name: 'Wishlist', category: 'ecommerce', thumbnail: '❤️', description: 'Saved items list' },
  { id: 'ecom-6', name: 'Review System', category: 'ecommerce', thumbnail: '⭐', description: 'Rating and reviews' },
  { id: 'ecom-7', name: 'Search Results', category: 'ecommerce', thumbnail: '🔎', description: 'Product search page' },
  { id: 'ecom-8', name: 'Category Filter', category: 'ecommerce', thumbnail: '🏷️', description: 'Product filtering' },
  { id: 'ecom-9', name: 'Order Tracking', category: 'ecommerce', thumbnail: '📦', description: 'Shipment status' },
  { id: 'ecom-10', name: 'Promotional Banner', category: 'ecommerce', thumbnail: '🎉', description: 'Sales announcements' },

  // Forms (8 templates)
  { id: 'form-1', name: 'Contact Form', category: 'forms', thumbnail: '📧', description: 'Basic contact layout' },
  { id: 'form-2', name: 'Registration', category: 'forms', thumbnail: '📝', description: 'User signup form' },
  { id: 'form-3', name: 'Survey Form', category: 'forms', thumbnail: '📋', description: 'Multi-question survey' },
  { id: 'form-4', name: 'Login Form', category: 'forms', thumbnail: '🔐', description: 'Authentication form' },
  { id: 'form-5', name: 'Multi-step Form', category: 'forms', thumbnail: '🪜', description: 'Wizard-style form' },
  { id: 'form-6', name: 'File Upload', category: 'forms', thumbnail: '📎', description: 'Drag & drop uploader' },
  { id: 'form-7', name: 'Address Form', category: 'forms', thumbnail: '📍', description: 'Location input form' },
  { id: 'form-8', name: 'Feedback Form', category: 'forms', thumbnail: '💭', description: 'User feedback collection' },

  // Navigation (6 templates)
  { id: 'nav-1', name: 'Header Menu', category: 'navigation', thumbnail: '🧭', description: 'Top navigation bar' },
  { id: 'nav-2', name: 'Sidebar Menu', category: 'navigation', thumbnail: '📐', description: 'Side navigation panel' },
  { id: 'nav-3', name: 'Breadcrumbs', category: 'navigation', thumbnail: '🍞', description: 'Page hierarchy trail' },
  { id: 'nav-4', name: 'Tab Navigation', category: 'navigation', thumbnail: '📑', description: 'Tabbed interface' },
  { id: 'nav-5', name: 'Mega Menu', category: 'navigation', thumbnail: '🌐', description: 'Multi-column dropdown' },
  { id: 'nav-6', name: 'Mobile Menu', category: 'navigation', thumbnail: '📱', description: 'Responsive hamburger menu' },

  // Tables & Data (4 templates)
  { id: 'table-1', name: 'Data Table', category: 'tables', thumbnail: '📊', description: 'Sortable data grid' },
  { id: 'table-2', name: 'Admin Table', category: 'tables', thumbnail: '⚙️', description: 'Management interface' },
  { id: 'table-3', name: 'Comparison Table', category: 'tables', thumbnail: '⚖️', description: 'Feature comparison' },
  { id: 'table-4', name: 'Pricing Table', category: 'tables', thumbnail: '💲', description: 'Plan comparison table' },
];

// Roadmap Tree Data
const ROADMAP_DATA = [
  {
    id: 'discovery',
    name: 'Discovery Phase',
    type: 'folder',
    icon: '🔍',
    children: [
      { id: 'research', name: 'User Research', type: 'file', icon: '📊', status: 'completed' },
      { id: 'analysis', name: 'Market Analysis', type: 'file', icon: '📈', status: 'completed' },
      { id: 'personas', name: 'User Personas', type: 'file', icon: '👥', status: 'in-progress' },
    ]
  },
  {
    id: 'design',
    name: 'Design Phase',
    type: 'folder',
    icon: '🎨',
    children: [
      { id: 'wireframes', name: 'Wireframes', type: 'file', icon: '📐', status: 'completed' },
      { id: 'mockups', name: 'High-Fi Mockups', type: 'file', icon: '🖼️', status: 'in-progress' },
      { id: 'prototype', name: 'Interactive Prototype', type: 'file', icon: '🔧', status: 'pending' },
    ]
  },
  {
    id: 'development',
    name: 'Development Phase',
    type: 'folder',
    icon: '⚡',
    children: [
      { id: 'frontend', name: 'Frontend Development', type: 'file', icon: '💻', status: 'in-progress' },
      { id: 'backend', name: 'Backend API', type: 'file', icon: '🔧', status: 'pending' },
      { id: 'database', name: 'Database Setup', type: 'file', icon: '🗄️', status: 'pending' },
    ]
  },
  {
    id: 'testing',
    name: 'Testing Phase',
    type: 'folder',
    icon: '🧪',
    children: [
      { id: 'unit-tests', name: 'Unit Testing', type: 'file', icon: '🔬', status: 'pending' },
      { id: 'integration', name: 'Integration Tests', type: 'file', icon: '🔗', status: 'pending' },
      { id: 'user-testing', name: 'User Acceptance Testing', type: 'file', icon: '✅', status: 'pending' },
    ]
  }
];

interface EliteSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onTemplateSelect?: (template: any) => void;
  onRoadmapItemSelect?: (item: any) => void;
  isMobile?: boolean;
  isOpen?: boolean;
}

const EliteSidebar: React.FC<EliteSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onTemplateSelect,
  onRoadmapItemSelect,
  isMobile = false,
  isOpen = false
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'roadmap'>('templates');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['ui-components']));
  const [expandedRoadmapItems, setExpandedRoadmapItems] = useState<Set<string>>(new Set(['discovery']));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);

  // Filter templates based on search query
  const filteredTemplates = TEMPLATE_DATA.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    TEMPLATE_CATEGORIES[template.category as keyof typeof TEMPLATE_CATEGORIES]?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered templates by category
  const groupedTemplates = Object.keys(TEMPLATE_CATEGORIES).reduce((acc, categoryKey) => {
    const templates = filteredTemplates.filter(t => t.category === categoryKey);
    if (templates.length > 0) {
      acc[categoryKey] = templates;
    }
    return acc;
  }, {} as Record<string, typeof TEMPLATE_DATA>);

  const toggleCategory = useCallback((categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  }, [expandedCategories]);

  const toggleRoadmapItem = useCallback((itemId: string) => {
    const newExpanded = new Set(expandedRoadmapItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedRoadmapItems(newExpanded);
  }, [expandedRoadmapItems]);

  const handleTemplateClick = useCallback((template: any) => {
    setSelectedTemplate(template.id);
    onTemplateSelect?.(template);
  }, [onTemplateSelect]);

  const handleRoadmapClick = useCallback((item: any) => {
    onRoadmapItemSelect?.(item);
  }, [onRoadmapItemSelect]);

  // Mobile touch handlers - removed conflicting swipe down gesture
  // that interfered with list scrolling for better UX

  // Drag functionality
  const handleDragStart = useCallback((e: React.DragEvent, template: any) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(template));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-neon-green-primary';
      case 'in-progress': return 'text-neon-blue-primary';
      case 'pending': return 'text-text-muted';
      default: return 'text-text-primary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🔄';
      case 'pending': return '⏳';
      default: return '📄';
    }
  };

  // Remove duplicate sidebar animations - parent handles positioning

  const contentVariants = {
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.2, delay: 0.1 }
    },
    hidden: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div
      className={`
        h-screen bg-dark-secondary/95 backdrop-blur-xl border-r border-neon-blue-primary/30 
        flex flex-col overflow-hidden relative
        ${isMobile ? 'w-full' : ''}
      `}
    >
      {/* Header - Mobile & Desktop */}
      <div className={`
        flex items-center justify-between border-b border-neon-blue-primary/20
        ${isMobile ? 'p-3 bg-dark-primary/50' : 'p-4'}
      `}>
        <AnimatePresence mode="wait">
          {(isMobile || !isCollapsed) && (
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex items-center space-x-3"
            >
              <div className={`
                rounded-lg bg-gradient-neon-mix flex items-center justify-center
                ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}
              `}>
                <Squares2X2Icon className={`text-white ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              </div>
              <div>
                <h2 className={`
                  font-bold text-elite bg-gradient-neon-mix bg-clip-text text-transparent
                  ${isMobile ? 'text-base' : 'text-lg'}
                `}>
                  Elite Studio
                </h2>
                <p className={`text-text-muted ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  Design System
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          onClick={onToggleCollapse}
          className={`
            p-2 rounded-lg hover:bg-dark-hover/50 transition-colors duration-200 group
            ${isMobile ? 'p-1.5' : ''}
          `}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isMobile ? (
            <XMarkIcon className="w-5 h-5 text-neon-blue-primary group-hover:text-neon-blue-light" />
          ) : isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5 text-neon-blue-primary group-hover:text-neon-blue-light" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5 text-neon-blue-primary group-hover:text-neon-blue-light" />
          )}
        </motion.button>
      </div>

      {/* Content Area - Mobile & Desktop */}
      <AnimatePresence mode="wait">
        {(isMobile || !isCollapsed) && (
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Tab Navigation */}
            <div className="flex border-b border-neon-blue-primary/20">
              {[
                { key: 'templates', label: 'Templates', icon: Squares2X2Icon },
                { key: 'roadmap', label: 'Roadmap', icon: DocumentIcon }
              ].map(({ key, label, icon: Icon }) => (
                <motion.button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 transition-all duration-200 ${
                    activeTab === key
                      ? 'bg-neon-blue-primary/20 text-neon-blue-primary border-b-2 border-neon-blue-primary'
                      : 'text-text-muted hover:text-text-primary hover:bg-dark-hover/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </motion.button>
              ))}
            </div>

            {/* Search Bar */}
            {activeTab === 'templates' && (
              <div className="p-4 border-b border-neon-blue-primary/20">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-dark-tertiary/50 border border-neon-blue-primary/30 rounded-lg text-text-primary placeholder-text-muted focus:border-neon-blue-primary focus:ring-1 focus:ring-neon-blue-primary/20 transition-all duration-200"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activeTab === 'templates' ? (
                <div className="p-4 space-y-4">
                  {Object.entries(groupedTemplates).map(([categoryKey, templates]) => {
                    const category = TEMPLATE_CATEGORIES[categoryKey as keyof typeof TEMPLATE_CATEGORIES];
                    const isExpanded = expandedCategories.has(categoryKey);
                    const IconComponent = category.icon;

                    return (
                      <div key={categoryKey} className="space-y-2">
                        <motion.button
                          onClick={() => toggleCategory(categoryKey)}
                          className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-dark-hover/30 transition-colors duration-200 group"
                          whileHover={{ x: 2 }}
                        >
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRightIcon className="w-4 h-4 text-text-muted group-hover:text-neon-blue-primary" />
                          </motion.div>
                          <IconComponent className={`w-4 h-4 text-${category.color}-primary`} />
                          <span className="text-sm font-medium text-text-primary group-hover:text-neon-blue-light">
                            {category.name}
                          </span>
                          <span className="ml-auto text-xs text-text-muted bg-dark-tertiary/50 px-2 py-1 rounded-full">
                            {templates.length}
                          </span>
                        </motion.button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden space-y-1 ml-6"
                            >
                              {templates.map((template) => (
                                <motion.div
                                  key={template.id}
                                  draggable
                                  onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, template)}
                                  onClick={() => handleTemplateClick(template)}
                                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 group ${
                                    selectedTemplate === template.id
                                      ? 'border-neon-blue-primary bg-neon-blue-primary/10 shadow-glow-blue'
                                      : 'border-neon-blue-primary/20 hover:border-neon-blue-primary/50 hover:bg-dark-hover/20'
                                  }`}
                                  whileHover={{ scale: 1.02, y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="text-2xl flex-shrink-0">{template.thumbnail}</div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium text-text-primary group-hover:text-neon-blue-light truncate">
                                        {template.name}
                                      </h4>
                                      <p className="text-xs text-text-muted mt-1 line-clamp-2">
                                        {template.description}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs text-neon-blue-primary/70 bg-neon-blue-primary/10 px-2 py-1 rounded-full">
                                      Drag to Canvas
                                    </span>
                                    <TagIcon className="w-3 h-3 text-text-muted group-hover:text-neon-blue-primary" />
                                  </div>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {ROADMAP_DATA.map((item) => (
                    <div key={item.id} className="space-y-1">
                      <motion.button
                        onClick={() => toggleRoadmapItem(item.id)}
                        className="w-full flex items-center space-x-2 p-3 rounded-lg hover:bg-dark-hover/30 transition-colors duration-200 group"
                        whileHover={{ x: 2 }}
                      >
                        <motion.div
                          animate={{ rotate: expandedRoadmapItems.has(item.id) ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRightIcon className="w-4 h-4 text-text-muted group-hover:text-neon-green-primary" />
                        </motion.div>
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm font-medium text-text-primary group-hover:text-neon-green-light">
                          {item.name}
                        </span>
                      </motion.button>

                      <AnimatePresence>
                        {expandedRoadmapItems.has(item.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden space-y-1 ml-8"
                          >
                            {item.children?.map((child) => (
                              <motion.button
                                key={child.id}
                                onClick={() => handleRoadmapClick(child)}
                                className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-dark-hover/20 transition-colors duration-200 group"
                                whileHover={{ x: 2 }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <span className="text-sm">{getStatusIcon(child.status)}</span>
                                <span className="text-sm">{child.icon}</span>
                                <span className={`text-sm flex-1 text-left ${getStatusColor(child.status)}`}>
                                  {child.name}
                                </span>
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed State Content */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center py-4 space-y-4">
          <motion.button
            className="p-3 rounded-lg hover:bg-dark-hover/50 transition-colors duration-200 group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Templates"
          >
            <Squares2X2Icon className="w-6 h-6 text-neon-blue-primary group-hover:text-neon-blue-light" />
          </motion.button>
          <motion.button
            className="p-3 rounded-lg hover:bg-dark-hover/50 transition-colors duration-200 group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Roadmap"
          >
            <DocumentIcon className="w-6 h-6 text-neon-green-primary group-hover:text-neon-green-light" />
          </motion.button>
        </div>
      )}

      {/* Neon Glow Effect */}
      <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-transparent via-neon-blue-primary to-transparent opacity-50"></div>
    </div>
  );
};

export default EliteSidebar;