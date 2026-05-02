// apps/web/src/app/lottery-code/my-tickets/page.tsx

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

interface Ticket {
  codeId: string;
  code: string;
  productName: string;
  shortForm: string;
  ticketType: string;
  swagoMoneyEarned: number;
  redeemedAt: string;
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [swagoMoney, setSwagoMoney] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/lottery/my-tickets');
      const data = await res.json();

      if (res.ok) {
        setTickets(data.tickets || []);
        setSwagoMoney(data.swagoMoney || 0);
      } else {
        setError(data.error || 'Failed to load tickets');
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const getTicketIcon = (shortForm: string) => {
    return shortForm === 'SSR' ? '💎' : '🏆';
  };

  const getTicketColor = (shortForm: string) => {
    return shortForm === 'SSR'
      ? 'bg-purple-50 border-purple-200'
      : 'bg-orange-50 border-orange-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/lottery-code"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium mb-6 transition-colors group"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to Lottery
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-slate-800 mb-2">
            My Lottery Tickets
          </h1>
          <p className="text-slate-600">
            View all your claimed tickets for this week&apos;s draw
          </p>
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[hsl(var(--swago-purple))] text-white rounded-2xl p-6 mb-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Total Tickets</p>
              <p className="text-4xl font-black">{tickets.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90 mb-1">Swago Money</p>
              <p className="text-4xl font-black">{swagoMoney}</p>
            </div>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[hsl(var(--swago-purple))] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Loading tickets...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* No Tickets */}
        {!loading && !error && tickets.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <p className="text-6xl mb-4">🎟️</p>
            <p className="text-xl font-bold text-slate-800 mb-2">No tickets yet</p>
            <p className="text-slate-600 mb-6">
              Claim your first ticket by entering a box code
            </p>
            <Link
              href="/lottery-code"
              className="inline-block bg-[hsl(var(--swago-purple))] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all"
            >
              Claim Ticket
            </Link>
          </div>
        )}

        {/* Tickets List */}
        {!loading && !error && tickets.length > 0 && (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <motion.div
                key={ticket.codeId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl shadow-md p-6 border-2 ${getTicketColor(ticket.shortForm)}`}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Left: Ticket Info */}
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">{getTicketIcon(ticket.shortForm)}</span>
                    <div>
                      <p className="font-black text-lg text-slate-800">
                        {ticket.ticketType}
                      </p>
                      <p className="text-sm text-slate-600 mb-1">
                        {ticket.productName}
                      </p>
                      <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                        {ticket.code}
                      </code>
                    </div>
                  </div>

                  {/* Right: Rewards & Date */}
                  <div className="text-right">
                    <p className="text-sm text-slate-600 mb-1">Earned</p>
                    <p className="text-2xl font-black text-[hsl(var(--swago-orange))]">
                      +{ticket.swagoMoneyEarned}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(ticket.redeemedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
