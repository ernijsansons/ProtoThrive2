/**
 * SnippetService Unit Tests
 * Tests for snippet business logic
 */

import { SnippetService } from '../../../services/snippet.service';
import { SnippetRepository } from '../../../repositories/snippet.repository';
import { UserRepository } from '../../../repositories/user.repository';

// Mock repositories
jest.mock('../../../repositories/snippet.repository');
jest.mock('../../../repositories/user.repository');

describe('SnippetService', () => {
  let snippetService: SnippetService;
  let mockDb: D1Database;
  let mockCache: KVNamespace;
  let mockSnippetRepo: jest.Mocked<SnippetRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockDb = {} as D1Database;
    mockCache = {} as KVNamespace;
    snippetService = new SnippetService(mockDb, mockCache);
    mockSnippetRepo = (snippetService as any).snippetRepository;
    mockUserRepo = (snippetService as any).userRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSnippet', () => {
    it('should create snippet successfully', async () => {
      const mockUser = {
        id: 'user_123',
        tenant_id: 'tenant_123',
      };

      const input = {
        userId: 'user_123',
        title: 'Test Snippet',
        description: 'Test description',
        language: 'javascript',
        code: 'console.log("hello");',
        category: 'utility',
        tags: ['test', 'example'],
      };

      const mockSnippet = {
        id: 'snippet_123',
        user_id: 'user_123',
        tenant_id: 'tenant_123',
        title: 'Test Snippet',
        description: 'Test description',
        language: 'javascript',
        code: 'console.log("hello");',
        category: 'utility',
        tags: JSON.stringify(['test', 'example']),
        visibility: 'private',
        usage_count: 0,
        created_at: new Date(),
      };

      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockSnippetRepo.create.mockResolvedValue(mockSnippet as any);

      const result = await snippetService.createSnippet(input);

      expect(result).toEqual(mockSnippet);
      expect(mockUserRepo.findById).toHaveBeenCalledWith('user_123');
      expect(mockSnippetRepo.create).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(
        snippetService.createSnippet({
          userId: 'invalid_user',
          title: 'Test',
          language: 'javascript',
          code: 'test',
        })
      ).rejects.toThrow('User not found');
    });

    it('should throw error if title is empty', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'user_123' } as any);

      await expect(
        snippetService.createSnippet({
          userId: 'user_123',
          title: '   ',
          language: 'javascript',
          code: 'test',
        })
      ).rejects.toThrow('Snippet title is required');
    });

    it('should throw error if title is too long', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'user_123' } as any);

      await expect(
        snippetService.createSnippet({
          userId: 'user_123',
          title: 'a'.repeat(201),
          language: 'javascript',
          code: 'test',
        })
      ).rejects.toThrow('Snippet title must be 200 characters or less');
    });

    it('should throw error if language is unsupported', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'user_123' } as any);

      await expect(
        snippetService.createSnippet({
          userId: 'user_123',
          title: 'Test',
          language: 'invalid-language',
          code: 'test',
        })
      ).rejects.toThrow('Unsupported language');
    });

    it('should throw error if code is empty', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'user_123' } as any);

      await expect(
        snippetService.createSnippet({
          userId: 'user_123',
          title: 'Test',
          language: 'javascript',
          code: '   ',
        })
      ).rejects.toThrow('Snippet code is required');
    });

    it('should throw error if code is too long', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'user_123' } as any);

      await expect(
        snippetService.createSnippet({
          userId: 'user_123',
          title: 'Test',
          language: 'javascript',
          code: 'a'.repeat(50001),
        })
      ).rejects.toThrow('Snippet code must be 50,000 characters or less');
    });

    it('should throw error if category is invalid', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'user_123' } as any);

      await expect(
        snippetService.createSnippet({
          userId: 'user_123',
          title: 'Test',
          language: 'javascript',
          code: 'test',
          category: 'invalid-category',
        })
      ).rejects.toThrow('Invalid category');
    });

    it('should throw error if too many tags', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'user_123' } as any);

      await expect(
        snippetService.createSnippet({
          userId: 'user_123',
          title: 'Test',
          language: 'javascript',
          code: 'test',
          tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
        })
      ).rejects.toThrow('Maximum 20 tags allowed per snippet');
    });

    it('should normalize language to lowercase', async () => {
      const mockUser = { id: 'user_123' };

      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockSnippetRepo.create.mockResolvedValue({
        id: 'snippet_123',
        language: 'javascript',
      } as any);

      await snippetService.createSnippet({
        userId: 'user_123',
        title: 'Test',
        language: 'JavaScript', // Mixed case
        code: 'test',
      });

      expect(mockSnippetRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'javascript' })
      );
    });
  });

  describe('getSnippet', () => {
    it('should return snippet and increment usage count', async () => {
      const mockSnippet = {
        id: 'snippet_123',
        user_id: 'user_123',
        visibility: 'private',
      };

      mockSnippetRepo.findById.mockResolvedValue(mockSnippet as any);
      mockSnippetRepo.incrementUsageCount.mockResolvedValue(undefined);

      const result = await snippetService.getSnippet('snippet_123', 'user_123');

      expect(result).toEqual(mockSnippet);
      expect(mockSnippetRepo.incrementUsageCount).toHaveBeenCalledWith('snippet_123');
    });

    it('should allow access to shared snippet', async () => {
      const mockSnippet = {
        id: 'snippet_123',
        user_id: 'user_123',
        visibility: 'shared',
      };

      mockSnippetRepo.findById.mockResolvedValue(mockSnippet as any);
      mockSnippetRepo.incrementUsageCount.mockResolvedValue(undefined);

      const result = await snippetService.getSnippet('snippet_123', 'user_456');

      expect(result).toEqual(mockSnippet);
    });

    it('should throw error for private snippet of another user', async () => {
      const mockSnippet = {
        id: 'snippet_123',
        user_id: 'user_123',
        visibility: 'private',
      };

      mockSnippetRepo.findById.mockResolvedValue(mockSnippet as any);

      await expect(
        snippetService.getSnippet('snippet_123', 'user_456')
      ).rejects.toThrow('Unauthorized access to snippet');
    });

    it('should return null if snippet not found', async () => {
      mockSnippetRepo.findById.mockResolvedValue(null);

      const result = await snippetService.getSnippet('invalid', 'user_123');

      expect(result).toBeNull();
    });
  });

  describe('updateSnippet', () => {
    it('should update snippet successfully', async () => {
      const mockExistingSnippet = {
        id: 'snippet_123',
        user_id: 'user_123',
        title: 'Old Title',
        language: 'javascript',
        code: 'old code',
      };

      const mockUpdatedSnippet = {
        ...mockExistingSnippet,
        title: 'New Title',
      };

      mockSnippetRepo.findById
        .mockResolvedValueOnce(mockExistingSnippet as any)
        .mockResolvedValueOnce(mockUpdatedSnippet as any);
      mockSnippetRepo.update.mockResolvedValue(undefined);

      const result = await snippetService.updateSnippet(
        'snippet_123',
        'user_123',
        { title: 'New Title' }
      );

      expect(result.title).toBe('New Title');
      expect(mockSnippetRepo.update).toHaveBeenCalled();
    });

    it('should throw error if user is not owner', async () => {
      const mockSnippet = {
        id: 'snippet_123',
        user_id: 'user_123',
      };

      mockSnippetRepo.findById.mockResolvedValue(mockSnippet as any);

      await expect(
        snippetService.updateSnippet('snippet_123', 'user_456', {
          title: 'New Title',
        })
      ).rejects.toThrow('Unauthorized to update this snippet');
    });

    it('should validate language on update', async () => {
      const mockSnippet = {
        id: 'snippet_123',
        user_id: 'user_123',
      };

      mockSnippetRepo.findById.mockResolvedValue(mockSnippet as any);

      await expect(
        snippetService.updateSnippet('snippet_123', 'user_123', {
          language: 'invalid-language',
        })
      ).rejects.toThrow('Unsupported language');
    });
  });

  describe('deleteSnippet', () => {
    it('should delete snippet successfully', async () => {
      const mockSnippet = {
        id: 'snippet_123',
        user_id: 'user_123',
      };

      mockSnippetRepo.findById.mockResolvedValue(mockSnippet as any);
      mockSnippetRepo.delete.mockResolvedValue(undefined);

      await snippetService.deleteSnippet('snippet_123', 'user_123');

      expect(mockSnippetRepo.delete).toHaveBeenCalledWith('snippet_123');
    });

    it('should throw error if user is not owner', async () => {
      const mockSnippet = {
        id: 'snippet_123',
        user_id: 'user_123',
      };

      mockSnippetRepo.findById.mockResolvedValue(mockSnippet as any);

      await expect(
        snippetService.deleteSnippet('snippet_123', 'user_456')
      ).rejects.toThrow('Unauthorized to delete this snippet');
    });
  });

  describe('searchSnippets', () => {
    it('should search by query text', async () => {
      const mockResults = [{ id: 'snippet_1', title: 'Test Snippet' }];

      mockSnippetRepo.search.mockResolvedValue(mockResults as any);

      const result = await snippetService.searchSnippets({
        query: 'test',
        userId: 'user_123',
      });

      expect(result).toEqual(mockResults);
      expect(mockSnippetRepo.search).toHaveBeenCalledWith('test', 'user_123', 20);
    });

    it('should search by language', async () => {
      const mockResults = [{ id: 'snippet_1', language: 'python' }];

      mockSnippetRepo.findByLanguage.mockResolvedValue(mockResults as any);

      const result = await snippetService.searchSnippets({
        language: 'python',
      });

      expect(result).toEqual(mockResults);
      expect(mockSnippetRepo.findByLanguage).toHaveBeenCalled();
    });

    it('should search by category', async () => {
      const mockResults = [{ id: 'snippet_1', category: 'algorithm' }];

      mockSnippetRepo.findByCategory.mockResolvedValue(mockResults as any);

      const result = await snippetService.searchSnippets({
        category: 'algorithm',
      });

      expect(result).toEqual(mockResults);
      expect(mockSnippetRepo.findByCategory).toHaveBeenCalled();
    });

    it('should search by tags', async () => {
      const mockResults = [{ id: 'snippet_1', tags: '["test"]' }];

      mockSnippetRepo.findByTags.mockResolvedValue(mockResults as any);

      const result = await snippetService.searchSnippets({
        tags: ['test'],
      });

      expect(result).toEqual(mockResults);
      expect(mockSnippetRepo.findByTags).toHaveBeenCalled();
    });

    it('should return recent snippets by default', async () => {
      const mockResults = [{ id: 'snippet_1' }];

      mockSnippetRepo.getRecent.mockResolvedValue(mockResults as any);

      const result = await snippetService.searchSnippets({});

      expect(result).toEqual(mockResults);
      expect(mockSnippetRepo.getRecent).toHaveBeenCalled();
    });
  });

  describe('cloneSnippet', () => {
    it('should clone snippet successfully', async () => {
      const mockOriginal = {
        id: 'snippet_123',
        user_id: 'user_123',
        tenant_id: 'tenant_123',
        title: 'Original Snippet',
        description: 'Original description',
        language: 'javascript',
        code: 'console.log("test");',
        category: 'utility',
        tags: JSON.stringify(['tag1', 'tag2']),
        visibility: 'private',
      };

      const mockCloned = {
        ...mockOriginal,
        id: 'snippet_456',
        title: 'Original Snippet (Copy)',
      };

      mockSnippetRepo.findById.mockResolvedValue(mockOriginal as any);
      mockSnippetRepo.incrementUsageCount.mockResolvedValue(undefined);
      mockUserRepo.findById.mockResolvedValue({ id: 'user_123' } as any);
      mockSnippetRepo.create.mockResolvedValue(mockCloned as any);

      const result = await snippetService.cloneSnippet('snippet_123', 'user_123');

      expect(result.title).toBe('Original Snippet (Copy)');
      expect(mockSnippetRepo.create).toHaveBeenCalled();
    });

    it('should use custom title for cloned snippet', async () => {
      const mockOriginal = {
        id: 'snippet_123',
        user_id: 'user_123',
        title: 'Original',
        language: 'javascript',
        code: 'test',
        visibility: 'private',
      };

      mockSnippetRepo.findById.mockResolvedValue(mockOriginal as any);
      mockSnippetRepo.incrementUsageCount.mockResolvedValue(undefined);
      mockUserRepo.findById.mockResolvedValue({ id: 'user_123' } as any);
      mockSnippetRepo.create.mockResolvedValue({
        ...mockOriginal,
        title: 'Custom Title',
      } as any);

      const result = await snippetService.cloneSnippet(
        'snippet_123',
        'user_123',
        'Custom Title'
      );

      expect(result.title).toBe('Custom Title');
    });
  });

  describe('analyzeSnippet', () => {
    it('should analyze code correctly', () => {
      const code = `// This is a comment
function test() {
  console.log("test");
  return true;
}`;

      const result = snippetService.analyzeSnippet(code, 'javascript');

      expect(result.lines).toBe(5);
      expect(result.characters).toBe(code.length);
      expect(result.hasComments).toBe(true);
      expect(result.estimatedComplexity).toBe('low');
    });

    it('should detect medium complexity', () => {
      const code = 'a'.repeat(1500);

      const result = snippetService.analyzeSnippet(code, 'javascript');

      expect(result.estimatedComplexity).toBe('medium');
    });

    it('should detect high complexity', () => {
      const code = 'a'.repeat(2500);

      const result = snippetService.analyzeSnippet(code, 'javascript');

      expect(result.estimatedComplexity).toBe('high');
    });

    it('should detect missing comments', () => {
      const code = 'function test() { return true; }';

      const result = snippetService.analyzeSnippet(code, 'javascript');

      expect(result.hasComments).toBe(false);
    });
  });

  describe('static methods', () => {
    it('should return supported languages', () => {
      const languages = SnippetService.getSupportedLanguages();

      expect(languages).toContain('javascript');
      expect(languages).toContain('python');
      expect(languages).toContain('typescript');
      expect(Array.isArray(languages)).toBe(true);
    });

    it('should return categories', () => {
      const categories = SnippetService.getCategories();

      expect(categories).toContain('algorithm');
      expect(categories).toContain('utility');
      expect(categories).toContain('api');
      expect(Array.isArray(categories)).toBe(true);
    });
  });

  describe('getUserStats', () => {
    it('should return user snippet statistics', async () => {
      const mockStats = {
        total: 50,
        totalUsage: 500,
        byLanguage: { javascript: 30, python: 20 },
        byCategory: { utility: 25, algorithm: 25 },
        mostUsed: { id: 'snippet_1', usage_count: 100 } as any,
      };

      mockSnippetRepo.getUserStats.mockResolvedValue(mockStats);

      const result = await snippetService.getUserStats('user_123');

      expect(result).toEqual(mockStats);
      expect(mockSnippetRepo.getUserStats).toHaveBeenCalledWith('user_123');
    });
  });
});
