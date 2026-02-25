import { TestedDataRow } from '@/types/test-session';
import { Activity, CheckCircle2, XCircle } from 'lucide-react';

interface ResultsSummaryProps {
  data: TestedDataRow[];
}

export function ResultsSummary({ data }: ResultsSummaryProps) {
  const total = data.length;
  const passed = data.filter((row) => row.finalResult === true).length;
  const failed = data.filter((row) => row.finalResult === false).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <SummaryCard
        title="Total Tests"
        value={total}
        icon={<Activity className="w-5 h-5 text-blue-600" />}
        color="blue"
      />
      <SummaryCard
        title="Passed"
        value={passed}
        icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
        color="green"
      />
      <SummaryCard
        title="Failed"
        value={failed}
        icon={<XCircle className="w-5 h-5 text-red-600" />}
        color="red"
      />
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red';
}

function SummaryCard({ title, value, icon, color }: SummaryCardProps) {
  const colorStyles = {
    blue: 'bg-blue-50 border-blue-100 text-blue-900',
    green: 'bg-green-50 border-green-100 text-green-900',
    red: 'bg-red-50 border-red-100 text-red-900',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorStyles[color]} shadow-sm flex items-center justify-between`}>
      <div>
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
      </div>
      <div className={`p-3 rounded-lg bg-white/60 backdrop-blur-sm`}>
        {icon}
      </div>
    </div>
  );
}
