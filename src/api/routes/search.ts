import { Router, type Request, type Response } from 'express';
import { advancedSearch, searchByFilter } from '../../services/search.service.js';
import { listMemories } from '../../services/memory.service.js';

const router = Router();

/**
 * GET /search
 * Search memories by query
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, type, project, limit = 10 } = req.query;
    const limitNum = parseInt(limit as string, 10) || 10;
    
    if (!q || (q as string).trim() === '') {
      const memories = await listMemories({ limit: limitNum });
      res.json({ results: memories, total: memories.length, type: 'recent' });
      return;
    }
    
    const results = await advancedSearch(q as string, {
      query: q as string,
      type: type as string,
      project: project as string,
      limit: limitNum,
    });
    
    res.json({ results, total: results.length, type: 'search' });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /filter
 * Filter memories without full-text search
 */
router.get('/filter', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, project, limit = 20 } = req.query;
    const limitNum = parseInt(limit as string, 10) || 20;
    
    const results = await searchByFilter({
      type: type as string,
      project: project as string,
      limit: limitNum,
    });
    
    res.json({ results, total: results.length });
  } catch (error) {
    res.status(500).json({ error: 'Filter failed' });
  }
});

export default router;
