import { PlusCircle, UploadCloud } from 'lucide-react'

export default function PathSelection({ onSelect }) {
    return (
        <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-100 p-8 md:p-10">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">Choose how to start</h1>
                <p className="text-slate-500 mb-8">Create a new resume from scratch or upload an existing one.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => onSelect?.('create')}
                        className="group p-6 rounded-xl border-2 border-blue-100 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all text-left"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <PlusCircle className="text-blue-600" size={22} />
                            <span className="font-extrabold text-slate-900">Create New Resume</span>
                        </div>
                        <p className="text-sm text-slate-600">Start with guided sections and build your resume step by step.</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => onSelect?.('upload')}
                        className="group p-6 rounded-xl border-2 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 transition-all text-left"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <UploadCloud className="text-emerald-600" size={22} />
                            <span className="font-extrabold text-slate-900">Upload Existing Resume</span>
                        </div>
                        <p className="text-sm text-slate-600">Upload a PDF and continue editing with extracted details.</p>
                    </button>
                </div>
            </div>
        </div>
    )
}
