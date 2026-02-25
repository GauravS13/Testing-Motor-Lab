import { getAllMasterData } from '@/actions/master-data';
import { AppShell } from '@/components/layout/app-shell';
import { MasterTestSession } from '@/components/test-session/MasterTestSession';
import { TestSessionRecord } from '@/components/test-session/TestSessionInterface';

export const dynamic = 'force-dynamic';

export default async function TestingPage() {
  const masterData = await getAllMasterData();

  return (
    <AppShell activeTab="Testing">
        <MasterTestSession records={masterData as unknown as TestSessionRecord[]} />
    </AppShell>
  );
}
