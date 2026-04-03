import { Router, type Request, type Response } from 'express';
import { getDatabase } from '../../db/connection.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, limit = 5 } = req.query;
    const query = (q as string || '').trim().toLowerCase();
    const limitNum = Math.min(parseInt(limit as string, 10) || 5, 10);
    
    if (!query || query.length < 2) {
      res.json({ suggestions: [] });
      return;
    }
    
    const db = getDatabase();
    
    const stmt = db.prepare(`
      SELECT DISTINCT m.title, m.content, mt.name as typeName, m.id
      FROM memories m
      JOIN memory_types mt ON m.type_id = mt.id
      WHERE m.title LIKE ? OR m.content LIKE ?
      LIMIT ?
    `);
    
    const pattern = query + '%';
    const results = stmt.all(pattern, pattern, limitNum) as Array<{
      title: string;
      content: string;
      typeName: string;
      id: string;
    }>;
    
    const suggestions = results.map(r => {
      const contentLower = r.content.toLowerCase();
      const idx = contentLower.indexOf(query);
      let snippet = '';
      
      if (idx >= 0) {
        const start = Math.max(0, idx - 30);
        const end = Math.min(r.content.length, idx + query.length + 50);
        snippet = (start > 0 ? '...' : '') + r.content.substring(start, end) + (end < r.content.length ? '...' : '');
      }
      
      return { id: r.id, title: r.title, type: r.typeName, snippet };
    });
    
    res.json({ suggestions, query });
  } catch (error) {
    console.error('Suggest error:', error);
    res.status(500).json({ error: 'Suggest failed' });
  }
});

export default router;
