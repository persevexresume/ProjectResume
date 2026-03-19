import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function WizardStep({
    title,
    description,
    children,
    onNext,
    onBack,
    isFirst = false,
    isLast = false,
    nextLabel = 'Next',
    loading = false
}) {
    return (
        <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl p-5 md:p-8 shadow-sm">
            <div className="mb-5 md:mb-7">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">{title}</h2>
                {description ? <p className="text-slate-600">{description}</p> : null}
            </div>

            <div className="mb-8">{children}</div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-4 w-full flex-wrap">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isFirst || loading}
                    className="flex items-center gap-2 px-8 py-3.5 text-slate-600 font-bold hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all"
                >
                    <ArrowLeft size={18} />
                    Previous Page
                </button>

                <button
                    type="button"
                    onClick={onNext}
                    disabled={loading}
                    className="group relative flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 disabled:opacity-70"
                >
                    {loading ? 'Processing...' : nextLabel || (isLast ? 'Finalize Resume' : 'Next Page')}
                    {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
                </button>
            </div>
        </div>
    )
}
