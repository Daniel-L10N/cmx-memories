/**
 * Types Routes - Memory type management
 * Phase 5: REST API
 */

import { Router } from 'express';
import {
  createType,
  getType,
  getTypeByName,
  listTypes,
  updateType,
  deleteType,
} from '../../services/types.service.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

/**
 * GET /api/types - List all memory types
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const types = await listTypes();

    res.json({
      types: types.map((t) => ({
        id: t.id,
        name: t.name,
        schema: t.schema,
        version: t.version,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      total: types.length,
    });
  })
);

/**
 * POST /api/types - Create a new memory type
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, schema } = req.body;

    if (!name) {
      res.status(400).json({
        error: {
          message: 'Type name is required',
          code: 'VALIDATION_ERROR',
        },
      });
      return;
    }

    // Check if type already exists
    const existing = await getTypeByName(name);
    if (existing) {
      res.status(409).json({
        error: {
          message: `Type already exists: ${name}`,
          code: 'CONFLICT',
        },
      });
      return;
    }

    const type = await createType(name, schema);

    res.status(201).json({
      id: type.id,
      name: type.name,
      schema: type.schema,
      version: type.version,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
    });
  })
);

/**
 * GET /api/types/:id - Get a specific type
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const type = await getType(id);

    if (!type) {
      res.status(404).json({
        error: {
          message: `Type not found: ${req.params.id}`,
          code: 'NOT_FOUND',
        },
      });
      return;
    }

    res.json({
      id: type.id,
      name: type.name,
      schema: type.schema,
      version: type.version,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
    });
  })
);

/**
 * PUT /api/types/:id - Update a type
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const { schema } = req.body;

    const type = await updateType(id, { fields: schema?.fields || [] });

    res.json({
      id: type.id,
      name: type.name,
      schema: type.schema,
      version: type.version,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
    });
  })
);

/**
 * DELETE /api/types/:id - Delete a type
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    await deleteType(id);

    res.status(204).send();
  })
);

export default router;
