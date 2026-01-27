"use client";

import { useState, useEffect, use } from "react";
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
        announcedBy: string;
    };
};

export default function LotteryDrawDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [draw, setDraw] = useState<Draw | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selecting, setSelecting] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<string>("");

    // Fetch draw details
    const fetchDraw = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/lottery-draws/${id}`);
            const data = await res.json();

            if (data.success) {
                setDraw(data.draw);
                setTickets(data.tickets);
            }
        } catch (error) {
            console.error("Error fetching draw:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDraw();
    }, [id]);

    // Select winner
    const handleSelectWinner = async (ticketCode: string) => {
        if (!confirm(`Are you sure you want to select ticket ${ticketCode} as the winner?`)) {
            return;
        }

        try {
            setSelecting(true);
            setSelectedTicket(ticketCode);

            const res = await fetch(`/api/lottery-draws/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticketCode,
                    adminEmail: "admin@swagojr.com", // TODO: Get from session
                }),
            });

            const data = await res.json();

            if (data.success) {
                alert("🎉 Winner selected successfully!");
                fetchDraw();
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error("Error selecting winner:", error);
            alert("Failed to select winner");
        } finally {
            setSelecting(false);
            setSelectedTicket("");
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

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading draw details...</p>
            </div>
        );
    }

    if (!draw) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-600">Draw not found</p>
                <button
                    onClick={() => router.push("/lottery-draws")}
                    className="mt-4 text-blue-600 hover:underline"
                >
                    ← Back to Draws
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => router.push("/lottery-draws")}
                        className="text-sm text-gray-600 hover:text-gray-900 mb-2"
                    >
                        ← Back to Draws
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">{draw.drawNumber}</h1>
                    <p className="text-gray-600 mt-1">
                        {formatDate(draw.startDate)} → {formatDate(draw.endDate)}
                    </p>
                </div>
                <div>
                    <span
                        className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${draw.status === "drawn"
                                ? "bg-blue-100 text-blue-800"
                                : draw.status === "open"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }`}
                    >
                        {draw.status === "drawn"
                            ? "Winner Selected"
                            : draw.status === "open"
                                ? "Open"
                                : "Closed"}
                    </span>
                </div>
            </div>

            {/* Winner Card (if drawn) */}
            {draw.winner && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="text-6xl">🏆</div>
                        <div>
                            <h2 className="text-2xl font-bold">Winner: {draw.winner.kidName}</h2>
                            <p className="text-white/90 mt-1">
                                Ticket: <span className="font-mono">{draw.winner.ticketCode}</span>
                            </p>
                            <p className="text-white/80 text-sm mt-1">
                                Product: {draw.winner.ticketProductName}
                            </p>
                            <p className="text-white/80 text-sm">
                                Parent: {draw.winner.parentPhone || draw.winner.parentEmail}
                            </p>
                            <p className="text-white/60 text-xs mt-2">
                                Announced: {formatDate(draw.winner.announcedAt)} by {draw.winner.announcedBy}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">Total Tickets</p>
                    <p className="text-3xl font-bold text-gray-900">{tickets.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">Draw Date</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(draw.drawDate)}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{draw.status}</p>
                </div>
            </div>

            {/* Eligible Tickets Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Eligible Tickets ({tickets.length})
                    </h2>
                    <p className="text-sm text-gray-600">
                        {draw.status === "drawn"
                            ? "The winner has been selected from these tickets"
                            : "Click 'Select as Winner' to choose the winning ticket"}
                    </p>
                </div>

                {tickets.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-600">No tickets found in this draw period</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                        Ticket Code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                        Kid Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                        Parent Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                        Redeemed At
                                    </th>
                                    {draw.status !== "drawn" && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                            Action
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {tickets.map((ticket) => (
                                    <tr
                                        key={ticket._id}
                                        className={`hover:bg-gray-50 ${draw.winner?.ticketCode === ticket.code
                                                ? "bg-yellow-50"
                                                : ""
                                            }`}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm font-semibold">
                                                {ticket.code}
                                            </span>
                                            {draw.winner?.ticketCode === ticket.code && (
                                                <span className="ml-2 text-yellow-600">🏆</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {ticket.productName}
                                            <span className="ml-2 text-gray-500">({ticket.shortForm})</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            {ticket.kidProfile?.name || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {ticket.parent?.phone || ticket.parent?.email || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatDate(ticket.redeemedAt)}
                                        </td>
                                        {draw.status !== "drawn" && (
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleSelectWinner(ticket.code)}
                                                    disabled={selecting}
                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                                                >
                                                    {selecting && selectedTicket === ticket.code
                                                        ? "Selecting..."
                                                        : "Select as Winner"}
                                                </button>
                                            </td>
                                        )}
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
