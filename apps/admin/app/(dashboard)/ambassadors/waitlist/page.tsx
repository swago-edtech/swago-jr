import { connectDB, Waitlist } from '@swago/database';
import WaitlistTable from '@/components/WaitlistTable';
import { Download } from 'lucide-react';

async function getWaitlist() {
  await connectDB();
  
  const waitlist = await Waitlist.find()
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(waitlist));
}

export default async function WaitlistPage() {
  const waitlist = await getWaitlist();

  const stats = {
    total: waitlist.length,
    notified: waitlist.filter((w: any) => w.notified).length,
    pending: waitlist.filter((w: any) => !w.notified).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ambassador Waitlist</h1>
          <p className="text-gray-600 mt-1">Manage waitlist entries</p>
        </div>
        <a
          href="/api/ambassadors/waitlist/export"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Entries</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Not Notified</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Notified</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{stats.notified}</p>
        </div>
      </div>

      {/* Table */}
      <WaitlistTable initialWaitlist={waitlist} />
    </div>
  );
}
