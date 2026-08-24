import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { Sparkles, FileText, Brain, MessageSquare, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';

const steps = [
  { icon: FileText, label: 'Analyzing your resume', delay: 0 },
  { icon: Brain, label: 'Generating personalized questions', delay: 1.5 },
  { icon: MessageSquare, label: 'Preparing AI interviewer', delay: 3 },
  { icon: CheckCircle2, label: 'Ready to begin', delay: 4.5 },
];

export default function ProcessingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resumeText, topics, email } = location.state || { resumeText: "", topics: [], email: "Guest" };
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initInterview() {
      try {
        console.log("Preparing interview for:", email);
        const response = await fetch('http://localhost:5000/api/process-interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText, topics, email })
        });

        const data = await response.json();
        
        if (data.success) {
          // Success! Wait for the animations to finish before navigating
          setTimeout(() => {
            navigate('/interview', { 
              state: { 
                questions: data.questions, 
                interviewId: data.interviewId 
              } 
            });
          }, 5000); 
        } else {
          setError(data.error || "The AI encountered an issue. Please try again.");
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Could not connect to the server. Make sure the backend is running.");
      } finally {
          setLoading(false);
      }
    }

    initInterview();
  }, [navigate, resumeText, topics, email]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-indigo-900 to-indigo-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
      />

      <div className="relative z-10 max-w-2xl w-full">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-3 mb-16">
          <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <span className="text-3xl font-display text-white" style={{ fontWeight: 700 }}>InterviewAI</span>
        </motion.div>

        {error ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 border border-red-500/50 backdrop-blur-md rounded-3xl p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-black text-white mb-4">Preparation Failed</h2>
            <p className="text-red-200 text-lg mb-8">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-4 bg-white text-primary rounded-xl font-bold flex items-center gap-3 mx-auto hover:bg-red-50 transition-all"
            >
              <RotateCcw size={20} /> Try Again
            </button>
          </motion.div>
        ) : (
          <>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl text-center mb-4 text-white" style={{ fontWeight: 900, lineHeight: 1.2 }}>
              Preparing Your Interview
            </motion.h1>
            <p className="text-center text-xl text-indigo-200 mb-16">Our AI is analyzing your profile and creating personalized questions</p>

            <div className="space-y-6 mb-12">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: step.delay }}
                    className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                  >
                    <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-lg text-white font-medium">{step.label}</span>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: step.delay + 1 }}
                      className="ml-auto"
                    >
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            <div className="bg-white/10 rounded-full h-2 overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 5, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-secondary to-amber-400"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
