"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Draw = {
    _id: string;
    drawNumber: string;
    startDate: string;
    endDate: string;
    drawDate: string;
    status: "open" | "closed" | "drawn";
    totalTickets: number;
    winner?: {
        kidName: string;
        ticketCode: string;
        ticketProductName: string;
        parentPhone: string;
        parentEmail: string;
        announcedAt: string;
    };
    createdAt: string;
};

type Summary = {
    total: number;
    open: number;
    closed: number;
    drawn: number;
};

const STATUS_COLORS = {
    open: "bg-green-100 text-green-800 border-green-300",
    closed: "bg-yellow-100 text-yellow-800 border-yellow-300",
    drawn: "bg-blue-100 text-blue-800 border-blue-300",
};

const STATUS_LABELS = {
    open: "Open",
    closed: "Closed",
    drawn: "Winner Selected",
};

export default function LotteryDrawsPage() {
    const router = useRouter();
    const [draws, setDraws] = useState<Draw[]>([]);
    const [summary, setSummary] = useState<Summary>({
        total: 0,
        open: 0,
        closed: 0,
        drawn: 0,
    });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [creatingDraw, setCreatingDraw] = useState(false);

    // Fetch draws
    const fetchDraws = async () => {
        try {
            setLoading(true);
            const url = statusFilter
                ? `/api/lottery-draws?status=${statusFilter}`
                : "/api/lottery-draws";

            const res = await fetch(url);
            const data = await res.json();

            if (data.success) {
                setDraws(data.draws);
                setSummary(data.summary);
            }
        } catch (error) {
            console.error("Error fetching draws:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDraws();
    }, [statusFilter]);

    // Create new draw
    const handleCreateDraw = async () => {
        try {
            setCreatingDraw(true);
            const res = await fetch("/api/lottery-draws", { method: "POST" });
            const data = await res.json();

            if (data.success) {
                alert(data.message || "Draw created/found successfully!");
                fetchDraws();
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error("Error creating draw:", error);
            alert("Failed to create draw");
        } finally {
            setCreatingDraw(false);
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Lottery Weekly Winners</h1>
                    <p className="text-gray-600 mt-1">
                        Manage weekly lottery draws (Thursday 7PM → Thursday 7PM)
                    </p>
                </div>
                <button
                    onClick={handleCreateDraw}
                    disabled={creatingDraw}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold shadow-lg disabled:opacity-50"
                >
                    {creatingDraw ? "Creating..." : "+ Setup New Weekly Draw"}
                </button>
            </div>

            {/* Info Banner */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-purple-900 text-sm">
                    <span className="font-semibold">🎟️ Draw Window:</span> Thursday 7PM IST → Next Thursday 7PM IST
                    <br />
                    <span className="font-semibold">🏆 Winner Selection:</span> Friday 7PM IST (Manual by Admin)
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4 border-t-4 border-gray-400">
                    <p className="text-sm text-gray-600">Total Draws</p>
                    <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border-t-4 border-green-400">
                    <p className="text-sm text-gray-600">Open</p>
                    <p className="text-3xl font-bold text-green-600">{summary.open}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border-t-4 border-yellow-400">
                    <p className="text-sm text-gray-600">Closed</p>
                    <p className="text-3xl font-bold text-yellow-600">{summary.closed}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border-t-4 border-blue-400">
                    <p className="text-sm text-gray-600">Winners Selected</p>
                    <p className="text-3xl font-bold text-blue-600">{summary.drawn}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-black focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                        <option value="drawn">Winner Selected</option>
                    </select>
                    {statusFilter && (
                        <button
                            onClick={() => setStatusFilter("")}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Clear Filter
                        </button>
                    )}
                </div>
            </div>

            {/* Draws Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-4">Loading draws...</p>
                    </div>
                ) : draws.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🎟️</span>
                        </div>
                        <p className="text-gray-600 font-medium">No draws found</p>
                        <p className="text-gray-500 text-sm mt-1">
                            Create a draw to get started
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                        Draw #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                        Period
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                        Draw Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                        Tickets
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                        Winner
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {draws.map((draw) => (
                                    <tr key={draw._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm font-semibold text-blue-600">
                                                {draw.drawNumber}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div>{formatDate(draw.startDate)}</div>
                                            <div className="text-gray-400">→ {formatDate(draw.endDate)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {formatDate(draw.drawDate)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                                            {draw.totalTickets}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[draw.status]}`}>
                                                {STATUS_LABELS[draw.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {draw.winner ? (
                                                <div className="text-sm">
                                                    <p className="font-semibold text-green-700">🏆 {draw.winner.kidName}</p>
                                                    <p className="text-gray-500 text-xs">{draw.winner.ticketCode}</p>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => router.push(`/lottery-draws/${draw._id}`)}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                            >
                                                {draw.status === "drawn" ? "View Details" : "Select Winner"}
                                            </button>
                                        </td>
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
