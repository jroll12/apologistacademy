import type { Config, Context } from '@netlify/functions';
import { createDeps } from '../../server/deps';
import { handle } from '../../server/handler';
import { blobUsage } from '../../server/usage';

const usage = blobUsage();

export default async function api(req: Request, context: Context): Promise<Response> {
  return handle(req, createDeps(process.env, usage, context.ip ?? 'unknown'));
}

export const config: Config = { path: '/api/*' };
