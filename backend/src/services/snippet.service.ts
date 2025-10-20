/**
 * Snippet Service
 * Business logic for code snippet operations
 *
 * Features:
 * - Snippet CRUD operations
 * - Search and filtering
 * - Usage tracking
 * - Validation and authorization
 * - Statistics and analytics
 */

import { SnippetRepository, Snippet } from '../repositories/snippet.repository';
import { UserRepository } from '../repositories/user.repository';

interface CreateSnippetInput {
  userId: string;
  tenantId?: string;
  title: string;
  description?: string;
  language: string;
  code: string;
  category?: string;
  tags?: string[];
  visibility?: 'private' | 'shared' | 'public';
}

interface UpdateSnippetInput {
  title?: string;
  description?: string;
  language?: string;
  code?: string;
  category?: string;
  tags?: string[];
  visibility?: 'private' | 'shared' | 'public';
}

interface SnippetSearchOptions {
  query?: string;
  language?: string;
  category?: string;
  tags?: string[];
  userId?: string;
  limit?: number;
  offset?: number;
}

export class SnippetService {
  private snippetRepository: SnippetRepository;
  private userRepository: UserRepository;

  // Supported programming languages
  private static readonly SUPPORTED_LANGUAGES = [
    'javascript',
    'typescript',
    'python',
    'java',
    'csharp',
    'cpp',
    'c',
    'go',
    'rust',
    'php',
    'ruby',
    'swift',
    'kotlin',
    'scala',
    'dart',
    'html',
    'css',
    'sql',
    'bash',
    'powershell',
    'yaml',
    'json',
    'xml',
    'markdown',
  ];

  // Snippet categories
  private static readonly CATEGORIES = [
    'algorithm',
    'data-structure',
    'api',
    'authentication',
    'database',
    'frontend',
    'backend',
    'utility',
    'testing',
    'deployment',
    'security',
    'performance',
    'ui-component',
    'boilerplate',
    'other',
  ];

  constructor(db: D1Database, cache?: KVNamespace) {
    this.snippetRepository = new SnippetRepository(db, cache);
    this.userRepository = new UserRepository(db, cache);
  }

