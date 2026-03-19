const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

// Initialize Express App
const app = express();
app.use(cors());
app.use(express.json());

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
            model: 'claude-haiku-4-5-20251001',
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

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`🚀 Persevex Resume Maker API running on port ${PORT}`);
    console.log(`📊 Supabase URL: ${supabaseUrl}`);
});
