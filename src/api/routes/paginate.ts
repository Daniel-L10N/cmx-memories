import { Router, type Request, type Response } from 'express';
import { getMemory, listMemories } from '../../services/memory.service.js';

const router = Router();

/**
 * GET /paginate
 * Efficient pagination using cursor-based approach
 * 
 * Query params:
 *   - cursor: ID of last item (for next page)
 *   - limit: items per page (default 20, max 100)
 *   - type: filter by memory type
 *   - orderBy: createdAt | updatedAt | title (default: createdAt)
 *   - orderDir: asc | desc (default: desc)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 20, type, orderBy = 'createdAt', orderDir = 'desc' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100);

    // Get memories with cursor-based pagination
    const memories = await listMemories({
      type: type as string,
      limit: limitNum + 1, // Fetch one extra to check if there's more
      orderBy: orderBy as 'createdAt' | 'updatedAt' | 'title',
      orderDir: orderDir as 'asc' | 'desc',
    });

    // Check if there's a next page
    let nextCursor: string | null = null;
    let hasMore = false;

    if (memories.length > limitNum) {
      memories.pop(); // Remove the extra item
      hasMore = true;
      nextCursor = memories[memories.length - 1].id;
    }

    res.json({
      memories: memories.map(m => ({
        id: m.id,
        title: m.title,
        content: m.content.substring(0, 200) + (m.content.length > 200 ? '...' : ''),
        type: String(m.typeId),
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
      pagination: {
        limit: limitNum,
        hasMore,
        nextCursor,
        orderBy,
        orderDir,
      }
    });
  } catch (error) {
    console.error('Paginate error:', error);
    res.status(500).json({ error: 'Pagination failed' });
  }
});

/**
 * GET /paginate/:id
 * Get a specific memory by ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const memory = await getMemory(String(req.params.id));
    
    if (!memory) {
      res.status(404).json({ error: { message: 'Memory not found', code: 'NOT_FOUND' } });
      return;
    }

    res.json({ memory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get memory' });
  }
});

export default router;
