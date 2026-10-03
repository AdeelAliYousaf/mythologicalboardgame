import { notFound } from 'next/navigation';
import { BoardTestHarness } from '@/components/board/BoardTestHarness';

export const dynamic = 'force-dynamic';
export default function BoardTestPage() {
  if (process.env.BOARD_GEOMETRY_TESTING !== '1') notFound();
  return <BoardTestHarness />;
}
