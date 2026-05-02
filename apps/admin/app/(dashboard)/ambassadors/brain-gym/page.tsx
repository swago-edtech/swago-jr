import { connectDB, User } from '@swago/database';
import BrainGymSubmissionsTable from '@/components/BrainGymSubmissionsTable';

async function getBrainGymSubmissions() {
  await connectDB();
  
  const users = await User.find({
    'ambassador.brainGym.reelUrl': { $exists: true },
  })
    .select('name email phone ambassador age gender')
    .sort({ 'ambassador.brainGym.submittedAt': -1 })
    .lean();

  return JSON.parse(JSON.stringify(users));
}

export default async function BrainGymSubmissionsPage() {
  const submissions = await getBrainGymSubmissions();

  // Stats
  const stats = {
    total: submissions.length,
    pending: submissions.filter((s: any) => s.ambassador.brainGym?.status === 'pending').length,
    approved: submissions.filter((s: any) => s.ambassador.brainGym?.status === 'approved').length,
    rejected: submissions.filter((s: any) => s.ambassador.brainGym?.status === 'rejected').length,
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-[1000] text-gray-900 uppercase italic tracking-tighter leading-none">
            Brain Gym <span className="text-purple-600">Submissions</span>
          </h1>
          <p className="text-gray-500 font-medium mt-2">Manage and review Brain Gym challenge entries from your ambassadors.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard label="Total Entries" value={stats.total} color="blue" />
        <StatCard label="Pending Review" value={stats.pending} color="yellow" />
        <StatCard label="Approved" value={stats.approved} color="green" />
        <StatCard label="Rejected" value={stats.rejected} color="red" />
      </div>

      {/* Table Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-purple-600 rounded-full" />
            <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">Submission List</h2>
        </div>
        <BrainGymSubmissionsTable initialSubmissions={submissions} />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, { bg: string, text: string, border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
  };

  const colors = colorMap[color];

  return (
    <div className={`bg-white rounded-2xl p-6 border-2 ${colors.border} shadow-sm transition-all hover:shadow-md`}>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-3xl font-black italic tracking-tighter ${colors.text}`}>{value}</p>
    </div>
  );
}
