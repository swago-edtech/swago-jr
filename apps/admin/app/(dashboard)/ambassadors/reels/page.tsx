import { connectDB, KidProfile, User } from '@swago/database';
import ReelSubmissionsTable from '@/components/ReelSubmissionsTable';

async function getReelSubmissions() {
  await connectDB();
  
  const profiles = await KidProfile.find({
    'ambassador.isAmbassador': true,
    'ambassador.entryChallenge.submitted': true,
  })
    .populate('userId', 'name email phone')
    .sort({ 'ambassador.entryChallenge.submittedAt': -1 })
    .lean();

  return JSON.parse(JSON.stringify(profiles));
}

export default async function ReelSubmissionsPage() {
  const submissions = await getReelSubmissions();

  // Stats
  const stats = {
    total: submissions.length,
    pending: submissions.filter((s: any) => s.ambassador.entryChallenge.status === 'pending').length,
    approved: submissions.filter((s: any) => s.ambassador.entryChallenge.status === 'approved').length,
    rejected: submissions.filter((s: any) => s.ambassador.entryChallenge.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reel Submissions</h1>
          <p className="text-gray-600 mt-1">Review and approve ambassador entry challenge reels</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Submissions" value={stats.total} color="blue" />
        <StatCard label="Pending Review" value={stats.pending} color="yellow" />
        <StatCard label="Approved" value={stats.approved} color="green" />
        <StatCard label="Rejected" value={stats.rejected} color="red" />
      </div>

      {/* Table */}
      <ReelSubmissionsTable initialSubmissions={submissions} />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}
