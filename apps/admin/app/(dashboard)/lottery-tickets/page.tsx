"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Ticket = {
    _id: string;
    code: string;
    productName: string;
    shortForm: string;
    redeemedAt: string;
    kidProfile: {
        _id: string;
        name: string;
    } | null;
    parent: {
        name: string;
        phone: string;
        email: string;
    } | null;
};

export default function LotteryTicketsPage() {
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/lottery-tickets");
            const data = await res.json();

            if (data.success) {
                setTickets(data.tickets);
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const filteredTickets = tickets.filter(ticket =>
        ticket.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.kidProfile?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.parent?.phone?.includes(searchTerm) ||
        ticket.parent?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">All Redeemed Tickets</h1>
                <p className="text-gray-600 mt-1">View all lottery codes claimed by users</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
                <input
                    type="text"
                    placeholder="Search by code, kid name, product, or contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-4">Loading tickets...</p>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-600 font-medium">No tickets found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Kid Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Parent Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Redeemed At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredTickets.map((ticket) => (
                                    <tr key={ticket._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono text-sm text-black font-semibold">{ticket.code}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {ticket.productName}
                                            <span className="ml-2 text-xs text-gray-500">({ticket.shortForm})</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{ticket.kidProfile?.name || "-"}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {ticket.parent?.name}
                                            <div className="text-xs text-gray-400">
                                                {ticket.parent?.phone} {ticket.parent?.email && `| ${ticket.parent.email}`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(ticket.redeemedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
