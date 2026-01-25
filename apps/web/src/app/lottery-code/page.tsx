// // apps/web/src/app/lottery/page.tsx

// "use client";

// import { useState } from "react";
// import { motion } from "framer-motion";
// import LotteryBanner from "@/components/lottery/LotteryBanner";
// import CountdownTimer from "@/components/lottery/CountdownTimer";
// import WinnersSection from "@/components/lottery/WinnersSection";
// import SelectionPhase from "@/components/lottery/SelectionPhase";
// import ClaimPhase from "@/components/lottery/ClaimPhase";
// import SuccessModal from "@/components/lottery/SuccessModal";
// import Link from "next/link";

// type Phase = 'selection' | 'claim';

// interface ClaimSuccessData {
//   ticket: {
//     code: string;
//     ticketType: string;
//     productName: string;
//     swagoMoneyEarned: number;
//   };
//   kidProfile: {
//     name: string;
//     newBalance: number;
//     totalTickets: number;
//   };
// }

// export default function LotteryPage() {
//   const [phase, setPhase] = useState<Phase>('selection');
//   const [selectedTicket, setSelectedTicket] = useState<'SSR' | 'SDC' | null>(null);
//   const [selectedKid, setSelectedKid] = useState<string | null>(null);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [successData, setSuccessData] = useState<ClaimSuccessData | null>(null);

//   const handleSelectionNext = (ticketType: 'SSR' | 'SDC', kidProfileId: string) => {
//     setSelectedTicket(ticketType);
//     setSelectedKid(kidProfileId);
//     setPhase('claim');
//   };

//   const handleClaimBack = () => {
//     setPhase('selection');
//   };

//   const handleClaimSuccess = (data: ClaimSuccessData) => {
//     setSuccessData(data);
//     setShowSuccessModal(true);
//   };

  


//   const handleModalClose = () => {
//     setShowSuccessModal(false);
//     // Reset to selection phase
//     setPhase('selection');
//     setSelectedTicket(null);
//     setSelectedKid(null);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
//       <div className="max-w-full mx-auto">

//         {/* My Tickets Link
//         <div className="flex justify-end mb-6">
//           <Link
//             href="/lottery-code/my-tickets"
//             className="flex items-center gap-2 bg-white text-[hsl(var(--swago-purple))] px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
//           >
//             <span>🎟️</span>
//             <span>My Tickets</span>
//           </Link>
//         </div>
//          */}

//         {/* Header */}
//         <LotteryBanner />

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Left Column: Main Content */}
//           <div className="lg:col-span-2">
//             {/* Countdown 
//             <CountdownTimer />
//             */}

//             {/* Phase Content */}
//             <motion.div
//               key={phase}
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               transition={{ duration: 0.3 }}
//             >
//               {phase === 'selection' && (
//                 <SelectionPhase onNext={handleSelectionNext} />
//               )}

//               {phase === 'claim' && selectedTicket && selectedKid && (
//                 <ClaimPhase
//                   ticketType={selectedTicket}
//                   kidProfileId={selectedKid}
//                   onBack={handleClaimBack}
//                   onSuccess={handleClaimSuccess}
//                 />
//               )}
//             </motion.div>
//           </div>

//           {/* Right Column: Winners */}
//           <div className="lg:col-span-1">
//             <WinnersSection />
//           </div>
//         </div>
//       </div>

//       {/* Success Modal */}
//       {successData && (
//         <SuccessModal
//           isOpen={showSuccessModal}
//           onClose={handleModalClose}
//           data={successData}
//         />
//       )}
//     </div>
//   );
// }


// apps/web/src/app/lottery/page.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import LotteryBanner from "@/components/lottery/LotteryBanner";
import WinnersSection from "@/components/lottery/WinnersSection";
import SelectionPhase from "@/components/lottery/SelectionPhase";
import ClaimPhase from "@/components/lottery/ClaimPhase";
import SuccessModal from "@/components/lottery/SuccessModal";

type Phase = "selection" | "claim";

interface ClaimSuccessData {
  ticket: {
    code: string;
    ticketType: string;
    productName: string;
    swagoMoneyEarned: number;
  };
  kidProfile: {
    name: string;
    newBalance: number;
    totalTickets: number;
  };
}

export default function LotteryPage() {
  const [phase, setPhase] = useState<Phase>("selection");
  const [selectedTicket, setSelectedTicket] = useState<"SSR" | "SDC" | null>(null);
  const [selectedKid, setSelectedKid] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<ClaimSuccessData | null>(null);

  const handleSelectionNext = (ticketType: "SSR" | "SDC", kidProfileId: string) => {
    setSelectedTicket(ticketType);
    setSelectedKid(kidProfileId);
    setPhase("claim");
  };

  const handleClaimBack = () => {
    setPhase("selection");
  };

  //TEMPORARY RELAXED BOUNDARY — THIS IS THE KEY FIX
  const handleClaimSuccess = (data: unknown) => {
    setSuccessData(data as ClaimSuccessData);
    setShowSuccessModal(true);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    setPhase("selection");
    setSelectedTicket(null);
    setSelectedKid(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <LotteryBanner />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            <motion.div
              key={phase}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {phase === "selection" && (
                <SelectionPhase onNext={handleSelectionNext} />
              )}

              {phase === "claim" && selectedTicket && selectedKid && (
                <ClaimPhase
                  ticketType={selectedTicket}
                  kidProfileId={selectedKid}
                  onBack={handleClaimBack}
                  onSuccess={handleClaimSuccess}   // now matches (unknown) boundary
                />
              )}
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1">
            <WinnersSection />
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {successData && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={handleModalClose}
          data={successData}
        />
      )}
    </div>
  );
}
