const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

// Initialize Express App
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required env vars: SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// PORT
const PORT = process.env.PORT || 5000;

// ==================== ROUTES ====================

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Persevex Resume Maker API is running.' });
});

// Get user resumes
app.get('/api/resumes/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const { data, error } = await supabase
            .from('resumes')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching resumes:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save resume
app.post('/api/resumes', async (req, res) => {
    try {
        const { userId, title, data, customization, template } = req.body;

        if (!userId || !data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: savedResume, error } = await supabase
            .from('resumes')
            .insert([
                {
                    user_id: userId,
                    title: title || 'Untitled Resume',
                    data,
                    customization: customization || {},
                    template: template || '',
                    updated_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ success: true, data: savedResume });
    } catch (error) {
        console.error('Error saving resume:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update resume
app.put('/api/resumes/:resumeId', async (req, res) => {
    try {
        const { resumeId } = req.params;
        const { title, data, customization, template } = req.body;

        const { data: updatedResume, error } = await supabase
            .from('resumes')
            .update({
                title: title || 'Untitled Resume',
                data,
                customization: customization || {},
                template: template || '',
                updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ success: true, data: updatedResume });
    } catch (error) {
        console.error('Error updating resume:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete resume
app.delete('/api/resumes/:resumeId', async (req, res) => {
    try {
        const { resumeId } = req.params;

        const { error } = await supabase
            .from('resumes')
            .delete()
            .eq('id', resumeId);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ success: true, message: 'Resume deleted successfully' });
    } catch (error) {
        console.error('Error deleting resume:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user profile
app.get('/api/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('id', userId)
            .single();

        if (!studentError && student) {
            return res.json({ success: true, data: student, role: 'student' });
        }

        const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', userId)
            .single();

        if (!adminError && admin) {
            return res.json({ success: true, data: admin, role: 'admin' });
        }

        res.status(404).json({ error: 'User not found' });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== ATS CHECKER ====================

// Resume parse API route (Gemini)
app.post('/api/parse-resume', async (req, res) => {
        try {
                const { resumeText } = req.body;

                if (!resumeText || typeof resumeText !== 'string') {
                        return res.status(400).json({ error: 'resumeText is required' });
                }

                const geminiApiKey = process.env.GEMINI_API_KEY;
                if (!geminiApiKey) {
                        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
                }

                const prompt = `Extract structured resume data from the provided text. Return ONLY valid JSON (no markdown, no explanation) with this schema:
{
    "personalInfo": {
        "firstName": "",
        "lastName": "",
        "email": "",
        "phone": "",
        "location": "",
        "title": "",
        "summary": "",
        "linkedin": "",
        "github": "",
        "website": ""
    },
    "experience": [
        {
            "role": "",
            "company": "",
            "location": "",
            "startDate": "",
            "endDate": "",
            "description": ""
        }
    ],
    "education": [
        {
            "degree": "",
            "school": "",
            "location": "",
            "startDate": "",
            "endDate": "",
            "description": ""
        }
    ],
    "skills": [{ "name": "", "level": "Advanced" }],
    "projects": [{ "name": "", "description": "", "link": "" }],
    "certifications": [{ "name": "", "issuer": "", "issueDate": "", "expiryDate": "", "credentialId": "", "link": "" }]
}

Rules:
- Keep unknown fields as empty strings.
- Keep arrays empty if missing.
- Do not invent fake details.

Resume Text:
${resumeText}`;

                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
                const geminiResponse = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                                generationConfig: {
                                        temperature: 0.2,
                                        maxOutputTokens: 2048,
                                        responseMimeType: 'application/json'
                                }
                        })
                });

                const geminiData = await geminiResponse.json();

                if (!geminiResponse.ok) {
                        const message = geminiData?.error?.message || 'Gemini API request failed';
                        return res.status(500).json({ error: message });
                }

                const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

                // Handle both plain JSON and accidental fenced JSON.
                const cleaned = rawText
                        .replace(/^```json\s*/i, '')
                        .replace(/^```\s*/i, '')
                        .replace(/```$/i, '')
                        .trim();

                let parsed;
                try {
                        parsed = JSON.parse(cleaned);
                } catch (parseError) {
                        console.error('Gemini parse JSON error:', parseError, cleaned);
                        return res.status(500).json({ error: 'Failed to parse Gemini response JSON' });
                }

                res.json({ success: true, data: parsed });
        } catch (error) {
                console.error('Resume parse error:', error);
                res.status(500).json({ error: 'Resume parse failed', details: error.message });
        }
});

// ATS Check API route
app.post('/api/ats-check', async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body;

        if (!resumeText || !jobDescription) {
            return res.status(400).json({ 
                error: 'Resume text and job description are required' 
            });
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            console.error('Missing ANTHROPIC_API_KEY in environment variables');
            return res.status(500).json({ 
                error: 'ATS checker not configured. Please add ANTHROPIC_API_KEY to .env' 
            });
        }

        const client = new Anthropic({ apiKey });

        const prompt = `You are a professional ATS analyzer. Analyze the resume against the job description. Return ONLY valid JSON, no markdown, no explanation:
{
  "overall_score": 0-100,
  "verdict": "Excellent|Good|Needs Improvement|Weak",
  "keyword_analysis": { "matched": [], "missing": [], "match_percent": 0-100 },
  "sections": { 
    "contact": {"score": 0-100, "status": "pass|warning|fail", "issues": []}, 
    "summary": {"score": 0-100, "status": "pass|warning|fail", "issues": []}, 
    "experience": {"score": 0-100, "status": "pass|warning|fail", "issues": []}, 
    "education": {"score": 0-100, "status": "pass|warning|fail", "issues": []}, 
    "skills": {"score": 0-100, "status": "pass|warning|fail", "issues": []} 
  },
  "formatting_issues": [],
  "strengths": [],
  "recommendations": [],
  "estimated_pass_rate": "High|Medium|Low"
}

Resume:
${resumeText}

Job Description:
${jobDescription}`;

        const message = await client.messages.create({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 2048,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
        
        // Parse JSON response
        let atsResult;
        try {
            atsResult = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse Claude response:', responseText);
            return res.status(500).json({ 
                error: 'Failed to parse ATS analysis response',
                details: parseError.message 
            });
        }

        res.json({ success: true, data: atsResult });
    } catch (error) {
        console.error('ATS Check Error:', error);
        res.status(500).json({ 
            error: 'ATS check failed',
            details: error.message 
        });
    }
});

// ==================== SCHEDULER ====================

// Setup scheduler to run every hour
cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled task - fetching external data and analytics...');
    try {
        // Example: Update resume scores based on some criteria
        const { data: resumes, error } = await supabase
            .from('resumes')
            .select('id, data');

        if (!error && resumes) {
            console.log(`Processing ${resumes.length} resumes for analytics...`);
            // Add your analytics/scoring logic here
        }
    } catch (error) {
        console.error('Scheduler error:', error);
    }
});

// ==================== FILE UPLOAD ====================

// Upload profile photo - Store as Base64 in database
app.post('/api/upload-photo', async (req, res) => {
    try {
        const { userId, fileData, fileName } = req.body;

        if (!userId || !fileData || !fileName) {
            return res.status(400).json({ error: 'Missing required fields: userId, fileData, fileName' });
        }

        // Validate file size (max 5MB for images)
        const base64Data = fileData.split(',')[1] || fileData;
        const buffer = Buffer.from(base64Data, 'base64');
        const fileSizeInMB = buffer.length / (1024 * 1024);
        
        if (fileSizeInMB > 5) {
            return res.status(400).json({ error: 'File size exceeds 5MB limit' });
        }

        // Detect MIME type from file extension or data
        const fileExtension = fileName.split('.').pop().toLowerCase();
        let mimeType = 'image/jpeg';
        
        if (fileExtension === 'png') mimeType = 'image/png';
        else if (fileExtension === 'webp') mimeType = 'image/webp';
        else if (fileExtension === 'gif') mimeType = 'image/gif';
        else if (fileExtension === 'svg') mimeType = 'image/svg+xml';

        // Return the Base64 data URL directly - it can be used as img src
        const photoUrl = `data:${mimeType};base64,${base64Data}`;

        res.json({ 
            success: true, 
            url: photoUrl,
            fileName: fileName,
            size: fileSizeInMB,
            mimeType: mimeType
        });
    } catch (error) {
        console.error('Error processing photo:', error);
        res.status(500).json({ error: error.message || 'Failed to process photo' });
    }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`🚀 Persevex Resume Maker API running on port ${PORT}`);
    console.log(`📊 Supabase URL: ${supabaseUrl}`);
});
