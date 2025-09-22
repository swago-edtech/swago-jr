import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        {/* New: Button to navigate to the orders page */}
        <Link 
          href="/admin/orders" 
          className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          View All Orders
        </Link>
      </div>
      <p className="mt-4">Welcome to the admin area. Dynamic stats will be added here soon!</p>
    </div>
  );
}