/**
 * Search Routes - Search memories
 * Phase 5: REST API
 */

import { Router } from 'express';
import { search } from '../../services/search.service.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

/**
 * GET /api/memories/search - Search memories
 * Query params:
 *   - q: Search query (required)
 *   - type: Filter by memory type
 *   - limit: Max results (default: 10)
 *   - project: Filter by project (via metadata)
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query.q as string;
    const type = req.query.type as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const project = req.query.project as string | undefined;

    if (!query) {
      res.status(400).json({
        error: {
          message: 'Search query (q) is required',
          code: 'VALIDATION_ERROR',
        },
      });
      return;
    }

    const results = await search(query, {
      query,
      type,
      limit,
      project,
    });

    res.json({
      results: results.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        contentPreview: r.contentPreview,
        type: r.type,
        score: r.score,
        createdAt: r.createdAt,
      })),
      total: results.length,
    });
  })
);

export default router;
