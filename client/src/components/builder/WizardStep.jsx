import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const WizardStep = ({
    children,
    onNext,
    onBack,
    title,
    description,
    isFirst = false,
    isLast = false,
    nextLabel = 'Next',
    loading = false,
    helper = null,
    sectionTag = null
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full max-w-4xl w-full p-8"
        >
            <div className="mb-6">
                {sectionTag && (
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-blue-700">
                        {sectionTag}
                    </div>
                )}
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">{title}</h2>
                {description && <p className="text-slate-500 font-medium">{description}</p>}
            </div>

            {helper && (
                <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                    <p className="text-[11px] font-black uppercase tracking-wider text-blue-700">{helper.title || 'Quick Guide'}</p>
                    {Array.isArray(helper.points) && helper.points.length > 0 && (
                        <ul className="mt-2 space-y-1.5">
                            {helper.points.map((point, index) => (
                                <li key={`${point}-${index}`} className="text-[13px] font-semibold text-slate-700">
                                    {index + 1}. {point}
                                </li>
                            ))}
                        </ul>
                    )}
                    {helper.tip && (
                        <p className="mt-2 text-[12px] font-semibold text-blue-800">Tip: {helper.tip}</p>
                    )}
                </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
                    <p className="mb-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Section Editor</p>
                    {children}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                {!isFirst ? (
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-6 py-3 text-slate-600 font-bold hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                ) : <div />}

                <button
                    onClick={onNext}
                    disabled={loading}
                    className="group relative flex items-center gap-2 px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 disabled:opacity-70"
                >
                    {loading ? 'Processing...' : nextLabel}
                    {!isLast && !loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
                </button>
            </div>
        </motion.div>
    );
};

export default WizardStep;
