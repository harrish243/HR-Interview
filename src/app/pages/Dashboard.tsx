import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { 
  Upload, CheckCircle2, Sparkles, FileText, Clock, TrendingUp, 
  History, ChevronRight, Calendar, BarChart3, Trophy, Plus, X 
} from 'lucide-react';

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || 'Guest');
  const [stats, setStats] = useState({ total: 0, avgScore: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, historyRes] = await Promise.all([
          fetch(`http://localhost:5000/api/stats/${userEmail}`),
          fetch(`http://localhost:5000/api/history/${userEmail}`)
        ]);
        const statsData = await statsRes.json();
        const historyData = await historyRes.json();
        setStats(statsData);
        setHistory(historyData);
      } catch (err) {
        console.error("Data Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userEmail]);

  const addTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (topicInput.trim() && !customTopics.includes(topicInput.trim())) {
      setCustomTopics([...customTopics, topicInput.trim()]);
      setTopicInput('');
    }
  };

  const removeTopic = (topic: string) => {
    setCustomTopics(customTopics.filter(t => t !== topic));
  };

  const handleStart = async (withResume: boolean) => {
    let resumeText = "";
    
    if (withResume && selectedFile) {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('resume', selectedFile);
            
            const response = await fetch('http://localhost:5000/api/upload-resume', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                resumeText = data.text;
            } else {
                alert("Failed to parse resume. Starting with empty profile.");
            }
        } catch (err) {
            console.error("Upload Error:", err);
        }
    }

    const finalTopics = customTopics.length > 0 ? customTopics : ["General Professionalism"];
    navigate('/processing', { 
        state: { 
            resumeText: resumeText, 
            topics: finalTopics,
            email: userEmail 
        } 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-secondary" />
            </div>
            <span className="text-2xl font-display text-primary" style={{ fontWeight: 700 }}>InterviewAI</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-muted-foreground">{userEmail}</span>
            <button
                onClick={() => { localStorage.removeItem('userEmail'); navigate('/'); }}
                className="text-sm text-red-500 font-bold hover:underline"
            >
                Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center lg:text-left">
          <h1 className="text-5xl lg:text-6xl mb-4 text-foreground" style={{ fontWeight: 900 }}>
            Welcome, {userEmail.split('@')[0]}
          </h1>
          <p className="text-xl text-muted-foreground">What do you want to practice today?</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <StatsCard icon={Clock} label="Total Interviews" value={stats.total} color="blue" />
           <StatsCard icon={BarChart3} label="Average Score" value={`${stats.avgScore}%`} color="green" />
           <StatsCard icon={Trophy} label="Best Performance" value={history.length > 0 ? `${Math.max(...history.map(h => h.avgScore || 0))}%` : '0%'} color="amber" isFeatured />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
           {/* Option 1: Resume */}
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl p-8 border border-border shadow-sm hover:shadow-md transition-all flex flex-col">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center"><FileText className="text-primary" /></div>
                <h3 className="text-2xl font-bold">Interview with Resume</h3>
             </div>
             <div 
               onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
               onDragLeave={() => setIsDragging(false)}
               className={`border-2 border-dashed rounded-2x flex-1 p-10 flex flex-col items-center justify-center text-center transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'}`}
             >
                <Upload className="mb-4 text-muted-foreground" size={40} />
                <p className="font-bold mb-2 text-lg">{selectedFile ? selectedFile.name : 'Drop your resume here'}</p>
                <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden" id="fileInput" />
                <label htmlFor="fileInput" className="cursor-pointer text-primary font-bold hover:underline mb-2">Browse Files</label>
                <p className="text-xs text-muted-foreground">PDF or DOC Files</p>
             </div>
             <button onClick={() => handleStart(true)} disabled={!selectedFile} className="w-full mt-6 py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl disabled:opacity-50 transition-all hover:scale-[1.02]">Start Now</button>
           </motion.div>

           {/* Option 2: Custom Topics */}
           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl p-8 border border-border shadow-sm hover:shadow-md transition-all flex flex-col">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center"><Sparkles className="text-secondary" /></div>
                <h3 className="text-2xl font-bold">Quick Practice</h3>
             </div>
             
             <div className="flex-1 space-y-6">
                <p className="text-muted-foreground">Type any topics, skills, or job roles you want to practice for.</p>
                
                <form onSubmit={addTopic} className="relative">
                   <input 
                     type="text" 
                     value={topicInput} 
                     onChange={(e) => setTopicInput(e.target.value)}
                     placeholder="e.g. Java Developer, Soft Skills..." 
                     className="w-full pl-6 pr-16 py-4 rounded-xl border-2 border-muted bg-muted/20 focus:border-secondary transition-all outline-none font-medium"
                   />
                   <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-secondary text-primary rounded-lg shadow-md">
                      <Plus size={20} />
                   </button>
                </form>

                <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-muted/10 rounded-2xl border border-muted/50 border-dashed">
                   {customTopics.length === 0 ? (
                      <span className="text-muted-foreground/50 text-sm m-auto">No topics added yet</span>
                   ) : (
                      customTopics.map(t => (
                        <motion.span 
                          initial={{ scale: 0.8, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }} 
                          key={t} 
                          className="flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded-full font-bold text-sm shadow-sm"
                        >
                           {t}
                           <X size={14} className="cursor-pointer hover:text-red-500" onClick={() => removeTopic(t)} />
                        </motion.span>
                      ))
                   )}
                </div>
             </div>
             
             <button 
                onClick={() => handleStart(false)} 
                disabled={customTopics.length === 0}
                className="w-full mt-6 py-5 bg-gradient-to-r from-secondary to-amber-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-secondary/20 disabled:opacity-50 transition-all hover:scale-[1.02]"
             >
                Start Quick Interview
             </button>
           </motion.div>
        </div>

        {/* History Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-8 border border-border shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-muted rounded-lg"><History className="text-primary" /></div>
                 <h2 className="text-2xl font-black">History</h2>
              </div>
           </div>

           {loading ? (
             <div className="text-center py-12 text-muted-foreground">Loading sessions...</div>
           ) : history.length === 0 ? (
             <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-muted/50">
                <Calendar className="mx-auto mb-4 text-muted-foreground/30" size={64} />
                <p className="font-bold text-lg">Your history is clear</p>
                <p className="text-muted-foreground">Start an interview to see your progress here.</p>
             </div>
           ) : (
             <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-border">
                      <th className="pb-6 font-bold text-muted-foreground uppercase text-xs tracking-widest">Date & Time</th>
                      <th className="pb-6 font-bold text-muted-foreground uppercase text-xs tracking-widest">Focus Areas</th>
                      <th className="pb-6 font-bold text-muted-foreground uppercase text-xs tracking-widest text-center">Avg Score</th>
                      <th className="pb-6 font-bold text-muted-foreground uppercase text-xs tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-muted/10 transition-all group">
                        <td className="py-6">
                          <div className="font-bold text-foreground">
                            {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="py-6">
                          <div className="flex gap-1.5 flex-wrap">
                            {(() => {
                                try {
                                    const parsed = typeof item.topics === 'string' ? JSON.parse(item.topics) : item.topics;
                                    return Array.isArray(parsed) ? (parsed.length > 0 ? parsed : ["General"]) : [item.topics];
                                } catch (e) { return [item.topics]; }
                            })().map((t: string) => (
                              <span key={t} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">{t}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-6 text-center">
                          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-sm font-black border-4 ${item.avgScore >= 75 ? 'border-green-100 text-green-600 bg-green-50' : 'border-amber-100 text-amber-600 bg-amber-50'}`}>
                            {Math.round(item.avgScore || 0)}
                          </div>
                        </td>
                        <td className="py-6 text-right">
                          <button 
                            onClick={() => navigate('/report', { state: { interviewId: item.id } })}
                            className="bg-muted p-2.5 hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           )}
        </motion.div>
      </div>
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color, isFeatured }: any) {
    const colorClasses: any = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        amber: 'bg-amber-100 text-amber-600',
    };
    
    return (
        <div className={`rounded-3xl p-8 border shadow-sm transition-all hover:shadow-lg ${isFeatured ? 'bg-gradient-to-br from-primary via-indigo-900 to-indigo-950 border-primary text-white' : 'bg-white border-border'}`}>
           <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isFeatured ? 'bg-white/10 text-white' : colorClasses[color]}`}>
                 <Icon size={24} />
              </div>
              <span className={`text-sm font-bold uppercase tracking-wider ${isFeatured ? 'text-indigo-200' : 'text-muted-foreground'}`}>{label}</span>
           </div>
           <div className="text-5xl font-black tabular-nums">{value}</div>
        </div>
    );
}