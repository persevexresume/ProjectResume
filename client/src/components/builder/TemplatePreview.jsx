import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function TemplatePreview({ template, onContinue, onBack }) {
    return (
        <div className="w-full max-w-4xl">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">Template Preview</h2>
                <p className="text-slate-500 mb-6">Review your selected template before continuing.</p>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 mb-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Selected Template</p>
                    <h3 className="text-xl font-extrabold text-slate-900">{template?.name || 'Default Template'}</h3>
                    {template?.description && (
                        <p className="text-slate-600 mt-2">{template.description}</p>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>

                    <button
                        type="button"
                        onClick={onContinue}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
                    >
                        Continue
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
