export default function AmbassadorHowToApplySection() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-slate-800 text-center mb-12">
        How to Become a Swago Kid Ambassador
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Step 1 */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-pink))] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            1
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-3">Show Us Your Superpower</h3>
          <p className="text-slate-600">
            Create a short video showing your superpower. Use the <strong>Swago song</strong>, tag Swago, and post with the official hashtag.
          </p>
        </div>

        {/* Step 2 */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[hsl(var(--swago-teal))] to-[hsl(var(--swago-purple))] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            2
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-3">Join Game Time Sessions</h3>
          <p className="text-slate-600">
            Selected kids join fun <strong>Game Time & Brain Gym sessions</strong> to play, participate, and compete.
          </p>
        </div>

        {/* Step 3 */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[hsl(var(--swago-orange))] to-[hsl(var(--swago-pink))] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            3
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-3">Get Shortlisted</h3>
          <p className="text-slate-600">
            Based on <strong>creativity, confidence, and participation</strong>, kids get shortlisted and selected.
          </p>
        </div>
      </div>
    </div>
  );
}
