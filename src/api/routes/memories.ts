/**
 * Memory Routes - CRUD operations for memories
 * Phase 5: REST API
 */

import { Router } from 'express';
import {
  createMemory,
  getMemory,
  updateMemory,
  deleteMemory,
  listMemories,
} from '../../services/memory.service.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

/**
 * POST /api/memories - Create a new memory
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { title, content, type, metadata } = req.body;

    if (!title || !content) {
      res.status(400).json({
        error: {
          message: 'Title and content are required',
          code: 'VALIDATION_ERROR',
        },
      });
      return;
    }

    const memory = await createMemory({
      title,
      content,
      type: type || 'memory',
      metadata,
    });

    res.status(201).json({
      id: memory.id,
      title: memory.title,
      content: memory.content,
      type: memory.typeId,
      metadata: memory.metadata,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
    });
  })
);

/**
 * GET /api/memories - List all memories
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const options = {
      type: req.query.type as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      orderBy: req.query.orderBy as 'createdAt' | 'updatedAt' | 'title' | undefined,
      orderDir: req.query.orderDir as 'asc' | 'desc' | undefined,
    };

    const memories = await listMemories(options);

    res.json({
      memories: memories.map((m) => ({
        id: m.id,
        title: m.title,
        content: m.content,
        type: m.typeId,
        metadata: m.metadata,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
      total: memories.length,
    });
  })
);

/**
 * GET /api/memories/:id - Get a specific memory
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const memory = await getMemory(id);

    if (!memory) {
      res.status(404).json({
        error: {
          message: `Memory not found: ${req.params.id}`,
          code: 'NOT_FOUND',
        },
      });
      return;
    }

    res.json({
      id: memory.id,
      title: memory.title,
      content: memory.content,
      type: memory.typeId,
      metadata: memory.metadata,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
    });
  })
);

/**
 * PUT /api/memories/:id - Update a memory
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const memory = await updateMemory(id, req.body);

    res.json({
      id: memory.id,
      title: memory.title,
      content: memory.content,
      type: memory.typeId,
      metadata: memory.metadata,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
    });
  })
);

/**
 * DELETE /api/memories/:id - Delete a memory
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    await deleteMemory(id);

    res.status(204).send();
  })
);

export default router;
