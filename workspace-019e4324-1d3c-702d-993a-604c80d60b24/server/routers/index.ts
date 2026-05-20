import { router } from '../trpc';
import { goldRouter } from './gold';

export const appRouter = router({
  gold: goldRouter,
});

export type AppRouter = typeof appRouter;
