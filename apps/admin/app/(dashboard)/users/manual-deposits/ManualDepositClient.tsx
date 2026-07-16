'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ManualDepositClient({ initialUsers, searchQuery }: { initialUsers: any[], searchQuery: string }) {
    const router = useRouter();
    const [search, setSearch] = useState(searchQuery);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [amount, setAmount] = useState<number | "">("");
    const [reason, setReason] = useState("");
    const [processing, setProcessing] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/users/manual-deposits?q=${encodeURIComponent(search)}`);
    };

    const handleDeposit = async () => {
        if (selectedUsers.length === 0) return alert("Select at least one user");
        if (!amount || Number(amount) <= 0) return alert("Enter a valid amount");
        if (!reason.trim()) return alert("Enter a reason for the deposit");

        if (!confirm(`Are you sure you want to deposit $${amount} to ${selectedUsers.length} user(s)?`)) return;

        setProcessing(true);
        try {
            const res = await fetch('/api/users/manual-deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userIds: selectedUsers,
                    amount: Number(amount),
                    reason: reason.trim()
                })
            });

            const data = await res.json();
            if (data.success) {
                alert(`Successfully deposited $${amount} to ${selectedUsers.length} user(s)! Emails have been sent.`);
                setSelectedUsers([]);
                setAmount("");
                setReason("");
                router.refresh();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred during deposit.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-1/2">
                    <input
                        type="text"
                        placeholder="Search users by name, email, or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                    <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition">
                        Search
                    </button>
                </form>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <input
                        type="number"
                        placeholder="Amount ($)"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                    <input
                        type="text"
                        placeholder="Reason (e.g. Winner)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="flex-1 md:w-48 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                    <button
                        onClick={handleDeposit}
                        disabled={processing || selectedUsers.length === 0}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition whitespace-nowrap"
                    >
                        {processing ? 'Processing...' : `Deposit (${selectedUsers.length})`}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedUsers(initialUsers.map(u => u._id));
                                        } else {
                                            setSelectedUsers([]);
                                        }
                                    }}
                                    checked={selectedUsers.length === initialUsers.length && initialUsers.length > 0}
                                />
                            </th>
                            <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Contact</th>
                            <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Current Balance</th>
                            <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {initialUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No users found matching your search.
                                </td>
                            </tr>
                        ) : (
                            initialUsers.map((user) => (
                                <tr key={user._id} className={`hover:bg-gray-50 transition-colors ${selectedUsers.includes(user._id) ? 'bg-blue-50/50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user._id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedUsers([...selectedUsers, user._id]);
                                                } else {
                                                    setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                                                }
                                            }}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{user.name || 'Anonymous'}</div>
                                        <div className="text-xs text-gray-500">ID: {user._id.slice(-6)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{user.phone || '-'}</div>
                                        <div className="text-xs text-gray-500">{user.email || 'No email'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                            ${user.ambassador?.swagoMoney || 0} SD
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
