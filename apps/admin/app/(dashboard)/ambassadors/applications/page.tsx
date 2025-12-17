import { connectDB, AmbassadorApplication } from '@swago/database';
import AmbassadorApplicationsTable from '@/components/AmbassadorApplicationsTable';
import Link from 'next/link';
import { Download } from 'lucide-react';

async function getApplications() {
  await connectDB();
  
  const applications = await AmbassadorApplication.find()
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(applications));
}

export default async function AmbassadorApplicationsPage() {
  const applications = await getApplications();

  // Stats
  const stats = {
    total: applications.length,
    pending: applications.filter((a: any) => a.status === 'pending').length,
    underReview: applications.filter((a: any) => a.status === 'under_review').length,
    shortlisted: applications.filter((a: any) => a.status === 'shortlisted').length,
    selected: applications.filter((a: any) => a.status === 'selected').length,
    rejected: applications.filter((a: any) => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ambassador Applications</h1>
          <p className="text-gray-600 mt-1">Manage kid ambassador program applications</p>
        </div>
        <a
          href="/api/ambassadors/applications/export"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total" value={stats.total} color="blue" />
        <StatCard label="Pending" value={stats.pending} color="yellow" />
        <StatCard label="Under Review" value={stats.underReview} color="purple" />
        <StatCard label="Shortlisted" value={stats.shortlisted} color="indigo" />
        <StatCard label="Selected" value={stats.selected} color="green" />
        <StatCard label="Rejected" value={stats.rejected} color="red" />
      </div>

      {/* Table */}
      <AmbassadorApplicationsTable initialApplications={applications} />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    purple: 'bg-purple-50 text-purple-700',
    indigo: 'bg-indigo-50 text-indigo-700',
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
