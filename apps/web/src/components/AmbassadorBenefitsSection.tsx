import { 
  HiStar, 
  HiTrophy, 
  HiLightBulb, 
  HiGift, 
  HiSparkles, 
  HiUserGroup 
} from 'react-icons/hi2';

export default function AmbassadorBenefitsSection() {
  return (
    <div className="bg-slate-50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 text-center mb-12">
          How the Program Benefits Kids
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Benefit 1 */}
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-[hsl(var(--swago-purple))] mb-4">
              <HiStar className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">Real Recognition</h3>
            <p className="text-slate-600">
              Featured on <strong>Swago smart boxes, website, and brand campaigns</strong>
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-[hsl(var(--swago-teal))] mb-4">
              <HiTrophy className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">Industry Exposure</h3>
            <p className="text-slate-600">
              Value-providing sessions with <strong>industry leaders, creators, and influencers</strong>
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-[hsl(var(--swago-orange))] mb-4">
              <HiLightBulb className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">Exclusive Masterclasses</h3>
            <p className="text-slate-600">
              Special sessions focused on Swago&apos;s <strong>core future skills</strong>
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-[hsl(var(--swago-pink))] mb-4">
              <HiGift className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">Free Smart Box</h3>
            <p className="text-slate-600">
              Get <strong>1 Swago smart box of your choice</strong>, absolutely free
            </p>
          </div>

          {/* Benefit 5 */}
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-[hsl(var(--swago-purple))] mb-4">
              <HiSparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">Discounts & Rewards</h3>
            <p className="text-slate-600">
              Discount coupons + a <strong>personal referral code</strong> to earn Swago Money
            </p>
          </div>

          {/* Benefit 6 */}
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-[hsl(var(--swago-teal))] mb-4">
              <HiSparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">Brain Gym Growth</h3>
            <p className="text-slate-600">
              Fun challenges that improve <strong>confidence, thinking speed, and problem-solving</strong>
            </p>
          </div>

          {/* Benefit 7 */}
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow md:col-span-2 lg:col-span-3">
            <div className="text-[hsl(var(--swago-orange))] mb-4 flex justify-center">
              <HiUserGroup className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3 text-center">Co-Creation & Collaboration</h3>
            <p className="text-slate-600 text-center max-w-2xl mx-auto">
              Work with other kids and the Swago team to <strong>shape smart boxes and activities</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
