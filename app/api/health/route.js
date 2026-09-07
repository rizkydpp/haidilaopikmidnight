import { kvHealth } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = await kvHealth();
  return Response.json(health);
}
