import { Router, Request, Response } from 'express';
import authRouter from './auth.routes';

const apiRouter = Router();

// ==========================================
// Health & Status Check Endpoint
// ==========================================
apiRouter.get('/', (_: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    message: 'eflix backend API is running 🚀',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// Mount Authentication Routes
// ==========================================
apiRouter.use('/auth', authRouter);

export default apiRouter;
