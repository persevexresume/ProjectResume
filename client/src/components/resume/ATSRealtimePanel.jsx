import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Zap, 
  Target, 
  Trophy, 
  Lightbulb
} from 'lucide-react';

const COMMON_KEYWORDS = [
  'javascript', 'react', 'node', 'python', 'java', 'sql', 'nosql', 'mongodb', 'aws', 'azure', 'docker', 'kubernetes',
  'typescript', 'angular', 'vue', 'nextjs', 'tailwind', 'bootstrap', 'sass', 'git', 'ci/cd', 'agile', 'scrum',
  'communication', 'teamwork', 'leadership', 'problem solving', 'critical thinking', 'project management',
  'management', 'development', 'design', 'testing', 'security', 'api', 'rest', 'graphql'
];

export default function ATSRealtimePanel({ resumeData }) {
  // Safely destructure with fallbacks
  const data = resumeData || {};
  const personalInfo = data.personalInfo || {};
  const experience = Array.isArray(data.experience) ? data.experience : [];
  const education = Array.isArray(data.education) ? data.education : [];
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const projects = data.projects || [];
  const certifications = data.certifications || [];
  const jobDescription = data.jobDescription || '';

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('ATSRealtimePanel received data:', { personalInfo, experience, education, skills, jobDescription });
  }

  const analysis = useMemo(() => {
    const issues = [];
    const tips = [];
    const sections = {
      contact: 0,
      experience: 0,
      skills: 0,
      education: 0,
      summary: 0,
      keywords: 0
    };

    // 1. Contact Info (10%)
    let contactScore = 0;
    if (personalInfo?.firstName && personalInfo?.firstName?.trim()) contactScore += 30;
    if (personalInfo?.lastName && personalInfo?.lastName?.trim()) contactScore += 30;
    if (personalInfo?.email && personalInfo?.email?.trim()) contactScore += 20;
    if (personalInfo?.phone && personalInfo?.phone?.trim()) contactScore += 20;
    if (personalInfo?.location && personalInfo?.location?.trim()) contactScore += 20;
    const hasContactIssue = contactScore < 100;
    if (hasContactIssue) {
      issues.push({ id: 'contact', type: 'warning', text: 'Complete contact information (name, email, phone).' });
    }
    sections.contact = Math.min(contactScore, 100);

    // 2. Experience (25%)
    let expScore = 0;
    if (experience && experience.length > 0) {
      expScore = Math.min(100, experience.length * 30 + 10);
      const shortDesc = experience.some(exp => (exp.description || '').length < 50);
      if (shortDesc) {
        expScore -= 20;
        issues.push({ id: 'exp-desc', type: 'error', text: 'Some experience descriptions are too short.' });
      }
    } else {
      issues.push({ id: 'exp-missing', type: 'error', text: 'Work experience is missing.' });
    }
    sections.experience = Math.max(0, expScore);

    // 3. Skills (20%)
    let skillScore = 0;
    if (skills && skills.length > 0) {
      skillScore = Math.min(100, skills.length * 15);
      if (skills.length < 5) {
        tips.push('Add at least 5-10 relevant skills to improve visibility.');
      }
    } else {
      issues.push({ id: 'skills-missing', type: 'error', text: 'Skills section is empty.' });
    }
    sections.skills = skillScore;

    // 4. Education (15%)
    let eduScore = 0;
    if (education && education.length > 0) {
      eduScore = 100;
    } else {
      issues.push({ id: 'edu-missing', type: 'warning', text: 'Education details are missing.' });
    }
    sections.education = eduScore;

    // 5. Summary (10%)
    let summaryScore = 0;
    if (personalInfo.summary) {
      summaryScore = (personalInfo.summary.length > 100) ? 100 : 50;
      if (personalInfo.summary.length < 50) issues.push({ id: 'summary-short', type: 'warning', text: 'Summary is a bit too brief.' });
    } else {
      tips.push('A professional summary helps ATS understand your focus.');
    }
    sections.summary = summaryScore;

    // 6. Keyword Match (20%)
    const matchedKeywords = [];
    const missingKeywords = [];
    let keywordScore = 0;

    if (jobDescription) {
      const jdLower = jobDescription.toLowerCase();
      const resumeContent = JSON.stringify(resumeData).toLowerCase();
      
      // Dynamic Keyword Extraction:
      // Look for significant words in the JD that might be skills
      const jdWords = jobDescription.split(/\W+/)
        .filter(word => word.length > 3)
        .filter(word => !['this', 'that', 'with', 'from', 'your', 'will', 'have', 'experience', 'knowledge', 'requirements', 'years'].includes(word.toLowerCase()));
      
      const uniqueJdWords = [...new Set(jdWords.map(w => w.toLowerCase()))];
      
      // Combine common keywords found in JD with dynamically extracted ones
      const targetKeywords = Array.from(new Set([
        ...COMMON_KEYWORDS.filter(k => jdLower.includes(k.toLowerCase())),
        ...uniqueJdWords.filter(w => w.length > 5 && (jobDescription.includes(w.charAt(0).toUpperCase() + w.slice(1)) || COMMON_KEYWORDS.some(ck => ck.includes(w))))
      ])).slice(0, 15); // Cap at 15 for UI clarity
      
      targetKeywords.forEach(k => {
        if (resumeContent.includes(k)) {
          matchedKeywords.push(k);
        } else {
          missingKeywords.push(k);
        }
      });

      if (targetKeywords.length > 0) {
        keywordScore = (matchedKeywords.length / targetKeywords.length) * 100;
        if (keywordScore < 50) tips.push('Tailor your skills and summary to match the job description keywords.');
      } else {
        keywordScore = 50;
      }
    } else {
      tips.push('Paste a job description to see keyword matches.');
      keywordScore = 0;
    }
    sections.keywords = keywordScore;

    const overall = (
      (sections.contact * 0.1) +
      (sections.experience * 0.25) +
      (sections.skills * 0.2) +
      (sections.education * 0.15) +
      (sections.summary * 0.1) +
      (sections.keywords * 0.2)
    );

    return {
      overall: Math.round(overall),
      sections,
      issues,
      tips,
      matchedKeywords,
      missingKeywords
    };
  }, [personalInfo, experience, education, skills, projects, certifications, jobDescription]);

  const getStatusColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden">
      {/* Overall Score Section */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
              <Trophy size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">ATS Optimization</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Analysis</p>
            </div>
          </div>
          <div 
            className="text-3xl font-black tabular-nums"
            style={{ color: getStatusColor(analysis.overall) }}
          >
            {analysis.overall}%
          </div>
        </div>

        <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${analysis.overall}%` }}
            className="absolute inset-y-0 left-0 transition-colors duration-500"
            style={{ backgroundColor: getStatusColor(analysis.overall) }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
          <span>Improve</span>
          <span>Competitive</span>
          <span>Excellent</span>
        </div>
      </div>

      {/* Grid of sections */}
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(analysis.sections).map(([name, score]) => (
          <div key={name} className="bg-white/50 border border-slate-100 p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{name}</span>
              <span className="text-[10px] font-black" style={{ color: getStatusColor(score) }}>{Math.round(score)}%</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${score}%` }} className="h-full" style={{ backgroundColor: getStatusColor(score) }} />
            </div>
          </div>
        ))}
      </div>

      {/* Keywords matched/missing */}
      {(analysis.matchedKeywords.length > 0 || analysis.missingKeywords.length > 0) && (
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <h4 className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-widest mb-4">
            <Target size={16} className="text-indigo-600" />
            Keyword Intelligence
          </h4>
          <div className="space-y-4">
            {analysis.matchedKeywords.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-emerald-500 uppercase mb-2">Matched</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.matchedKeywords.map(k => (
                    <span key={k} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-bold border border-emerald-100">{k}</span>
                  ))}
                </div>
              </div>
            )}
            {analysis.missingKeywords.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-rose-500 uppercase mb-2">Missing from JD</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords.map(k => (
                    <span key={k} className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-bold border border-rose-100">{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Critical Issues */}
      <AnimatePresence>
        {analysis.issues.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Issues Identified</h4>
             {analysis.issues.map(issue => (
               <div key={issue.id} className="flex gap-3 items-center p-3 bg-white border border-rose-100 rounded-2xl shadow-sm">
                  {issue.type === 'error' ? <XCircle className="text-rose-500" size={16} /> : <AlertCircle className="text-amber-500" size={16} />}
                  <p className="text-xs font-bold text-slate-700">{issue.text}</p>
               </div>
             ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-200">
        <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-4">
          <Lightbulb size={16} className="text-amber-400" />
          Pro Tip
        </h4>
        <div className="space-y-3">
          {(analysis.tips.length > 0 ? analysis.tips : ["Your resume is looking strong! Make sure to use active verbs in your experience descriptions."]).map((tip, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 shrink-0" />
              <p className="text-xs font-bold text-slate-300 leading-snug">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
