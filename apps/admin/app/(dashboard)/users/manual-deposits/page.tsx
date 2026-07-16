import { connectDB, User, Order } from '@swago/database';
import ManualDepositClient from './ManualDepositClient';

export default async function ManualDepositsPage(props: { searchParams?: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = (await props.searchParams) || {};
  await connectDB();
  
  const query: any = { $and: [{ isAdmin: false }] };

  if (searchParams.q) {
    const searchRegex = new RegExp(searchParams.q, 'i');
    query.$and.push({
      $or: [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
      ]
    });
  }

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .select('name phone email ambassador createdAt')
    .lean();

  // Backfill names from orders if missing
  const enrichedUsers = await Promise.all(
    users.map(async (user: any) => {
      if (!user.name && user.phone) {
        const recentOrder = await Order.findOne({ phone: user.phone })
          .sort({ createdAt: -1 })
          .select('name')
          .lean();
        
        if (recentOrder && (recentOrder as any).name) {
          user.name = (recentOrder as any).name;
        }
      }
      return user;
    })
  );

  const serializedUsers = JSON.parse(JSON.stringify(enrichedUsers));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manual Deposits</h1>
        <p className="text-gray-600 mt-1">Directly credit Swago Money to customer wallets</p>
      </div>
      <ManualDepositClient initialUsers={serializedUsers} searchQuery={searchParams.q || ''} />
    </div>
  );
}
