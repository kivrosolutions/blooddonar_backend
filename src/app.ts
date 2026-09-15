import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { corsOptions } from './config/cors';
import { logger, requestTimestamp } from './middlewares/logger.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/notFound.middleware';
import { healthRouter } from './modules/health/health.routes';
import { authRouter } from './modules/auth/auth.routes';
import { donorsRouter } from './modules/donors/donors.routes';
import { uploadsRouter } from './modules/uploads/uploads.routes';
import { bloodRequestsRouter } from './modules/blood-requests/blood-requests.routes';

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);
app.use(requestTimestamp);

app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/donors', donorsRouter);
app.use('/api/v1/uploads', uploadsRouter);
app.use('/api/v1/blood-requests', bloodRequestsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
