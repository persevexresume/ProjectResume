import { motion } from 'framer-motion';
import { Upload, PenTool, ArrowLeft, Loader } from 'lucide-react';
import { useState } from 'react';
import { extractResumeFromPDF, validateResumeData } from '../lib/geminiExtractor';
import { useToast } from '../context/ToastContext';

export default function MasterProfileOptions({ onSelectOption, user }) {
    const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
    const [isExtracting, setIsExtracting] = useState(false);

    const handleUploadResume = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toastError('Please upload a PDF file');
            return;
        }

        setIsExtracting(true);
        toastInfo('Extracting resume data... This may take a moment.');

        try {
            const result = await extractResumeFromPDF(file);

            if (!result.success) {
                toastError(`Extraction failed: ${result.error}`);
                setIsExtracting(false);
                return;
            }

            const cleanedData = validateResumeData(result.data);
            toastSuccess('Resume data extracted successfully!');
            
            // Pass the extracted data to parent
            onSelectOption('upload', cleanedData, file);
        } catch (error) {
            toastError(`Error: ${error.message}`);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleCreateProfile = () => {
        // Pass empty template for manual creation
        onSelectOption('create', {
            personalInfo: {
                firstName: '',
                lastName: '',
                title: '',
                email: user?.email || '',
                phone: '',
                location: '',
                country: '',
                summary: '',
                profilePhoto: ''
            },
            experience: [],
            education: [],
            skills: []
        });
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                    maxWidth: '900px',
                    width: '100%'
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '3rem', color: '#0f172a' }}>
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        style={{
                            fontSize: '2.5rem',
                            fontWeight: 900,
                            marginBottom: '0.5rem'
                        }}
                    >
                        Build Your Master Profile
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            fontSize: '1.1rem',
                            opacity: 0.9
                        }}
                    >
                        Choose how you want to create your professional profile
                    </motion.p>
                </div>

                {/* Options Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '2rem',
                    marginBottom: '2rem'
                }}>
                    {/* Upload Resume Option */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        onClick={() => !isExtracting && document.getElementById('pdf-upload')?.click()}
                        style={{
                            background: '#fff',
                            borderRadius: '20px',
                            padding: '2.5rem',
                            cursor: isExtracting ? 'not-allowed' : 'pointer',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                            border: '2px solid transparent',
                            transition: 'all 0.3s',
                            opacity: isExtracting ? 0.6 : 1
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#667eea';
                            e.currentTarget.style.boxShadow = '0 20px 60px rgba(102, 126, 234, 0.3)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'transparent';
                            e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.15)';
                        }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            {isExtracting ? (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <Loader size={48} style={{
                                        margin: '0 auto',
                                        color: '#667eea',
                                        animation: 'spin 1s linear infinite'
                                    }} />
                                </div>
                            ) : (
                                <Upload size={48} style={{
                                    margin: '0 auto 1.5rem',
                                    color: '#667eea'
                                }} />
                            )}
                            <h3 style={{
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                marginBottom: '0.75rem',
                                color: '#1e293b'
                            }}>
                                {isExtracting ? 'Extracting Data...' : 'Upload Resume'}
                            </h3>
                            <p style={{
                                color: '#64748b',
                                marginBottom: '1rem',
                                lineHeight: 1.6
                            }}>
                                {isExtracting 
                                    ? 'Please wait while we extract your information from the PDF...'
                                    : 'Upload your existing resume as a PDF. We\'ll automatically extract your information using AI.'
                                }
                            </p>
                            <div style={{
                                background: '#f1f5f9',
                                padding: '1rem',
                                borderRadius: '12px',
                                color: '#64748b',
                                fontSize: '0.9rem'
                            }}>
                                📄 PDF Format • AI-Powered Extraction • 2 Minutes
                            </div>
                        </div>
                        <input
                            id="pdf-upload"
                            type="file"
                            accept=".pdf"
                            onChange={handleUploadResume}
                            disabled={isExtracting}
                            style={{ display: 'none' }}
                        />
                    </motion.div>

                    {/* Create Profile Option */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        onClick={handleCreateProfile}
                        style={{
                            background: '#fff',
                            borderRadius: '20px',
                            padding: '2.5rem',
                            cursor: 'pointer',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                            border: '2px solid transparent',
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#764ba2';
                            e.currentTarget.style.boxShadow = '0 20px 60px rgba(118, 75, 162, 0.3)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'transparent';
                            e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.15)';
                        }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <PenTool size={48} style={{
                                margin: '0 auto 1.5rem',
                                color: '#764ba2'
                            }} />
                            <h3 style={{
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                marginBottom: '0.75rem',
                                color: '#1e293b'
                            }}>
                                Create Profile Manually
                            </h3>
                            <p style={{
                                color: '#64748b',
                                marginBottom: '1rem',
                                lineHeight: 1.6
                            }}>
                                Manually fill in your professional information step by step. Take your time to create a perfect profile.
                            </p>
                            <div style={{
                                background: '#f1f5f9',
                                padding: '1rem',
                                borderRadius: '12px',
                                color: '#64748b',
                                fontSize: '0.9rem'
                            }}>
                                ✏️ Custom Input • Full Control • 5 Minutes
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Info Box */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        color: '#fff',
                        textAlign: 'center',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                        💡 <strong>Pro Tip:</strong> You can always edit your profile later. Choose the option that works best for you!
                    </p>
                </motion.div>

                {/* Add spinning animation style */}
                <style>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </motion.div>
        </div>
    );
}
