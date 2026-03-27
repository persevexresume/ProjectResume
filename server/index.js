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

// Resume parse API route (Claude)
app.post('/api/parse-resume', async (req, res) => {
    try {
        const { resumeText } = req.body;

        if (!resumeText || typeof resumeText !== 'string') {
            return res.status(400).json({ error: 'resumeText is required' });
        }

        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genieApiKey = process.env.GEMINI_API_KEY;
        if (!genieApiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is not configured for resume parsing.' });
        }

        const genAI = new GoogleGenerativeAI(genieApiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `You are a world-class resume parser. Extract ALL information from the resume text below into a structured JSON object.
    Be absolutely exhaustive and do NOT omit any detail.
    Accuracy is paramount.

    Rules:
    - Capture every section from the resume, even if titles differ (e.g., internships, leadership, achievements, coursework, training, publications).
    - For experience, projects, education and certifications, include ALL entries found in the resume.
    - Preserve details from bullet points inside each entry by combining them into description text.
    - Extract every skill token (tools, technologies, frameworks, platforms, soft skills where listed).
    - If a value is not found, return an empty string (or empty array for lists), never null.

JSON Schema:
{
  "personalInfo": {
    "firstName": "String",
    "lastName": "String",
    "email": "String",
    "phone": "String",
        "address": "Street/Local address if available",
        "city": "City name if available",
        "country": "Country name if available",
        "pinCode": "Postal/ZIP code if available",
    "location": "City, Country",
    "title": "Current Job Title or Headline",
    "summary": "Professional Summary",
    "profilePhoto": "null (leave null)",
    "linkedin": "URL or empty",
    "github": "URL or empty",
    "website": "URL or empty"
  },
  "experience": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "startDate": "Date",
      "endDate": "Date or Present",
      "description": "Bullet points joined by '. '"
    }
  ],
  "education": [
    {
      "school": "University Name",
      "degree": "Degree and Major",
      "endDate": "Date",
      "gpa": "String (if any)",
      "description": "Any additional honors"
    }
  ],
  "skills": [
    { "name": "Skill Name", "level": "Beginner|Intermediate|Advanced|Expert" }
  ],
  "projects": [
        { "name": "Name", "description": "Story with all bullet details", "link": "URL", "startDate": "Date", "endDate": "Date" }
  ],
  "certifications": [
        { "name": "Name", "issuer": "Org", "issueDate": "Date", "expiryDate": "Date", "credentialId": "String", "link": "URL" }
  ]
}

Resume Text:
${resumeText}`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        
        // Robust JSON extraction
        let parsed;
        try {
            // Remove markdown formatting if present
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, responseText];
            const cleanSource = jsonMatch[1].trim();
            parsed = JSON.parse(cleanSource);
        } catch (parseError) {
            console.error('Failed to parse Gemini JSON:', responseText);
            throw new Error('AI returned malformed JSON data');
        }

        res.json({ success: true, data: parsed });
    } catch (error) {
        console.error('Resume Parse Error:', error);
        res.status(500).json({ 
            error: 'Resume parsing failed',
            details: error.message 
        });
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

        const prompt = `You are an expert ATS (Applicant Tracking System) parser and an elite resume reviewer. Analyze the resume against the job description.
CRITICAL RULE: Your feedback MUST be highly specific and actionable. Do NOT give generic advice like "Add more keywords" or "Quantify achievements". Instead, quote a specific bullet point from their experience and show how to improve it (e.g., "Change 'Helped with project' to 'Spearheaded project X leading to Y% increase'"). Give exact action verbs they should use based on the job description.

Return ONLY valid JSON matching this schema exactly (no markdown, no preamble):
{
  "overall_score": 0-100,
  "verdict": "Excellent|Good|Needs Improvement|Weak",
  "keyword_analysis": { "matched": [], "missing": [], "match_percent": 0-100 },
  "sections": { 
    "contact": {"score": 0-100, "status": "pass|warning|fail", "issues": []}, 
    "summary": {"score": 0-100, "status": "pass|warning|fail", "issues": ["Provide highly specific critique referencing their exact summary text"]}, 
    "experience": {"score": 0-100, "status": "pass|warning|fail", "issues": ["Quote specific bullets and rewrite them to be stronger"]}, 
    "education": {"score": 0-100, "status": "pass|warning|fail", "issues": []}, 
    "skills": {"score": 0-100, "status": "pass|warning|fail", "issues": ["List EXACT strings from the JD they are missing"]} 
  },
  "formatting_issues": ["List any formatting issues"],
  "strengths": ["List specific strengths"],
  "recommendations": ["Highly actionable step 1...", "Highly actionable step 2..."],
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

// ==================== COVER LETTER GENERATOR ====================

app.post('/api/generate-cover-letter', async (req, res) => {
    try {
        const {
            resumeData,
            jobDescription,
            companyName,
            recipientName,
            recipientTitle,
            senderFirstName,
            senderLastName,
            senderEmail,
            senderPhone
        } = req.body;

        if (!jobDescription || typeof jobDescription !== 'string') {
            return res.status(400).json({ error: 'jobDescription is required.' });
        }

        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genieApiKey = process.env.GEMINI_API_KEY;
        if (!genieApiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
        }

        const genAI = new GoogleGenerativeAI(genieApiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `You are an expert career coach and professional copywriter.
Write a highly compelling, tailored cover letter based on the provided job description and candidate context.
The cover letter should match the tone and strict formatting required.

Candidate Context:
${JSON.stringify({
    senderFirstName: senderFirstName || '',
    senderLastName: senderLastName || '',
    senderEmail: senderEmail || '',
    senderPhone: senderPhone || '',
    resumeData: resumeData || null
}, null, 2)}

Job Description:
${jobDescription}

Target Company: ${companyName || '[Company Name]'}
Hiring Manager / Recipient Name: ${recipientName || 'Hiring Manager'}
Recipient Title: ${recipientTitle || ''}

Return ONLY valid JSON (no markdown, no preamble) with this exact schema:
{
  "openingParagraph": "A strong hook explaining why the applicant is writing and what position they are applying for.",
  "bodyParagraphs": [
    "Paragraph focusing on past experience and quantifiable achievements relevant to the job.",
    "Paragraph focusing on skills, cultural fit, and why the applicant is uniquely suited for the company."
  ],
  "closingParagraph": "A professional closing with a call to action for an interview."
}

Ensure the paragraphs are professional, engaging, and directly connect the user's resume achievements to the job description's requirements.`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        
        let clResult;
        try {
            // Remove markdown formatting if present
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, responseText];
            const cleanSource = jsonMatch[1].trim();
            clResult = JSON.parse(cleanSource);
        } catch (parseError) {
            console.error('Failed to parse Gemini cover letter response:', responseText);
            return res.status(500).json({ 
                error: 'Failed to parse AI cover letter response',
                details: parseError.message 
            });
        }

        res.json({ success: true, data: clResult });
    } catch (error) {
        console.error('Cover Letter Gen Error:', error);
        res.status(500).json({ 
            error: 'Cover letter generation failed',
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
