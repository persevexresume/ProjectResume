import React from 'react';
import { motion } from 'framer-motion';
import { FilePlus, Upload, ShieldCheck, Zap, Sparkles } from 'lucide-react';

const PathSelection = ({ onSelect }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[600px] max-w-5xl mx-auto p-8">
            <div className="text-center mb-16">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-6"
                >
                    <Sparkles size={14} />
                    Professional Carrier Builder
                </motion.div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">
                    How would you like to <br /> <span className="text-blue-600">begin?</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-lg mx-auto">
                    Choose the path that best suits your needs. Our guided process will help you create a standout resume in minutes.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 w-full">
                {/* Create New Path */}
                <motion.button
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect('create')}
                    className="group relative flex flex-col items-start p-10 bg-white border-2 border-slate-100 rounded-[40px] hover:border-blue-600/20 hover:shadow-[0_40px_80px_-15px_rgba(37,99,235,0.1)] transition-all text-left"
                >
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-[24px] flex items-center justify-center mb-8 shadow-xl shadow-blue-600/20 group-hover:rotate-6 transition-transform">
                        <FilePlus size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3">Create New Resume</h3>
                    <p className="text-slate-500 font-medium mb-8">
                        We'll guide you through each section with expert tips and AI-powered suggestions. Perfect for staying fresh.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-blue-600 font-black text-sm uppercase tracking-wider">
                        Start from scratch
                        <Zap size={16} />
                    </div>

                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">Recommended</span>
                    </div>
                </motion.button>

                {/* Upload Existing Path */}
                <motion.button
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect('upload')}
                    className="group relative flex flex-col items-start p-10 bg-slate-900 border-2 border-slate-800 rounded-[40px] hover:shadow-[0_40px_80px_-15px_rgba(15,23,42,0.3)] transition-all text-left overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />

                    <div className="w-16 h-16 bg-white/10 text-white rounded-[24px] flex items-center justify-center mb-8 border border-white/10 group-hover:-rotate-6 transition-transform">
                        <Upload size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3">Upload Existing</h3>
                    <p className="text-slate-400 font-medium mb-8">
                        Already have a resume? Upload it and our AI will extract the data and suggest optimizations for our templates.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-white font-black text-sm uppercase tracking-wider">
                        Re-engineer now
                        <ShieldCheck size={16} />
                    </div>
                </motion.button>
            </div>

            <p className="mt-16 text-slate-400 text-sm font-medium">
                Trusted by high-impact professionals worldwide.
            </p>
        </div>
    );
};

export default PathSelection;
