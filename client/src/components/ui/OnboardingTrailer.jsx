import { useState } from 'react';
import { HiPlus, HiShare, HiSparkles, HiArrowRight, HiX } from 'react-icons/hi';
import Button from './Button';

export default function OnboardingTrailer({ onClose }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "BECOME A CURATOR",
      desc: "TerraManhwa Collections allow you to group your favorite titles together. Whether it's 'All-Time GOATs' or 'Hidden Gem Isekais', the power to curate is yours.",
      icon: <HiSparkles className="text-terra-gold" size={40} />,
      visual: (
        <div className="relative w-full h-40 bg-terra-bg rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-terra-red/20 to-transparent animate-pulse" />
           <div className="flex -space-x-4">
              {[1,2,3].map(i => <div key={i} className="w-16 h-24 bg-terra-card border border-white/10 rounded-lg shadow-xl translate-y-4 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />)}
           </div>
        </div>
      )
    },
    {
      title: "ADD WITH ONE CLICK",
      desc: "Coming soon: Add any manhwa directly to your playlists from the Detail page or Profile. Mix genres, authors, and status to create the perfect reading list.",
      icon: <HiPlus className="text-blue-400" size={40} />,
      visual: (
        <div className="relative w-full h-40 bg-terra-bg rounded-2xl border border-white/5 flex items-center justify-center">
           <div className="w-12 h-12 rounded-full bg-terra-red flex items-center justify-center text-white shadow-lg shadow-terra-red/40 animate-ping absolute" />
           <div className="w-12 h-12 rounded-full bg-terra-red flex items-center justify-center text-white relative z-10">
              <HiPlus size={24} />
           </div>
        </div>
      )
    },
    {
      title: "SHARE WITH THE WORLD",
      desc: "Publish your collections to the Community Hub. Watch as your views grow and others heart your taste. Influence the next generation of readers.",
      icon: <HiShare className="text-green-400" size={40} />,
      visual: (
        <div className="relative w-full h-40 bg-terra-bg rounded-2xl border border-white/5 flex items-center justify-center">
           <div className="flex gap-4">
              <div className="w-16 h-1 bg-terra-muted/20 rounded-full overflow-hidden relative">
                 <div className="absolute inset-0 bg-terra-red animate-slide-left-right" />
              </div>
           </div>
           <HiUserGroup size={40} className="text-terra-muted mt-4 opacity-50" />
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative max-w-2xl w-full bg-[#111] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden shadow-terra-red/10">
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-terra-muted hover:text-white transition-colors z-20"
        >
          <HiX size={24} />
        </button>

        <div className="flex flex-col md:flex-row min-h-[450px]">
          {/* Visual Column */}
          <div className="md:w-5/12 bg-[#0a0a0a] p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/5">
             <div className="mb-8">{steps[step].icon}</div>
             {steps[step].visual}
          </div>

          {/* Content Column */}
          <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center">
             <div className="flex gap-1 mb-6">
                {steps.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i === step ? 'bg-terra-red' : 'bg-white/10'}`} />
                ))}
             </div>

             <h2 className="font-display text-3xl tracking-wide mb-4 animate-slide-up">
               {steps[step].title}
             </h2>
             <p className="text-terra-muted text-lg leading-relaxed mb-10 animate-slide-up delay-100">
               {steps[step].desc}
             </p>

             <div className="flex items-center justify-between mt-auto">
                <button 
                  onClick={onClose}
                  className="text-sm font-bold text-terra-muted hover:text-white transition-colors"
                >
                  Skip
                </button>
                
                {step < steps.length - 1 ? (
                  <Button 
                    variant="primary" 
                    className="rounded-full px-8" 
                    onClick={() => setStep(step + 1)}
                  >
                    Next <HiArrowRight size={18} className="ml-2" />
                  </Button>
                ) : (
                  <Button 
                    variant="primary" 
                    className="rounded-full px-8 bg-green-600 hover:bg-green-700 border-none" 
                    onClick={onClose}
                  >
                    Get Started
                  </Button>
                )}
             </div>
          </div>
        </div>

        {/* Progress Dots for mobile */}
        <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
           {steps.map((_, i) => (
             <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-terra-red' : 'bg-white/10'}`} />
           ))}
        </div>
      </div>
    </div>
  );
}

// Separate UserGroup icon missing in steps
function HiUserGroup(props) {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 20 20" height="1em" width="1em" {...props}>
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
    </svg>
  );
}
