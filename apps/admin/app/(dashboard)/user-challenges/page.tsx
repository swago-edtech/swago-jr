import { connectDB, User } from '@swago/database';
import Link from 'next/link';
import ChallengeFilters from './ChallengeFilters';
import Pagination from '@/components/Pagination';
import { Video, Brain, Ticket } from 'lucide-react';

async function getChallengeProfiles(searchParams: { [key: string]: string | undefined }) {
  await connectDB();

  const query: any = {};

  // Text Search — search by name, phone or email directly on User
  if (searchParams.q) {
    const searchRegex = new RegExp(searchParams.q, 'i');
    query.$or = [
      { name: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
    ];
  }

  // Status Filter
  if (searchParams.status) {
    switch (searchParams.status) {
      case 'completed':
        query['ambassador.entryChallenge.status'] = 'approved';
        query['ambassador.brainGym.completed'] = true;
        break;
      case 'pending_reel':
        query['ambassador.entryChallenge.status'] = { $ne: 'approved' };
        break;
      case 'pending_brain_gym':
        query['ambassador.brainGym.completed'] = { $ne: true };
        break;
      case 'brand_ambassador':
        query['ambassador.status'] = 'brand_ambassador';
        break;
    }
  }

  // Sort Filter
  let sortConfig: any = { createdAt: -1 };
  if (searchParams.sort) {
    switch (searchParams.sort) {
      case 'oldest':
        sortConfig = { createdAt: 1 };
        break;
      case 'highest_sd':
        sortConfig = { 'ambassador.swagoMoney': -1 };
        break;
      case 'newest':
      default:
        sortConfig = { createdAt: -1 };
        break;
    }
  }

  const page = parseInt(searchParams.page || '1', 10) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const [users, totalCount] = await Promise.all([
    User.find(query)
      .sort(sortConfig)
      .skip(skip)
      .limit(limit)
      .select('name phone email age gender grade avatar ambassador lotteryTickets')
      .lean(),
    User.countDocuments(query)
  ]);

  return {
    profiles: JSON.parse(JSON.stringify(users)),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    }
  };
}

export default async function UserChallengesPage(props: { searchParams?: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = (await props.searchParams) || {};
  const { profiles, pagination } = await getChallengeProfiles(searchParams);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Challenges</h1>
          <p className="text-gray-600 mt-1">Track user progress across Reels, Brain Gym, and Lottery.</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {pagination.totalCount} records
        </div>
      </div>

      <ChallengeFilters />

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent Info
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Challenge Progress Timeline
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total SD
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No challenge tracking records found.
                  </td>
                </tr>
              ) : (
                profiles.map((profile: any) => {
                  const entryStatus = profile.ambassador?.entryChallenge?.status || 'not_submitted';
                  const brainGymCompleted = profile.ambassador?.brainGym?.completed || false;
                  const lotteryCount = profile.lotteryTickets?.length || 0;
                  const swagoMoney = profile.ambassador?.swagoMoney || 0;

                  return (
                    <tr key={profile._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">
                            {profile.avatar || '👤'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">{profile.name || 'Unnamed'}</div>
                            <div className="text-xs text-gray-500">{profile.age ? `Age: ${profile.age}` : ''} {profile.grade ? `• Grade: ${profile.grade}` : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{profile.phone || 'No phone'}</div>
                        {profile.email && <div className="text-xs text-gray-500">{profile.email}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <ProgressTimeline 
                          entryStatus={entryStatus} 
                          brainGymCompleted={brainGymCompleted} 
                          lotteryCount={lotteryCount} 
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">
                          {swagoMoney} SD
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination 
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
      />
    </div>
  );
}

function ProgressTimeline({ entryStatus, brainGymCompleted, lotteryCount }: any) {
  const steps = [
    {
      id: 'reel',
      label: 'Reel',
      status: entryStatus === 'approved' ? 'completed' : entryStatus === 'pending' ? 'in_progress' : entryStatus === 'rejected' ? 'failed' : 'pending',
      icon: Video,
      value: entryStatus === 'approved' ? 'Approved' : entryStatus === 'pending' ? 'Reviewing' : entryStatus === 'rejected' ? 'Rejected' : 'Not Submitted'
    },
    {
      id: 'braingym',
      label: 'Brain Gym',
      status: brainGymCompleted ? 'completed' : 'pending',
      icon: Brain,
      value: brainGymCompleted ? 'Completed' : 'Pending'
    },
    {
      id: 'lottery',
      label: 'Lottery',
      status: lotteryCount > 0 ? 'completed' : 'pending',
      icon: Ticket,
      value: `${lotteryCount} Ticket${lotteryCount !== 1 ? 's' : ''}`
    }
  ];

  return (
    <div className="flex items-center justify-center w-full min-w-[300px] max-w-md mx-auto py-2">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = step.status === 'completed';
        const isInProgress = step.status === 'in_progress';
        const isFailed = step.status === 'failed';
        
        let bgColor = 'bg-gray-100 border-gray-200';
        let iconColor = 'text-gray-400';
        let textColor = 'text-gray-500';

        if (isCompleted) {
          bgColor = 'bg-green-500 border-green-500 shadow-green-500/20 shadow-lg';
          iconColor = 'text-white';
          textColor = 'text-green-600';
        } else if (isInProgress) {
          bgColor = 'bg-amber-500 border-amber-500 shadow-amber-500/20 shadow-lg';
          iconColor = 'text-white';
          textColor = 'text-amber-600';
        } else if (isFailed) {
          bgColor = 'bg-red-500 border-red-500 shadow-red-500/20 shadow-lg';
          iconColor = 'text-white';
          textColor = 'text-red-600';
        }

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2 w-20">
              <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center z-10 transition-all ${bgColor}`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap text-black">{step.label}</span>
                <span className={`text-[10px] font-bold whitespace-nowrap ${textColor}`}>{step.value}</span>
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 h-1 rounded-full bg-gray-100 relative -mt-8">
                 <div className={`absolute top-0 left-0 h-full transition-all duration-500 ${isCompleted ? 'w-full bg-green-400' : 'w-0'}`}></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
