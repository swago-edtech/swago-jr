import { connectDB, ContactSubmission } from '@swago/database';
import Link from 'next/link';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

async function getContactSubmissions() {
  await connectDB();
  
  const submissions = await ContactSubmission.find()
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(submissions));
}

// Subject label mapping
const subjectLabels: Record<string, string> = {
  product: 'Product Questions',
  order: 'Order Support',
  shipping: 'Shipping & Delivery',
  general: 'General Inquiry',
  other: 'Other',
};

export default async function ContactSubmissionsPage() {
  // Check admin session
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }

  const submissions = await getContactSubmissions();

  // Calculate stats
  const pendingCount = submissions.filter((s: any) => s.status === 'pending').length;
  const resolvedCount = submissions.filter((s: any) => s.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Submissions</h1>
          <p className="text-gray-600 mt-1">Manage customer inquiries and support requests</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {submissions.length} submissions
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Submissions</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{submissions.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Resolved</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{resolvedCount}</p>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message Preview
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No contact submissions found
                  </td>
                </tr>
              ) : (
                submissions.map((submission: any) => (
                  <tr key={submission._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {submission.firstName} {submission.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{submission.email}</div>
                        <div className="text-xs text-gray-500">{submission.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {subjectLabels[submission.subject] || submission.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-2 max-w-md">
                        {submission.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={submission.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(submission.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(submission.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/contact/${submission._id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    resolved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Resolved' },
  };

  const statusConfig = config[status] || config.pending;

  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
      {statusConfig.label}
    </span>
  );
}
