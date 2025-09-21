// Ref: CLAUDE.md - API endpoints for AI feedback persistence
import { NextApiRequest, NextApiResponse } from 'next';
import { AIFeedback } from '../../components/AIFeedbackEngine';

interface FeedbackHistoryEntry {
  id: string;
  userId: string;
  roadmapId: string;
  feedback: AIFeedback;
  timestamp: Date;
  context: {
    nodeCount: number;
    edgeCount: number;
    thriveScore: number;
    mode: string;
  };
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  rating?: number; // User rating of feedback quality (1-5)
  followedAction?: boolean; // Whether user followed the suggested action
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Mock database for demonstration
let feedbackHistory: FeedbackHistoryEntry[] = [];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return handleGetFeedback(req, res);
      case 'POST':
        return handleCreateFeedback(req, res);
      case 'PUT':
        return handleUpdateFeedback(req, res);
      case 'DELETE':
        return handleDeleteFeedback(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('AI Feedback API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGetFeedback(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const {
    userId,
    roadmapId,
    type,
    category,
    priority,
    resolved,
    page = '1',
    limit = '20',
    sortBy = 'timestamp',
    sortOrder = 'desc'
  } = req.query;

  // Validate authorization (mock implementation)
  const userIdParam = Array.isArray(userId) ? userId[0] : userId;
  if (!userIdParam) {
    return res.status(401).json({ error: 'User ID required' });
  }

  let filteredFeedback = feedbackHistory.filter(entry => entry.userId === userIdParam);

  // Apply filters
  if (roadmapId) {
    const roadmapIdParam = Array.isArray(roadmapId) ? roadmapId[0] : roadmapId;
    filteredFeedback = filteredFeedback.filter(entry => entry.roadmapId === roadmapIdParam);
  }

  if (type) {
    const typeParam = Array.isArray(type) ? type[0] : type;
    filteredFeedback = filteredFeedback.filter(entry => entry.feedback.type === typeParam);
  }

  if (category) {
    const categoryParam = Array.isArray(category) ? category[0] : category;
    filteredFeedback = filteredFeedback.filter(entry => entry.feedback.category === categoryParam);
  }

  if (priority) {
    const priorityParam = Array.isArray(priority) ? priority[0] : priority;
    filteredFeedback = filteredFeedback.filter(entry => entry.feedback.priority === priorityParam);
  }

  if (resolved !== undefined) {
    const resolvedParam = resolved === 'true';
    filteredFeedback = filteredFeedback.filter(entry => entry.resolved === resolvedParam);
  }

  // Apply sorting
  const sortByParam = Array.isArray(sortBy) ? sortBy[0] : sortBy;
  const sortOrderParam = Array.isArray(sortOrder) ? sortOrder[0] : sortOrder;

  filteredFeedback.sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortByParam) {
      case 'timestamp':
        aValue = new Date(a.timestamp).getTime();
        bValue = new Date(b.timestamp).getTime();
        break;
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.feedback.priority] || 0;
        bValue = priorityOrder[b.feedback.priority] || 0;
        break;
      case 'confidence':
        aValue = a.feedback.confidence;
        bValue = b.feedback.confidence;
        break;
      case 'rating':
        aValue = a.rating || 0;
        bValue = b.rating || 0;
        break;
      default:
        aValue = a.timestamp;
        bValue = b.timestamp;
    }

    if (sortOrderParam === 'desc') {
      return bValue - aValue;
    }
    return aValue - bValue;
  });

  // Apply pagination
  const pageNum = parseInt(Array.isArray(page) ? page[0] : page);
  const limitNum = parseInt(Array.isArray(limit) ? limit[0] : limit);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;

  const paginatedData = filteredFeedback.slice(startIndex, endIndex);

  const response: PaginatedResponse<FeedbackHistoryEntry> = {
    data: paginatedData,
    total: filteredFeedback.length,
    page: pageNum,
    limit: limitNum,
    hasNext: endIndex < filteredFeedback.length,
    hasPrev: pageNum > 1
  };

  res.status(200).json(response);
}

async function handleCreateFeedback(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { userId, roadmapId, feedback, context } = req.body;

  // Validate required fields
  if (!userId || !roadmapId || !feedback) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['userId', 'roadmapId', 'feedback']
    });
  }

  // Validate feedback structure
  if (!feedback.id || !feedback.type || !feedback.title || !feedback.message) {
    return res.status(400).json({
      error: 'Invalid feedback structure',
      required: ['id', 'type', 'title', 'message']
    });
  }

  const newEntry: FeedbackHistoryEntry = {
    id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    roadmapId,
    feedback: {
      ...feedback,
      timestamp: new Date(feedback.timestamp || Date.now()),
    },
    timestamp: new Date(),
    context: context || {
      nodeCount: 0,
      edgeCount: 0,
      thriveScore: 0,
      mode: '2d'
    },
    resolved: false
  };

  feedbackHistory.push(newEntry);

  // In a real implementation, this would save to a database
  console.log('Feedback saved:', newEntry.id);

  res.status(201).json({
    success: true,
    data: newEntry
  });
}

async function handleUpdateFeedback(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { id } = req.query;
  const { resolved, rating, followedAction, resolvedBy } = req.body;

  const feedbackId = Array.isArray(id) ? id[0] : id;
  if (!feedbackId) {
    return res.status(400).json({ error: 'Feedback ID required' });
  }

  const entryIndex = feedbackHistory.findIndex(entry => entry.id === feedbackId);
  if (entryIndex === -1) {
    return res.status(404).json({ error: 'Feedback not found' });
  }

  const entry = feedbackHistory[entryIndex];

  // Update fields
  if (resolved !== undefined) {
    entry.resolved = resolved;
    if (resolved) {
      entry.resolvedAt = new Date();
      entry.resolvedBy = resolvedBy || 'user';
    }
  }

  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    entry.rating = rating;
  }

  if (followedAction !== undefined) {
    entry.followedAction = followedAction;
  }

  feedbackHistory[entryIndex] = entry;

  res.status(200).json({
    success: true,
    data: entry
  });
}

async function handleDeleteFeedback(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { id } = req.query;
  const { userId } = req.body;

  const feedbackId = Array.isArray(id) ? id[0] : id;
  if (!feedbackId) {
    return res.status(400).json({ error: 'Feedback ID required' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  const entryIndex = feedbackHistory.findIndex(
    entry => entry.id === feedbackId && entry.userId === userId
  );

  if (entryIndex === -1) {
    return res.status(404).json({ error: 'Feedback not found or unauthorized' });
  }

  const deletedEntry = feedbackHistory.splice(entryIndex, 1)[0];

  res.status(200).json({
    success: true,
    deleted: deletedEntry.id
  });
}