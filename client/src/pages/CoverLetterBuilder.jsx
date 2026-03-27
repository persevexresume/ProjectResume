import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Download, Plus, Trash2, Sparkles } from 'lucide-react'
import useStore from '../store/useStore'
import { useToast } from '../context/ToastContext'
import { supabase } from '../supabase'
import { getDbUserId } from '../lib/userIdentity'
import { exportElementToPaginatedPdf } from '../lib/pdfExport'

export default function CoverLetterBuilder() {
    const navigate = useNavigate()
    const { user } = useStore()
    const { success, error: showError } = useToast()
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [coverLetter, setCoverLetter] = useState({
        recipientName: '',
        recipientTitle: '',
        companyName: '',
        hireDate: new Date().toISOString().split('T')[0],
        senderFirstName: '',
        senderLastName: '',
        senderEmail: '',
        senderPhone: '',
        openingParagraph: '',
        bodyParagraphs: ['', ''],
        closingParagraph: '',
    })
    const [isGenerating, setIsGenerating] = useState(false)
    const [showAI, setShowAI] = useState(false)
    const [jobDescription, setJobDescription] = useState('')
    const [isAILoading, setIsAILoading] = useState(false)

    const handleGenerateAI = async () => {
        if (!jobDescription.trim()) {
            showError("Please provide a job description.");
            return;
        }

        setIsAILoading(true);
        try {
            // Smart template-based AI generation (offline)
            const generated = generateSmartCoverLetter({
                jobDescription: jobDescription.trim(),
                senderFirstName: coverLetter.senderFirstName,
                senderLastName: coverLetter.senderLastName,
                companyName: coverLetter.companyName,
                recipientName: coverLetter.recipientName,
                recipientTitle: coverLetter.recipientTitle
            });

            setCoverLetter(prev => ({
                ...prev,
                openingParagraph: generated.openingParagraph,
                bodyParagraphs: generated.bodyParagraphs,
                closingParagraph: generated.closingParagraph
            }));

            success("✨ Cover letter generated successfully!");
        } catch (err) {
            console.error("Generation Error:", err);
            showError(err.message || "Failed to generate cover letter.");
        } finally {
            setIsAILoading(false);
        }
    };

    const generateSmartCoverLetter = (data) => {
        const { jobDescription, senderFirstName, senderLastName, companyName, recipientName, recipientTitle } = data;
        
        // Extract key skills and requirements from job description
        const jobKeywords = extractKeywords(jobDescription);
        const skills = jobKeywords.filter(kw => kw.length < 30).slice(0, 5);
        const isLead = jobDescription.toLowerCase().includes('lead') || jobDescription.toLowerCase().includes('senior');
        
        // Opening paragraph
        const position = jobDescription.split('\n')[0] || 'position';
        const openingParagraph = `Dear ${recipientName || 'Hiring Manager'},

I am writing to express my strong interest in the ${position} position at ${companyName || '[Company Name]'}. With my proven track record of delivering results and commitment to excellence, I am confident that my skills and experience make me an ideal candidate for this role.`;

        // First body paragraph - focus on relevant experience
        const bodyPara1 = `Throughout my professional career, I have developed a strong foundation in ${skills[0] || 'key technologies and methodologies'}${skills[1] ? ` and ${skills[1]}` : ''}. My experience has equipped me with the ability to ${extractAction(jobDescription) || 'drive impactful results'} while maintaining high standards of quality and innovation. I have consistently demonstrated my ability to ${extractSecondAction(jobDescription) || 'collaborate effectively with cross-functional teams'} to achieve organizational goals.`;

        // Second body paragraph - focus on skills fit
        const bodyPara2 = `I am particularly drawn to this opportunity because it aligns perfectly with my professional growth aspirations and values. The emphasis on ${skills[2] || 'driving innovation'} resonates deeply with my approach to problem-solving. Furthermore, my expertise in ${skills[3] || 'strategic planning'} and ${skills[4] || 'team leadership'} positions me to make immediate contributions to your organization. I am excited about the opportunity to bring my unique perspective and work ethic to ${companyName || 'your team'}.`;

        // Closing paragraph
        const closingParagraph = `Thank you for considering my application. I would welcome the opportunity to discuss how my background, skills, and enthusiasm can contribute to the continued success of ${companyName || 'your organization'}. I am available for an interview at your earliest convenience and can be reached at the contact information provided.

Sincerely,
${senderFirstName} ${senderLastName}`;

        return {
            openingParagraph,
            bodyParagraphs: [bodyPara1, bodyPara2],
            closingParagraph
        };
    };

    const extractKeywords = (text) => {
        const words = text.toLowerCase().match(/\b[a-z]+(?:\s+[a-z]+)?\b/g) || [];
        const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'be', 'by', 'from', 'as', 'was', 'were', 'been', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'it', 'that', 'this', 'which', 'who', 'what', 'where', 'when', 'why', 'how']);
        return words.filter(w => !stopwords.has(w) && w.length > 4);
    };

    const extractAction = (text) => {
        const actions = ['drive innovation', 'optimize performance', 'improve efficiency', 'enhance user experience', 'scale operations', 'solve complex problems', 'lead initiatives'];
        const lowerText = text.toLowerCase();
        return actions.find(action => lowerText.includes(action.split(' ')[0])) || 'deliver exceptional results';
    };

    const extractSecondAction = (text) => {
        const actions = ['collaborate effectively', 'work cross-functionally', 'communicate clearly', 'build strong relationships', 'mentor team members', 'mentor colleagues'];
        const lowerText = text.toLowerCase();
        return actions.find(action => lowerText.includes(action.split(' ')[0])) || 'collaborate with diverse teams';
    };

    const handleInputChange = (field, value) => {
        setCoverLetter(prev => ({ ...prev, [field]: value }))
    }

    const handleBodyParagraphChange = (index, value) => {
        const newParagraphs = [...coverLetter.bodyParagraphs]
        newParagraphs[index] = value
        setCoverLetter(prev => ({ ...prev, bodyParagraphs: newParagraphs }))
    }

    const addBodyParagraph = () => {
        setCoverLetter(prev => ({
            ...prev,
            bodyParagraphs: [...prev.bodyParagraphs, '']
        }))
    }

    const removeBodyParagraph = (index) => {
        setCoverLetter(prev => ({
            ...prev,
            bodyParagraphs: prev.bodyParagraphs.filter((_, i) => i !== index)
        }))
    }

    const handleSave = async () => {
        if (!user) {
            showError('Please sign in to save your cover letter')
            return
        }

        if (!title.trim()) {
            showError('Please enter a title for your cover letter')
            return
        }

        setLoading(true)
        try {
            const dbUserId = getDbUserId(user)
            if (!dbUserId) {
                throw new Error('Unable to identify your account')
            }

            // Simple insert - no select, no extra parameters
            const { error } = await supabase
                .from('cover_letters')
                .insert({
                    user_id: dbUserId,
                    title: title.trim(),
                    data: coverLetter
                })

            if (error) {
                console.error('Save error:', error)
                throw error
            }

            success(`✅ Cover letter saved!`)
            
            // Clear form
            setTitle('')
            setCoverLetter({
                recipientName: '',
                recipientTitle: '',
                companyName: '',
                hireDate: new Date().toISOString().split('T')[0],
                senderFirstName: '',
                senderLastName: '',
                senderEmail: '',
                senderPhone: '',
                openingParagraph: '',
                bodyParagraphs: ['', ''],
                closingParagraph: '',
            })
            
            // Navigate to dashboard
            setTimeout(() => navigate('/student'), 800)
        } catch (err) {
            console.error('Error:', err)
            showError('Failed to save: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadPDF = async () => {
        setIsGenerating(true)
        const element = document.getElementById('cover-letter-capture')
        try {
            if (!element) throw new Error('Could not find document element')

            // Force visibility for capture then hide
            element.style.display = 'block'
            
            // Wait for render to complete
            await new Promise(resolve => setTimeout(resolve, 800))

            await exportElementToPaginatedPdf(element, `CoverLabel-${coverLetter.companyName || 'Response'}.pdf`)

            success('Cover letter downloaded as PDF!')
        } catch (err) {
            showError('Failed to generate PDF: ' + err.message)
        } finally {
            if (element) element.style.display = 'none'
            setIsGenerating(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ 
                minHeight: '100vh', 
                background: '#f8fafc', 
                paddingTop: '6rem', 
                paddingBottom: '4rem', 
                paddingLeft: '5%', 
                paddingRight: '5%' 
            }}
        >
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <Link to="/student" style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        color: '#64748b', 
                        textDecoration: 'none', 
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        transition: 'color 0.2s'
                    }}>
                        <ArrowLeft size={18} /> Back to Dashboard
                    </Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '3rem', alignItems: 'flex-start' }}>
                    {/* Form Editor */}
                    <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Cover Letter Builder</h2>
                            <p style={{ color: '#64748b', fontWeight: 500 }}>Create a professional cover letter that gets you hired.</p>
                        </div>

                        {/* Title Section */}
                        <SectionTitle title="Document Title" />
                        <div style={{ marginBottom: '2.5rem' }}>
                            <InputField 
                                label="Give your cover letter a name" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                placeholder="e.g. Google - Software Engineer" 
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <SectionTitle title="Recipient Information" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2.5rem' }}>
                                    <InputField 
                                        label="Recipient Name" 
                                        value={coverLetter.recipientName} 
                                        onChange={(e) => handleInputChange('recipientName', e.target.value)} 
                                        placeholder="e.g. Hiring Manager" 
                                    />
                                    <InputField 
                                        label="Recipient Title" 
                                        value={coverLetter.recipientTitle} 
                                        onChange={(e) => handleInputChange('recipientTitle', e.target.value)} 
                                        placeholder="e.g. Head of Talent" 
                                    />
                                    <InputField 
                                        label="Company Name" 
                                        value={coverLetter.companyName} 
                                        onChange={(e) => handleInputChange('companyName', e.target.value)} 
                                        placeholder="e.g. Google, Inc." 
                                    />
                                </div>
                            </div>

                            <div>
                                <SectionTitle title="Your Contact Details" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
                                    <InputField 
                                        label="First Name" 
                                        value={coverLetter.senderFirstName} 
                                        onChange={(e) => handleInputChange('senderFirstName', e.target.value)} 
                                        placeholder="John" 
                                    />
                                    <InputField 
                                        label="Last Name" 
                                        value={coverLetter.senderLastName} 
                                        onChange={(e) => handleInputChange('senderLastName', e.target.value)} 
                                        placeholder="Doe" 
                                    />
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <InputField 
                                            label="Email Address" 
                                            value={coverLetter.senderEmail} 
                                            onChange={(e) => handleInputChange('senderEmail', e.target.value)} 
                                            placeholder="john.doe@example.com" 
                                        />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <InputField 
                                            label="Phone Number" 
                                            value={coverLetter.senderPhone} 
                                            onChange={(e) => handleInputChange('senderPhone', e.target.value)} 
                                            placeholder="+1 (555) 000-0000" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Generator Toggle */}
                        <div style={{ 
                            marginBottom: '2.5rem', 
                            padding: '1.5rem', 
                            background: showAI ? '#f0fdfa' : '#f8fafc',
                            borderRadius: '16px',
                            border: showAI ? '1px solid #ccfbf1' : '1px solid #e2e8f0',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '32px', height: '32px', background: showAI ? '#0d9488' : '#64748b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        <Sparkles size={16} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>AI Content Helper</h3>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Let Gemini AI draft your letter based on your resume</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowAI(!showAI)}
                                    style={{ 
                                        padding: '0.5rem 1rem', background: showAI ? '#0d9488' : '#fff', color: showAI ? '#fff' : '#0f172a', 
                                        border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700, cursor: 'pointer',
                                        fontSize: '0.8rem', transition: 'all 0.2s'
                                    }}
                                >
                                    {showAI ? 'Hide AI Options' : 'Use AI Generator'}
                                </button>
                            </div>

                            {showAI && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    style={{ marginTop: '1.5rem', pt: '1.5rem', borderTop: '1px solid #ccfbf1' }}
                                >
                                    <div style={{ display: 'grid', gap: '1.25rem', marginTop: '1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Target Job Description</label>
                                            </div>
                                            <InputField
                                            label="Target Job Description" 
                                            value={jobDescription}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                            placeholder="Paste the job description here..."
                                            multiline
                                            rows={4}
                                        />
                                        <button 
                                            onClick={handleGenerateAI}
                                            disabled={isAILoading || !jobDescription.trim()}
                                            style={{ 
                                                background: '#0d9488', color: 'white', padding: '0.8rem', borderRadius: '10px', 
                                                fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', 
                                                alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                opacity: (isAILoading || !jobDescription.trim()) ? 0.7 : 1
                                            }}
                                        >
                                            {isAILoading ? "Generating with Gemini..." : <><Sparkles size={16} /> Generate with AI</>}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Content Section */}
                        <SectionTitle title="Cover Letter Content" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <InputField 
                                label="Opening Paragraph" 
                                value={coverLetter.openingParagraph} 
                                onChange={(e) => handleInputChange('openingParagraph', e.target.value)} 
                                placeholder="Tell them why you're writing..." 
                                multiline 
                                rows={4} 
                            />

                            {coverLetter.bodyParagraphs.map((para, idx) => (
                                <div key={idx}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Body Paragraph {idx + 1}</label>
                                        {coverLetter.bodyParagraphs.length > 1 && (
                                            <button
                                                onClick={() => removeBodyParagraph(idx)}
                                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <InputField 
                                        value={para} 
                                        onChange={(e) => handleBodyParagraphChange(idx, e.target.value)} 
                                        placeholder="Add more details about your experience..." 
                                        multiline 
                                        rows={4} 
                                    />
                                </div>
                            ))}

                            <button
                                onClick={addBodyParagraph}
                                style={{ 
                                    width: '100%', padding: '1rem', background: '#f0fdf4', color: '#166534', 
                                    border: '2px dashed #bbf7d0', borderRadius: '12px', fontWeight: 800, 
                                    cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', 
                                    justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s'
                                }}
                            >
                                <Plus size={16} /> Add Another Paragraph
                            </button>

                            <InputField 
                                label="Closing Paragraph" 
                                value={coverLetter.closingParagraph} 
                                onChange={(e) => handleInputChange('closingParagraph', e.target.value)} 
                                placeholder="Wrap up with a call to action..." 
                                multiline 
                                rows={4} 
                            />
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', paddingTop: '2rem', borderTop: '1.5px solid #f1f5f9' }}>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                style={{
                                    flex: 1, padding: '1rem', background: '#0f172a', color: '#fff', border: 'none',
                                    borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', 
                                    alignItems: 'center', justifyContent: 'center', gap: '0.6rem', transition: 'transform 0.2s'
                                }}
                            >
                                <Save size={18} /> {loading ? 'Saving...' : 'Save Draft'}
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                disabled={isGenerating}
                                style={{
                                    flex: 1, padding: '1rem', background: '#2563eb', color: '#fff', border: 'none',
                                    borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', 
                                    alignItems: 'center', justifyContent: 'center', gap: '0.6rem', transition: 'transform 0.2s'
                                }}
                            >
                                <Download size={18} /> {isGenerating ? 'Generating...' : 'Download PDF'}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Mini Preview Section */}
                    <div style={{ position: 'sticky', top: '6rem' }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '0.5rem', 
                            marginBottom: '1rem' 
                        }}>
                             <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                             <span style={{ fontSize: '0.65rem', fontWeight: 950, color: '#64748b', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Preview Document</span>
                        </div>

                        <div style={{ 
                            background: '#fff', 
                            borderRadius: '16px', 
                            boxShadow: '0 20px 50px rgba(0,0,0,0.08)', 
                            overflow: 'hidden',
                            border: '1px solid #f1f5f9',
                            position: 'relative',
                            width: '400px',
                            height: '565px' // Scaled down A4 height (1123 * 0.5 approximately)
                        }}>
                            <div style={{ 
                                transform: 'scale(0.504)', // 400 / 794
                                transformOrigin: 'top left',
                                width: '794px',
                                height: '1123px',
                                background: '#fff'
                            }}>
                                <div
                                    id="cover-letter-document"
                                    style={{
                                        padding: '4rem', 
                                        fontFamily: 'Georgia, serif',
                                        fontSize: '1rem', 
                                        lineHeight: 1.6, 
                                        color: '#333',
                                        height: '100%',
                                        background: '#fff'
                                    }}
                                >
                                    {/* Sender Info */}
                                    <div style={{ marginBottom: '3rem' }}>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111' }}>
                                            {coverLetter.senderFirstName} {coverLetter.senderLastName}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.2rem' }}>
                                            {coverLetter.senderEmail} {coverLetter.senderPhone && `• ${coverLetter.senderPhone}`}
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div style={{ marginBottom: '2.5rem', fontSize: '1.2rem' }}>
                                        {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>

                                    {/* Recipient Info */}
                                    <div style={{ marginBottom: '3rem' }}>
                                        <div style={{ fontWeight: 700 }}>{coverLetter.recipientName}</div>
                                        <div>{coverLetter.recipientTitle}</div>
                                        <div style={{ fontWeight: 700 }}>{coverLetter.companyName}</div>
                                    </div>

                                    {/* Salutation */}
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        Dear {coverLetter.recipientName || 'Hiring Manager'},
                                    </div>

                                    {/* Paragraphs */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                        {coverLetter.openingParagraph && <p>{coverLetter.openingParagraph}</p>}
                                        
                                        {coverLetter.bodyParagraphs.map((para, idx) => (
                                            para && <p key={idx}>{para}</p>
                                        ))}
                                        
                                        {coverLetter.closingParagraph && <p>{coverLetter.closingParagraph}</p>}
                                    </div>

                                    {/* Sign-off */}
                                    <div style={{ marginTop: '3.5rem' }}>
                                        <div style={{ marginBottom: '2.5rem' }}>Sincerely,</div>
                                        <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>
                                            {coverLetter.senderFirstName} {coverLetter.senderLastName}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Capture Element (A4 dimensions at 96 DPI) */}
            <div
                id="cover-letter-capture"
                style={{
                    display: 'none',
                    position: 'absolute',
                    top: '-10000px',
                    left: '-10000px',
                    width: '794px',
                    height: '1123px',
                    padding: '80px',
                    fontFamily: 'georgia, serif',
                    lineHeight: 1.6,
                    background: 'white',
                    color: '#000',
                    fontSize: '12pt',
                    boxSizing: 'border-box'
                }}
            >
                {/* Sender Header */}
                <div style={{ marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                    <div style={{ fontSize: '24pt', fontWeight: 900 }}>{coverLetter.senderFirstName} {coverLetter.senderLastName}</div>
                    <div style={{ color: '#666', fontSize: '10pt', marginTop: '5px' }}>
                        {coverLetter.senderEmail} {coverLetter.senderPhone && `| ${coverLetter.senderPhone}`}
                    </div>
                </div>

                {/* Date */}
                <div style={{ marginBottom: '30px', fontWeight: 600 }}>
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>

                {/* Recipient */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ fontWeight: 700 }}>{coverLetter.recipientName}</div>
                    <div>{coverLetter.recipientTitle}</div>
                    <div style={{ fontWeight: 700 }}>{coverLetter.companyName}</div>
                </div>

                {/* Salutation */}
                <div style={{ marginBottom: '20px' }}>Dear {coverLetter.recipientName || 'Hiring Manager'},</div>

                {/* Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'justify' }}>
                    {coverLetter.openingParagraph && <p style={{ margin: 0 }}>{coverLetter.openingParagraph}</p>}
                    {coverLetter.bodyParagraphs.map((para, idx) => (
                        para && <p key={idx} style={{ margin: 0 }}>{para}</p>
                    ))}
                    {coverLetter.closingParagraph && <p style={{ margin: 0 }}>{coverLetter.closingParagraph}</p>}
                </div>

                {/* Sign-off */}
                <div style={{ marginTop: '60px' }}>
                    <div style={{ marginBottom: '40px' }}>Sincerely,</div>
                    <div style={{ fontWeight: 900, fontSize: '14pt' }}>{coverLetter.senderFirstName} {coverLetter.senderLastName}</div>
                </div>
            </div>
        </motion.div>
    )
}

const SectionTitle = ({ title }) => (
    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', tracking: '0.01em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '4px', height: '14px', background: '#3b82f6', borderRadius: '4px' }} />
        {title}
    </h3>
)

const InputField = ({ label, value, onChange, placeholder, multiline = false, rows = 1, style }) => {
    const Component = multiline ? 'textarea' : 'input'
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%', ...style }}>
            {label && <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.01em' }}>{label}</label>}
            <Component
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: '#1e293b',
                    background: '#ffffff',
                    outline: 'none',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    fontFamily: 'inherit',
                    resize: 'none'
                }}
                onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2563eb'
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.08)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)'
                    e.currentTarget.style.transform = 'translateY(0)'
                }}
            />
        </div>
    )
}

