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
    winners?: Array<{
        kidName: string;
        ticketCode: string;
    }>;
    createdAt: string;
};

type Summary = {
    total: number;
    open: number;
    closed: number;
    drawn: number;
};

const STATUS_COLORS = {
    open: "text-[#10b981] border-[#10b981]/20 bg-[#10b981]/5",
    closed: "text-[#f59e0b] border-[#f59e0b]/20 bg-[#f59e0b]/5",
    drawn: "text-[#6366f1] border-[#6366f1]/20 bg-[#6366f1]/5",
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
    
    // Custom Draw State
    const [showCustomDraw, setShowCustomDraw] = useState(false);
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [customWinnerCount, setCustomWinnerCount] = useState<number | "">(3);
    const [creatingCustomDraw, setCreatingCustomDraw] = useState(false);

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

    // Create Custom Draw
    const handleCreateCustomDraw = async () => {
        if (!customStartDate || !customEndDate || !customWinnerCount) {
            alert("Please fill all custom draw fields.");
            return;
        }

        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        
        if (start >= end) {
            alert("Start Date must be before End Date.");
            return;
        }

        try {
            setCreatingCustomDraw(true);
            const res = await fetch("/api/lottery-draws/custom", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                    winnerCount: Number(customWinnerCount)
                })
            });
            const data = await res.json();

            if (data.success) {
                alert(`Custom draw created! Automatically selected ${data.selectedTicketCodes.length} winners. You will now be redirected to credit them.`);
                router.push(`/lottery-draws/${data.draw._id}?preselect=${data.selectedTicketCodes.join(',')}`);
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error("Error creating custom draw:", error);
            alert("Failed to create custom draw");
        } finally {
            setCreatingCustomDraw(false);
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-[#0f172a]">Lottery Winners</h3>
                    <p className="text-sm font-medium text-[#64748b] mt-1">
                        Manage weekly lottery draws or run <span className="text-[#6366f1] font-bold">custom draws</span>.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowCustomDraw(!showCustomDraw)}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition font-semibold shadow-sm text-sm"
                    >
                        {showCustomDraw ? "Cancel Custom Draw" : "Run Custom Draw"}
                    </button>
                    <button
                        onClick={handleCreateDraw}
                        disabled={creatingDraw}
                        className="px-6 py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-sm shadow-[#6366f1]/20 hover:shadow-md hover:shadow-[#6366f1]/30 text-sm font-semibold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {creatingDraw ? "Creating..." : "+ Setup Weekly Draw"}
                    </button>
                </div>
            </div>

            {/* Custom Draw Panel */}
            {showCustomDraw && (
                <div className="bg-[#ffffff]/60 shadow-sm backdrop-blur-xl rounded-2xl border border-[#e2e8f0]/80 p-6 transition-all duration-300">
                    <h2 className="text-[17px] font-bold text-[#0f172a] mb-4">✨ Run a Custom Lottery Draw</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-tight mb-2">Start Date</label>
                            <input
                                type="date"
                                value={customStartDate}
                                max={customEndDate || undefined}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[15px] font-medium text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#6366f1] transition shadow-inner"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-tight mb-2">End Date</label>
                            <input
                                type="date"
                                value={customEndDate}
                                min={customStartDate || undefined}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[15px] font-medium text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#6366f1] transition shadow-inner"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-tight mb-2">Number of Winners</label>
                            <input
                                type="number"
                                min="1"
                                value={customWinnerCount}
                                onChange={(e) => setCustomWinnerCount(e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[15px] font-medium text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#6366f1] transition shadow-inner"
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleCreateCustomDraw}
                            disabled={creatingCustomDraw}
                            className="px-6 py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-sm shadow-[#6366f1]/20 hover:shadow-md text-sm font-semibold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {creatingCustomDraw ? "Generating..." : "Generate Winners →"}
                        </button>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Draws", value: summary.total },
                    { label: "Open", value: summary.open },
                    { label: "Closed", value: summary.closed },
                    { label: "Winners Selected", value: summary.drawn },
                ].map((stat, i) => (
                    <div key={i} className="bg-[#ffffff]/60 shadow-sm backdrop-blur-xl rounded-2xl border border-[#e2e8f0]/80 p-5">
                        <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-tight mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-[#0f172a]">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-[#ffffff]/60 shadow-sm backdrop-blur-xl rounded-2xl border border-[#e2e8f0]/80 p-5 lg:p-6 transition-all duration-300">
                {/* Filters */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 inline-flex items-center">
                        <p className="text-[#64748b] text-[13px] font-medium">
                            <span className="font-bold text-[#6366f1]">🎟️ Draw Window:</span> Wed 8:00 PM → Next Wed 8:00 PM
                            <span className="mx-3 opacity-30">|</span>
                            <span className="font-bold text-[#6366f1]">🏆 Winner Selection:</span> Fri 7:00 PM (Manual)
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-4 pr-10 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[13px] font-semibold text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#6366f1] transition appearance-none cursor-pointer"
                            >
                                <option value="">All Statuses</option>
                                <option value="open">Open</option>
                                <option value="closed">Closed</option>
                                <option value="drawn">Winner Selected</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748b]">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                        </div>
                        {statusFilter && (
                            <button
                                onClick={() => setStatusFilter("")}
                                className="text-[13px] font-semibold text-[#64748b] hover:text-[#0f172a] transition"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Draws Table */}
                <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6366f1] mx-auto"></div>
                            <p className="text-[#64748b] text-sm mt-4 font-medium">Loading draws...</p>
                        </div>
                    ) : draws.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center mb-5 text-2xl">
                                🎟️
                            </div>
                            <h3 className="text-[17px] font-semibold text-[#0f172a] mb-2.5">No draws found</h3>
                            <p className="text-sm font-medium text-[#64748b] mb-8 max-w-md leading-relaxed">
                                Get started by creating a weekly or custom lottery draw above.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                                    <th className="px-5 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest">Draw #</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest">Period</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest">Draw Date</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest">Tickets</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest">Status</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest">Winner</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e2e8f0]">
                                {draws.map((draw) => {
                                    const winnersList = draw.winners?.length ? draw.winners : (draw.winner ? [draw.winner] : []);
                                    return (
                                        <tr key={draw._id} className="hover:bg-[#f8fafc]/50 transition-colors group">
                                            <td className="px-5 py-4">
                                                <span className="text-[13px] font-bold text-[#0f172a]">
                                                    {draw.drawNumber}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-[13px] font-semibold text-[#475569]">{formatDate(draw.startDate)}</div>
                                                <div className="text-[11px] font-medium text-[#94a3b8] mt-0.5">→ {formatDate(draw.endDate)}</div>
                                            </td>
                                            <td className="px-5 py-4 text-[13px] font-semibold text-[#475569]">
                                                {formatDate(draw.drawDate)}
                                            </td>
                                            <td className="px-5 py-4 text-[13px] font-black text-[#0f172a]">
                                                {draw.totalTickets}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-sm ${STATUS_COLORS[draw.status]}`}>
                                                    {STATUS_LABELS[draw.status]}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                {winnersList.length > 0 ? (
                                                    <div>
                                                        <p className="text-[13px] font-bold text-[#10b981]">
                                                            🏆 {winnersList.length} Winner(s)
                                                        </p>
                                                        <p className="text-[11px] font-medium text-[#64748b] mt-0.5">
                                                            {winnersList[0].kidName}
                                                            {winnersList.length > 1 ? ` +${winnersList.length - 1} more` : ""}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[13px] text-[#94a3b8]">-</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => router.push(`/lottery-draws/${draw._id}`)}
                                                    className="text-[13px] font-bold text-[#6366f1] hover:text-[#4f46e5] transition"
                                                >
                                                    {draw.status === "drawn" ? "View Details" : "Select Winner"} →
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
