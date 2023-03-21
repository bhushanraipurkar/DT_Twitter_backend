import express, { Express, NextFunction, Request, Response } from 'express';
const app: Express = express();
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimiter from 'express-rate-limit';
import compression from 'compression';
import { router as UserRouter } from './routes/user';
import { router as TweetRouter } from './routes/tweet';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('combined'));
app.use(helmet());
app.use(cors());
app.use(compression({ level: 6 }));

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
});
app.use(limiter);

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.use('/user', UserRouter);
app.use('/tweet', TweetRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
  const err: any = new Error('Not found');
  err.status = 404;
  next(err);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {},
  });
});

// start the server
app.listen(8081, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:8081`);
});
