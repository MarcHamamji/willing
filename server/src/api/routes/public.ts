import { Response, Router } from 'express';

import { PublicHomeStatsResponse } from './public.types.js';
import database from '../../db/index.js';

const publicRouter = Router();

publicRouter.get('/home-stats', async (_req, res: Response<PublicHomeStatsResponse>) => {
  const [postingsResult, organizationsResult, volunteersResult] = await Promise.all([
    database
      .selectFrom('organization_posting')
      .select(eb => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow(),
    database
      .selectFrom('organization_account')
      .select(eb => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow(),
    database
      .selectFrom('volunteer_account')
      .select(eb => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow(),
  ]);

  res.json({
    totalOpportunities: Number(postingsResult.count),
    totalOrganizations: Number(organizationsResult.count),
    totalVolunteers: Number(volunteersResult.count),
  });
});

export default publicRouter;
