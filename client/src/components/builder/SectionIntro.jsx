import { ArrowRight, CheckCircle2 } from 'lucide-react'

export default function SectionIntro({ title, introText, tips = [], icon: Icon, onContinue }) {
    return (
        <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                {Icon ? <Icon size={22} className="text-blue-600" /> : null}
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
            </div>

            {introText && <p className="text-slate-600 leading-relaxed mb-6">{introText}</p>}

            {tips.length > 0 && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-6">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Quick Tips</p>
                    <ul className="space-y-2">
                        {tips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-slate-700">
                                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <button
                type="button"
                onClick={onContinue}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
            >
                Continue
                <ArrowRight size={18} />
            </button>
        </div>
    )
}
