export default function AmbassadorEligibilitySection() {
  return (
    <div className="bg-slate-50 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Eligibility */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-[hsl(var(--swago-purple))] mb-3">Who Can Apply?</h3>
            <ul className="space-y-2 text-slate-600">
              <li>✓ Kids aged <strong>7-14 years</strong></li>
              <li>✓ Curious, creative, eager to learn</li>
              <li>✓ No prior experience needed</li>
              <li>✓ Open to kids across India</li>
            </ul>
          </div>

          {/* Duration */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-[hsl(var(--swago-teal))] mb-3">Program Duration</h3>
            <p className="text-slate-600">
              <strong className="text-2xl text-slate-800">3-6 months</strong><br />
              ambassador journey
            </p>
          </div>

          {/* Time Commitment */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-[hsl(var(--swago-orange))] mb-3">Time Commitment</h3>
            <p className="text-slate-600">
              Approx. <strong className="text-2xl text-slate-800">1-2 hours</strong><br />
              per week<br />
              <span className="text-sm">Fun, flexible, and online</span>
            </p>
          </div>

          {/* Not Selected Benefits */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-[hsl(var(--swago-pink))] mb-3">If Not Selected?</h3>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>🎁 Free Swago masterclass</li>
              <li>📘 Swago Skills PDF guide</li>
              <li>💸 Special discount coupons</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
