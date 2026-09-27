import { Router } from 'express';
import authRouter from './auth.routes';

const apiRouter = Router();

// ==========================================
// Mount Authentication Routes
// ==========================================
apiRouter.use('/auth', authRouter);

export default apiRouter;
