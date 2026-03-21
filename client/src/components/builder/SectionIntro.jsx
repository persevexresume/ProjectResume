import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react';

const SectionIntro = ({ title, introText, tips, onContinue, icon: Icon = Lightbulb }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center p-8"
        >
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Icon size={32} />
            </div>

            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">{title}</h2>
            <p className="text-slate-500 text-lg font-medium mb-10 leading-relaxed">
                {introText}
            </p>

            <div className="w-full bg-slate-50 rounded-[24px] p-8 mb-12 text-left border border-slate-100">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-blue-500" />
                    Pro Tips for Success
                </h3>
                <ul className="space-y-4">
                    {tips.map((tip, index) => (
                        <li key={index} className="flex gap-4 text-slate-700 font-medium leading-relaxed">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-blue-600 shadow-sm">
                                {index + 1}
                            </span>
                            {tip}
                        </li>
                    ))}
                </ul>
            </div>

            <button
                onClick={onContinue}
                className="group relative flex items-center gap-3 px-12 py-4 bg-[#0f172a] hover:bg-slate-800 text-white rounded-2xl font-black text-lg transition-all active:scale-[0.98] shadow-2xl shadow-slate-900/20"
            >
                Continue
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </button>
        </motion.div>
    );
};

export default SectionIntro;
