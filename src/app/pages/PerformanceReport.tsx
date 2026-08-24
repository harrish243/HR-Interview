import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import {
  Sparkles,
  TrendingUp,
  MessageSquare,
  Eye,
  Lightbulb,
  Trophy,
  RotateCcw,
  Home,
  ChevronRight,
} from 'lucide-react';

export default function PerformanceReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const { interviewId } = location.state || {};
  
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      if (!interviewId) return;
      try {
        const response = await fetch(`http://localhost:5000/api/report/${interviewId}`);
        const data = await response.json();
        setReportData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [interviewId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading report...</div>;
  if (!reportData) return <div className="min-h-screen flex items-center justify-center">No report found.</div>;

  const chartData = [
    { name: 'Overall', value: reportData.overallScore, fill: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-secondary" />
            </div>
            <span className="text-2xl font-display text-primary" style={{ fontWeight: 700 }}>
              InterviewAI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              style={{ fontWeight: 500 }}
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 bg-gradient-to-br from-secondary to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-secondary/30"
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-5xl mb-4 text-foreground" style={{ fontWeight: 900 }}>
            Interview Complete!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Great job! Here's your detailed performance analysis and personalized feedback.
          </p>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-primary via-indigo-900 to-indigo-950 rounded-3xl p-12 mb-12 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 text-center">
            <p className="text-indigo-200 text-lg mb-4" style={{ fontWeight: 500 }}>
              Overall Score
            </p>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className="text-9xl mb-4 text-white"
              style={{ fontWeight: 900 }}
            >
              {reportData.overallScore}%
            </motion.div>
            <p className="text-xl text-secondary" style={{ fontWeight: 600 }}>
              {reportData.overallScore >= 80 ? 'Excellent Performance! 🎉' : reportData.overallScore >= 60 ? 'Good Progress! 👍' : 'Keep Practicing! 💪'}
            </p>
          </div>
        </motion.div>

        {/* Performance Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl p-8 border border-border shadow-sm mb-12"
        >
          <h2 className="text-3xl mb-8 text-foreground" style={{ fontWeight: 700 }}>
            Performance Breakdown
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="10%"
                  outerRadius="90%"
                  data={chartData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={10}
                    label={{ position: 'insideStart', fill: '#fff', fontWeight: 600 }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

            {/* Metrics */}
            <div className="space-y-6">
              {reportData.questions.map((q: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-4 bg-muted rounded-xl"
                >
                  <p className="font-semibold text-primary mb-1">Question {index + 1}: {q.question_text}</p>
                  <p className="text-sm text-foreground mb-2"><strong>Feedback:</strong> {q.feedback}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                      <div className="h-full bg-secondary" style={{ width: `${q.score}%` }}></div>
                    </div>
                    <span className="font-bold">{q.score}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 bg-gradient-to-r from-secondary to-amber-600 text-white rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all shadow-lg flex items-center justify-center gap-3"
            style={{ fontWeight: 700 }}
          >
            <RotateCcw className="w-5 h-5" />
            Practice Again
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 bg-white border-2 border-primary text-primary rounded-xl hover:bg-primary/5 transition-all flex items-center justify-center gap-3"
            style={{ fontWeight: 700 }}
          >
            <TrendingUp className="w-5 h-5" />
            Go back to Dashboard
          </button>
        </motion.div>
      </div>
    </div>
  );
}