  /**
   * Create a new snippet
   */
  async createSnippet(input: CreateSnippetInput): Promise<Snippet> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(input.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate title
      if (!input.title || input.title.trim().length === 0) {
        throw new Error('Snippet title is required');
      }

      if (input.title.length > 200) {
        throw new Error('Snippet title must be 200 characters or less');
      }

      // Validate language
      const normalizedLanguage = input.language.toLowerCase();
      if (!SnippetService.SUPPORTED_LANGUAGES.includes(normalizedLanguage)) {
        throw new Error(
          `Unsupported language: ${input.language}. Supported: ${SnippetService.SUPPORTED_LANGUAGES.join(', ')}`
        );
      }

      // Validate code
      if (!input.code || input.code.trim().length === 0) {
        throw new Error('Snippet code is required');
      }

      if (input.code.length > 50000) {
        throw new Error('Snippet code must be 50,000 characters or less');
      }

      // Validate category if provided
      if (input.category && !SnippetService.CATEGORIES.includes(input.category)) {
        throw new Error(
          `Invalid category: ${input.category}. Supported: ${SnippetService.CATEGORIES.join(', ')}`
        );
      }

      // Validate tags
      if (input.tags && input.tags.length > 20) {
        throw new Error('Maximum 20 tags allowed per snippet');
      }

      // Create snippet entity
      const snippet = await this.snippetRepository.create({
        user_id: input.userId,
        tenant_id: input.tenantId || user.tenant_id || null,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        language: normalizedLanguage,
        code: input.code,
        category: input.category || null,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        visibility: input.visibility || 'private',
        usage_count: 0,
        last_used_at: null,
        metadata: null,
      } as any);

      return snippet;
    } catch (error: any) {
      console.error('Create snippet error:', error);
      throw error;
    }
  }

  /**
   * Get snippet by ID with authorization check
   */
  async getSnippet(snippetId: string, userId?: string): Promise<Snippet | null> {
    try {
      const snippet = await this.snippetRepository.findById(snippetId);

      if (!snippet) {
        return null;
      }

      // Authorization check for private snippets
      if (snippet.visibility === 'private' && snippet.user_id !== userId) {
        throw new Error('Unauthorized access to snippet');
      }

      // Increment usage count
      await this.snippetRepository.incrementUsageCount(snippetId);

      return snippet;
    } catch (error: any) {
      console.error('Get snippet error:', error);
      throw error;
    }
  }

  /**
   * Update snippet
   */
  async updateSnippet(
    snippetId: string,
    userId: string,
    updates: UpdateSnippetInput
  ): Promise<Snippet> {
    try {
      // Get existing snippet
      const existingSnippet = await this.snippetRepository.findById(snippetId);

      if (!existingSnippet) {
        throw new Error('Snippet not found');
      }

      // Authorization check
      if (existingSnippet.user_id !== userId) {
        throw new Error('Unauthorized to update this snippet');
      }

      // Validate title if provided
      if (updates.title !== undefined) {
        if (!updates.title || updates.title.trim().length === 0) {
          throw new Error('Snippet title is required');
        }
        if (updates.title.length > 200) {
          throw new Error('Snippet title must be 200 characters or less');
        }
      }

      // Validate language if provided
      if (updates.language !== undefined) {
        const normalizedLanguage = updates.language.toLowerCase();
        if (!SnippetService.SUPPORTED_LANGUAGES.includes(normalizedLanguage)) {
          throw new Error(`Unsupported language: ${updates.language}`);
        }
      }

      // Validate code if provided
      if (updates.code !== undefined) {
        if (!updates.code || updates.code.trim().length === 0) {
          throw new Error('Snippet code is required');
        }
        if (updates.code.length > 50000) {
          throw new Error('Snippet code must be 50,000 characters or less');
        }
      }

      // Validate category if provided
      if (updates.category !== undefined && updates.category) {
        if (!SnippetService.CATEGORIES.includes(updates.category)) {
          throw new Error(`Invalid category: ${updates.category}`);
        }
      }

      // Validate tags if provided
      if (updates.tags !== undefined && updates.tags.length > 20) {
        throw new Error('Maximum 20 tags allowed per snippet');
      }

      // Build update object
      const updateData: any = {};

      if (updates.title !== undefined) {
        updateData.title = updates.title.trim();
      }

      if (updates.description !== undefined) {
        updateData.description = updates.description?.trim() || null;
      }

      if (updates.language !== undefined) {
        updateData.language = updates.language.toLowerCase();
      }

      if (updates.code !== undefined) {
        updateData.code = updates.code;
      }

      if (updates.category !== undefined) {
        updateData.category = updates.category || null;
      }

      if (updates.tags !== undefined) {
        updateData.tags = JSON.stringify(updates.tags);
      }

      if (updates.visibility !== undefined) {
        updateData.visibility = updates.visibility;
      }

      // Update snippet
      await this.snippetRepository.update(snippetId, updateData);

      // Return updated snippet
      const updatedSnippet = await this.snippetRepository.findById(snippetId);
      return updatedSnippet!;
    } catch (error: any) {
      console.error('Update snippet error:', error);
      throw error;
    }
  }

  /**
   * Delete snippet (soft delete)
   */
  async deleteSnippet(snippetId: string, userId: string): Promise<void> {
    try {
      const snippet = await this.snippetRepository.findById(snippetId);

      if (!snippet) {
        throw new Error('Snippet not found');
      }

      // Authorization check
      if (snippet.user_id !== userId) {
        throw new Error('Unauthorized to delete this snippet');
      }

      await this.snippetRepository.softDelete(snippetId);
    } catch (error: any) {
      console.error('Delete snippet error:', error);
      throw error;
    }
  }

  /**
   * List snippets for a user
   */
  async listUserSnippets(
    userId: string,
    options?: {
      language?: string;
      category?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Snippet[]> {
    try {
      return await this.snippetRepository.findByUserId(userId, options);
    } catch (error: any) {
      console.error('List snippets error:', error);
      throw error;
    }
  }

  /**
   * Search snippets
   */
  async searchSnippets(options: SnippetSearchOptions): Promise<Snippet[]> {
    try {
      // If query provided, use text search
      if (options.query) {
        return await this.snippetRepository.search(
          options.query,
          options.userId,
          options.limit || 20
        );
      }

      // If language filter, search by language
      if (options.language) {
        return await this.snippetRepository.findByLanguage(
          options.language,
          { limit: options.limit || 20 }
        );
      }

      // If category filter, search by category
      if (options.category) {
        return await this.snippetRepository.findByCategory(
          options.category,
          { limit: options.limit || 20 }
        );
      }

      // If tags filter, search by tags
      if (options.tags && options.tags.length > 0) {
        return await this.snippetRepository.findByTags(options.tags, {
          limit: options.limit || 20,
        });
      }

      // Default: return recent snippets
      return await this.snippetRepository.getRecent(options.limit || 20);
    } catch (error: any) {
      console.error('Search snippets error:', error);
      throw error;
    }
  }

  /**
   * Get popular snippets
   */
  async getPopularSnippets(limit: number = 20): Promise<Snippet[]> {
    try {
      return await this.snippetRepository.getPopular(limit);
    } catch (error: any) {
      console.error('Get popular snippets error:', error);
      throw error;
    }
  }

  /**
   * Get recent snippets
   */
  async getRecentSnippets(limit: number = 20): Promise<Snippet[]> {
    try {
      return await this.snippetRepository.getRecent(limit);
    } catch (error: any) {
      console.error('Get recent snippets error:', error);
      throw error;
    }
  }

  /**
   * Get user snippet statistics
   */
  async getUserStats(userId: string) {
    try {
      return await this.snippetRepository.getUserStats(userId);
    } catch (error: any) {
      console.error('Get user snippet stats error:', error);
      throw error;
    }
  }

  /**
   * Clone snippet (create a copy)
   */
  async cloneSnippet(snippetId: string, userId: string, newTitle?: string): Promise<Snippet> {
    try {
      const originalSnippet = await this.getSnippet(snippetId, userId);

      if (!originalSnippet) {
        throw new Error('Snippet not found');
      }

      // Parse tags
      const tags: string[] = originalSnippet.tags
        ? JSON.parse(originalSnippet.tags)
        : [];

      // Create cloned snippet
      return await this.createSnippet({
        userId,
        tenantId: originalSnippet.tenant_id || undefined,
        title: newTitle || `${originalSnippet.title} (Copy)`,
        description: originalSnippet.description || undefined,
        language: originalSnippet.language,
        code: originalSnippet.code,
        category: originalSnippet.category || undefined,
        tags,
        visibility: 'private', // Always private by default
      });
    } catch (error: any) {
      console.error('Clone snippet error:', error);
      throw error;
    }
  }

  /**
   * Get supported languages
   */
  static getSupportedLanguages(): string[] {
    return [...SnippetService.SUPPORTED_LANGUAGES];
  }

  /**
   * Get available categories
   */
  static getCategories(): string[] {
    return [...SnippetService.CATEGORIES];
  }

  /**
   * Get all languages currently in use
   */
  async getUsedLanguages(): Promise<string[]> {
    try {
      return await this.snippetRepository.getLanguages();
    } catch (error: any) {
      console.error('Get used languages error:', error);
      throw error;
    }
  }

  /**
   * Get all categories currently in use
   */
  async getUsedCategories(): Promise<string[]> {
    try {
      return await this.snippetRepository.getCategories();
    } catch (error: any) {
      console.error('Get used categories error:', error);
      throw error;
    }
  }

  /**
   * Analyze code snippet (basic analysis)
   */
  analyzeSnippet(code: string, language: string): {
    lines: number;
    characters: number;
    estimatedComplexity: 'low' | 'medium' | 'high';
    hasComments: boolean;
  } {
    const lines = code.split('\n').length;
    const characters = code.length;

    // Very basic complexity estimation
    let estimatedComplexity: 'low' | 'medium' | 'high' = 'low';
    if (lines > 100 || characters > 2000) {
      estimatedComplexity = 'high';
    } else if (lines > 50 || characters > 1000) {
      estimatedComplexity = 'medium';
    }

    // Check for comments (basic)
    const commentPatterns = ['//', '/*', '*/', '#', '<!--', '"""', "'''"];
    const hasComments = commentPatterns.some((pattern) =>
      code.includes(pattern)
    );

    return {
      lines,
      characters,
      estimatedComplexity,
      hasComments,
    };
  }
}
