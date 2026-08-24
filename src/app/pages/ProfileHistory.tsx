import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Sparkles,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Eye,
  Download,
  Filter,
} from 'lucide-react';

type Interview = {
  id: number;
  date: string;
  score: number;
  topics: string[];
  duration: string;
  trend: 'up' | 'down' | 'stable';
};

const mockInterviews: Interview[] = [
  {
    id: 1,
    date: '2026-04-12',
    score: 87,
    topics: ['HR & Behavioral', 'Leadership'],
    duration: '22 min',
    trend: 'up',
  },
  {
    id: 2,
    date: '2026-04-09',
    score: 82,
    topics: ['Communication', 'Teamwork'],
    duration: '18 min',
    trend: 'up',
  },
  {
    id: 3,
    date: '2026-04-05',
    score: 78,
    topics: ['Problem Solving', 'Technical Basics'],
    duration: '20 min',
    trend: 'stable',
  },
  {
    id: 4,
    date: '2026-04-01',
    score: 75,
    topics: ['HR & Behavioral'],
    duration: '15 min',
    trend: 'down',
  },
  {
    id: 5,
    date: '2026-03-28',
    score: 79,
    topics: ['Adaptability', 'Customer Service'],
    duration: '19 min',
    trend: 'up',
  },
  {
    id: 6,
    date: '2026-03-25',
    score: 73,
    topics: ['Leadership', 'Conflict Resolution'],
    duration: '17 min',
    trend: 'stable',
  },
];

export default function ProfileHistory() {
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    return 'text-amber-600 bg-amber-50';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up')
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down')
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <span className="w-4 h-4 text-gray-400">−</span>;
  };

  const averageScore =
    mockInterviews.reduce((sum, interview) => sum + interview.score, 0) /
    mockInterviews.length;

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
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            style={{ fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl mb-4 text-foreground" style={{ fontWeight: 900 }}>
            Interview History
          </h1>
          <p className="text-xl text-muted-foreground">
            Track your progress and review past performance
          </p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-border shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground" style={{ fontWeight: 500 }}>
                Total Interviews
              </span>
            </div>
            <div className="text-3xl text-foreground" style={{ fontWeight: 700 }}>
              {mockInterviews.length}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-border shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-muted-foreground" style={{ fontWeight: 500 }}>
                Average Score
              </span>
            </div>
            <div className="text-3xl text-foreground" style={{ fontWeight: 700 }}>
              {Math.round(averageScore)}%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-border shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-muted-foreground" style={{ fontWeight: 500 }}>
                Best Score
              </span>
            </div>
            <div className="text-3xl text-foreground" style={{ fontWeight: 700 }}>
              {Math.max(...mockInterviews.map((i) => i.score))}%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-secondary to-amber-600 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-amber-100" style={{ fontWeight: 500 }}>
                Improvement
              </span>
            </div>
            <div className="text-3xl text-white" style={{ fontWeight: 700 }}>
              +12%
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <h2 className="text-2xl text-foreground" style={{ fontWeight: 700 }}>
            Past Interviews
          </h2>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl hover:bg-muted transition-colors"
            style={{ fontWeight: 500 }}
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </motion.div>

        {/* Interview List */}
        <div className="space-y-4">
          {mockInterviews.map((interview, index) => (
            <motion.div
              key={interview.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 flex-1">
                  {/* Date */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/5 rounded-xl flex flex-col items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(interview.date).split(' ')[0]}
                      </span>
                      <span className="text-lg text-primary" style={{ fontWeight: 700 }}>
                        {formatDate(interview.date).split(' ')[1]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(interview.date)}
                      </p>
                      <p className="text-sm text-muted-foreground">{interview.duration}</p>
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="flex flex-wrap gap-2">
                    {interview.topics.map((topic) => (
                      <span
                        key={topic}
                        className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                        style={{ fontWeight: 500 }}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>

                  {/* Score */}
                  <div className="ml-auto flex items-center gap-4">
                    {getTrendIcon(interview.trend)}
                    <div
                      className={`px-6 py-3 rounded-xl ${getScoreColor(interview.score)}`}
                    >
                      <span className="text-2xl" style={{ fontWeight: 700 }}>
                        {interview.score}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => navigate('/report')}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-5 h-5 text-primary" />
                  </button>
                  <button
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Download Report"
                  >
                    <Download className="w-5 h-5 text-primary" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty state if no interviews */}
        {mockInterviews.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl mb-2 text-foreground" style={{ fontWeight: 700 }}>
              No interviews yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Start your first practice interview to see your progress here
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all"
              style={{ fontWeight: 600 }}
            >
              Start Interview
            </button>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-12 text-center"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 bg-gradient-to-r from-secondary to-amber-600 text-white rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all shadow-lg"
            style={{ fontWeight: 700 }}
          >
            Start New Interview
          </button>
        </motion.div>
      </div>
    </div>
  );
}
