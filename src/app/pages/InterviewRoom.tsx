import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Timer,
  Volume2,
  VolumeX,
  Play
} from 'lucide-react';

export default function InterviewRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { questions, interviewId } = location.state || { questions: [], interviewId: null };

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setLeftTime] = useState(120); // 2 minutes per question
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // --- Voice & Speech State ---
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);

  // --- Webcam Logic ---
  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 1280, height: 720 }, 
            audio: false 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera Access Error:", err);
      }
    }
    startCamera();

    // Cleanup: Stop camera when leaving the page
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // --- Timer Logic ---
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setLeftTime((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // --- Text-to-Speech (TTS) Helper ---
  const speakQuestion = (text: string) => {
    window.speechSynthesis.cancel(); // Stop any currently active voice
    if (!text || !isSpeechEnabled) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to pick a premium, natural-sounding voice
    const voices = window.speechSynthesis.getVoices();
    const voiceCandidate = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft') || v.name.includes('Samantha'))
    );
    if (voiceCandidate) {
      utterance.voice = voiceCandidate;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Speak question automatically when question index changes or speech setting toggles
  useEffect(() => {
    if (questions && questions.length > 0) {
      const timer = setTimeout(() => {
        speakQuestion(questions[currentQuestionIndex]);
      }, 800);
      return () => {
        clearTimeout(timer);
        window.speechSynthesis.cancel();
      };
    }
  }, [currentQuestionIndex, questions, isSpeechEnabled]);

  // Clear any running TTS on page leave
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setLeftTime(120);
      setFeedback(null);
      setUserAnswer('');
    } else {
      navigate('/report', { state: { interviewId } });
    }
  };

  // --- Speech Recognition Logic ---
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US';

      recog.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserAnswer(transcript);
      };

      recog.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsRecording(false);
      };

      setRecognition(recog);
    }
  }, []);

  const handleToggleRecording = async () => {
    if (isRecording) {
      // STOP Recording & Submit
      if (recognition) recognition.stop();
      setIsRecording(false);
      setIsAnalyzing(true);
      
      try {
        const response = await fetch('http://localhost:5000/api/submit-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                interviewId,
                questionIndex: currentQuestionIndex,
                answerText: userAnswer || "No verbal answer provided."
            })
        });
        const data = await response.json();
        setFeedback(data.feedback);

        // Announce feedback analysis
        if (isSpeechEnabled) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance("Response successfully analyzed. Please review the feedback below.");
          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utterance);
        }

      } catch (err) {
          console.error(err);
      } finally {
          setIsAnalyzing(false);
      }
    } else {
      // START Recording
      setUserAnswer('');
      window.speechSynthesis.cancel(); // Stop talking if currently speaking
      setIsSpeaking(false);

      if (recognition) {
        recognition.start();
        setIsRecording(true);
      } else {
        alert("Speech Recognition is not supported in this browser.");
      }
    }
  };

  // --- State-based Interactive Avatar ---
  const renderAvatar = () => {
    let glowColor = "rgba(99, 102, 241, 0.35)"; // Indigo base
    let borderColor = "border-indigo-500/30";

    if (isAnalyzing) {
      glowColor = "rgba(34, 197, 94, 0.4)"; // Green processing
      borderColor = "border-green-500/40";
    } else if (isRecording) {
      glowColor = "rgba(239, 68, 68, 0.45)"; // Red active capturing
      borderColor = "border-red-500/40";
    } else if (isSpeaking) {
      glowColor = "rgba(245, 158, 11, 0.45)"; // Amber talking
      borderColor = "border-amber-500/40";
    }

    return (
      <div className="relative flex flex-col items-center">
        {/* Orbital rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-72 h-72 rounded-full border border-dashed border-white/10"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute w-80 h-80 rounded-full border border-white/5"
        />

        {/* Core Glowing Avatar Sphere */}
        <motion.div 
          animate={
            isRecording 
              ? { scale: [1, 1.04, 1] } 
              : isSpeaking 
              ? { scale: [1, 1.02, 1] }
              : { scale: 1 }
          }
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ boxShadow: `0 0 60px ${glowColor}` }}
          className={`w-64 h-64 bg-slate-950/85 rounded-full border-4 ${borderColor} flex items-center justify-center relative backdrop-blur-2xl transition-all duration-500`}
        >
          {/* Internal gradient particles */}
          <div className="absolute inset-0 rounded-full overflow-hidden opacity-25">
            <div className="absolute w-28 h-28 bg-indigo-500 rounded-full blur-2xl top-2 left-2 animate-pulse" />
            <div className="absolute w-28 h-28 bg-purple-500 rounded-full blur-2xl bottom-2 right-2 animate-pulse" />
          </div>

          <div className="w-56 h-56 rounded-full flex flex-col items-center justify-center overflow-hidden z-10">
            {isAnalyzing ? (
              // THINKING / ANALYZING STATE
              <div className="flex flex-col items-center justify-center gap-3">
                <motion.div 
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ rotate: { duration: 3, repeat: Infinity, ease: "linear" }, scale: { duration: 1.5, repeat: Infinity } }}
                  className="w-16 h-16 border-4 border-t-green-400 border-r-green-400/50 border-b-green-400/20 border-l-transparent rounded-full"
                />
                <span className="text-[10px] font-black tracking-widest text-green-400 uppercase animate-pulse">Evaluating Answer</span>
              </div>
            ) : isRecording ? (
              // LISTENING / RECORDING STATE
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-end justify-center gap-1.5 h-16">
                  {[0.7, 0.4, 0.9, 0.5, 0.8, 0.3, 0.6].map((multiplier, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [12, 56 * multiplier, 12] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
                      className="w-1.5 bg-gradient-to-t from-red-500 to-rose-400 rounded-full"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-black tracking-widest text-red-400 uppercase animate-pulse">Listening</span>
              </div>
            ) : isSpeaking ? (
              // SPEAKING / VOICEOVER STATE
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center justify-center gap-1.5 h-16">
                  {[0.5, 0.8, 0.4, 0.9, 0.6].map((multiplier, i) => (
                    <motion.div
                      key={i}
                      animate={{ scaleY: [1, 2.6 * multiplier, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
                      className="w-2.5 h-8 bg-gradient-to-y from-amber-400 to-yellow-300 rounded-full"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase animate-pulse">Interviewer Speaking</span>
              </div>
            ) : (
              // IDLE STATE
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0.25, 0.8] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full border border-indigo-400/40"
                  />
                  <motion.div 
                    animate={{ scale: [0.8, 1, 0.8], opacity: [0.4, 0.85, 0.4] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                    className="w-12 h-12 rounded-full border-2 border-indigo-400 flex items-center justify-center"
                  />
                  <div className="w-4 h-4 rounded-full bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.8)]" />
                </div>
                <span className="text-[9px] font-black tracking-widest text-indigo-300/50 uppercase font-mono">AI Ready</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-indigo-900 to-indigo-950 flex flex-col font-sans overflow-y-auto">
      {/* Header */}
      <header className="p-6 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full border border-red-500/30">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Live Interview</span>
             </div>
             <span className="text-white/40">|</span>
             <span className="text-indigo-200 font-medium">Question {currentQuestionIndex + 1} of {questions.length}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Voice Settings Switcher */}
           <button 
             onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
             className={`p-3 rounded-xl border transition-all flex items-center justify-center gap-2 font-bold text-xs ${
               isSpeechEnabled 
                 ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20' 
                 : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
             }`}
           >
             {isSpeechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
             <span>Voice Output {isSpeechEnabled ? 'On' : 'Off'}</span>
           </button>

           <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10">
              <Timer className="w-4 h-4 text-secondary" />
              <span className="text-white font-mono font-bold">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
           </div>
           
           <button onClick={() => navigate('/dashboard')} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">
              End Interview
           </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full py-8 px-4 flex flex-col items-center space-y-6 relative">
        
        {/* Symmetric Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-2">
           
           {/* Left Card: AI Interviewer Avatar */}
           <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px] backdrop-blur-md shadow-2xl relative">
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                 <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                 <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">AI Interviewer</span>
              </div>
              
              <div className="flex items-center justify-center py-6">
                 {renderAvatar()}
              </div>
           </div>

           {/* Right Card: Candidate Video Preview (Webcam) */}
           <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px] backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Candidate Camera</span>
              </div>
              
              <div className="w-full h-full max-h-[220px] max-w-[340px] rounded-2xl overflow-hidden border border-white/15 bg-black relative shadow-lg">
                 <video 
                   ref={videoRef}
                   autoPlay 
                   muted 
                   playsInline
                   className="w-full h-full object-cover mirror"
                 />
                 {!stream && <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm bg-gray-950">Webcam Inactive</div>}
              </div>
           </div>

        </div>

        {/* Question Bubble */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           key={currentQuestionIndex}
           className="w-full max-w-4xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden"
        >
           <div className="absolute top-0 left-0 w-2 h-full bg-secondary" />
           <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-secondary/20">
                 <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-4 flex-1">
                 <div className="flex justify-between items-center">
                   <span className="text-secondary text-sm font-bold uppercase tracking-widest">Interviewer</span>
                   <div className="flex gap-2">
                     <button
                       onClick={() => speakQuestion(questions[currentQuestionIndex])}
                       disabled={isRecording || isAnalyzing}
                       className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold border border-white/10 shadow-md"
                       title="Replay Voice Output"
                     >
                       <Play size={12} className="fill-white" />
                       <span>Replay Voice</span>
                     </button>
                   </div>
                 </div>
                 <p className="text-xl md:text-2xl text-white leading-relaxed font-semibold">
                    {questions[currentQuestionIndex] || "Preparing your custom interview question..."}
                 </p>
              </div>
           </div>
        </motion.div>

        {/* User live answer transcription feedback */}
        <AnimatePresence>
          {userAnswer && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full max-w-4xl bg-black/40 border border-white/10 rounded-2xl p-5 overflow-hidden backdrop-blur-md"
            >
              <div className="flex items-center gap-2 mb-2 text-xs text-indigo-300 font-bold uppercase tracking-wider">
                <MessageSquare size={14} />
                <span>Live Transcription</span>
              </div>
              <p className="text-sm text-white/90 italic leading-relaxed">
                "{userAnswer}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Panel and Controls */}
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl relative">
          
          <AnimatePresence>
            {feedback && (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-green-500/10 border border-green-500/30 p-6 rounded-2xl w-full flex items-start gap-4"
              >
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <ShieldCheck size={24} className="text-green-400" />
                </div>
                <div>
                  <h4 className="text-green-400 font-bold mb-1">Feedback Received!</h4>
                  <p className="text-indigo-100 text-sm leading-relaxed">{feedback}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-8 py-2">
            <button 
              onClick={handleToggleRecording}
              disabled={isAnalyzing}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                ? 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)] scale-110' 
                : 'bg-white hover:bg-indigo-50 shadow-xl'
              } disabled:opacity-50`}
            >
              {isAnalyzing ? (
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              ) : isRecording ? (
                <div className="w-8 h-8 bg-white rounded-lg animate-pulse" />
              ) : (
                <Mic className="w-10 h-10 text-primary" />
              )}
            </button>

            {feedback && (
              <button 
                onClick={handleNextQuestion}
                className="px-8 py-4 bg-secondary text-primary rounded-2xl font-black text-lg shadow-xl shadow-secondary/20 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'View Final Report'}
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          <p className="text-white/60 font-medium text-sm">
            {isRecording ? 'Click to stop and submit' : 'Click to start answering'}
          </p>
        </div>

      </main>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}

