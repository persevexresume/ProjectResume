const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const multer = require('multer');
const pdfParse = require('pdf-parse');
require('dotenv').config();

// Initialize Express App
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

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

const cleanClaudeJsonResponse = (text = '') => {
    return String(text || '')
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
};

const extractTextContentFromClaude = (content = []) => {
    if (!Array.isArray(content)) return '';
    return content
        .filter((block) => block?.type === 'text' && typeof block.text === 'string')
        .map((block) => block.text)
        .join('\n')
        .trim();
};

const getUserIdFromRequest = (req) => {
    const headerUser = req.headers['x-user-id'];
    const bodyUser = req.body?.userId;
    const paramUser = req.params?.userId;
    return headerUser || bodyUser || paramUser || null;
};

const isMissingMasterProfilesTable = (error) => {
    const fullMessage = [error?.message, error?.details, error?.hint]
        .filter(Boolean)
        .join(' | ')
        .toLowerCase();

    return fullMessage.includes('master_profiles') &&
        (fullMessage.includes('does not exist') || fullMessage.includes('schema cache') || fullMessage.includes('not found'));
};

const isProfilesUserForeignKeyError = (error) => {
    const fullMessage = [error?.message, error?.details, error?.hint]
        .filter(Boolean)
        .join(' | ')
        .toLowerCase();

    return fullMessage.includes('profiles_user_id_fkey') ||
        (fullMessage.includes('foreign key') && fullMessage.includes('profiles') && fullMessage.includes('user_id'));
};

const isMasterProfilesUserForeignKeyError = (error) => {
    const fullMessage = [error?.message, error?.details, error?.hint]
        .filter(Boolean)
        .join(' | ')
        .toLowerCase();

    return fullMessage.includes('master_profiles_user_id_fkey') ||
        (fullMessage.includes('foreign key') && fullMessage.includes('master_profiles') && fullMessage.includes('user_id'));
};

const buildProfilesFallbackPayload = (userId, normalizedProfile) => {
    const personal = normalizedProfile?.personal || {};
    const [firstName = '', ...restName] = String(personal.fullName || '').split(/\s+/).filter(Boolean);
    const lastName = restName.join(' ');

    const resumeData = {
        personalInfo: {
            firstName,
            lastName,
            email: personal.email || '',
            phone: personal.phone || '',
            summary: normalizedProfile?.summary || '',
            location: personal.location || '',
            github: personal.githubUrl || '',
            linkedin: personal.linkedInUrl || '',
            website: personal.portfolioUrl || ''
        },
        experience: Array.isArray(normalizedProfile?.workExperience) ? normalizedProfile.workExperience.map((x) => ({
            role: x.role || '',
            company: x.company || '',
            location: x.location || '',
            startDate: x.startDate || '',
            endDate: x.endDate || '',
            description: Array.isArray(x.bullets) ? x.bullets.join(' ') : ''
        })) : [],
        education: Array.isArray(normalizedProfile?.education) ? normalizedProfile.education.map((x) => ({
            school: x.institution || '',
            degree: x.degree || '',
            location: x.location || '',
            startDate: x.startYear || '',
            endDate: x.endYear || '',
            gpa: x.gpa || ''
        })) : [],
        skills: [
            ...(normalizedProfile?.skills?.languages || []),
            ...(normalizedProfile?.skills?.frameworks || []),
            ...(normalizedProfile?.skills?.tools || []),
            ...(normalizedProfile?.skills?.databases || []),
            ...(normalizedProfile?.skills?.cloud || []),
            ...(normalizedProfile?.skills?.other || [])
        ].map((name) => ({ name, level: 'Advanced' })),
        projects: Array.isArray(normalizedProfile?.projects) ? normalizedProfile.projects.map((x) => ({
            name: x.projectName || '',
            description: x.description || '',
            link: x.liveLink || x.githubLink || ''
        })) : [],
        certifications: Array.isArray(normalizedProfile?.certifications) ? normalizedProfile.certifications.map((x) => ({
            name: x.name || '',
            issuer: x.issuer || '',
            issueDate: x.date || '',
            link: x.link || ''
        })) : []
    };

    return {
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        email: personal.email || '',
        phone: personal.phone || '',
        summary: normalizedProfile?.summary || '',
        website: personal.portfolioUrl || '',
        linkedin: personal.linkedInUrl || '',
        github: personal.githubUrl || '',
        experience_data: resumeData.experience,
        education_data: resumeData.education,
        skills_data: resumeData.skills,
        projects_data: resumeData.projects,
        certifications_data: resumeData.certifications,
        resume_data: resumeData,
        master_profile: normalizedProfile,
        updated_at: new Date().toISOString()
    };
};

const upsertProfilesFallbackAdaptive = async (userId, normalizedProfile) => {
    const payload = buildProfilesFallbackPayload(userId, normalizedProfile);

    for (let attempt = 0; attempt < 12; attempt += 1) {
        const result = await supabase
            .from('profiles')
            .upsert(payload, { onConflict: 'user_id' })
            .select('id, user_id, updated_at')
            .maybeSingle();

        if (!result.error) return result.data;

        const fullMessage = [result.error.message, result.error.details, result.error.hint]
            .filter(Boolean)
            .join(' | ');

        const missingColumnMatch =
            fullMessage.match(/Could not find the '([^']+)' column/i) ||
            fullMessage.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i);

        if (missingColumnMatch && payload[missingColumnMatch[1]] !== undefined) {
            delete payload[missingColumnMatch[1]];
            continue;
        }

        throw result.error;
    }

    throw new Error('Profiles fallback save failed after schema adaptation attempts');
};

const buildMasterProfileFromProfilesRow = (row = {}) => {
    if (row?.master_profile && typeof row.master_profile === 'object') {
        return row.master_profile;
    }

    if (row?.profile_data && typeof row.profile_data === 'object') {
        return row.profile_data;
    }

    const resumeData = row?.resume_data && typeof row.resume_data === 'object' ? row.resume_data : {};
    const personalInfo = resumeData?.personalInfo && typeof resumeData.personalInfo === 'object' ? resumeData.personalInfo : {};

    const firstName = String(personalInfo.firstName || row?.first_name || '').trim();
    const lastName = String(personalInfo.lastName || row?.last_name || '').trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    return {
        personal: {
            fullName,
            email: String(personalInfo.email || row?.email || ''),
            phone: String(personalInfo.phone || row?.phone || ''),
            location: String(personalInfo.location || ''),
            linkedInUrl: String(personalInfo.linkedin || row?.linkedin || ''),
            githubUrl: String(personalInfo.github || row?.github || ''),
            portfolioUrl: String(personalInfo.website || row?.website || '')
        },
        summary: String(personalInfo.summary || row?.summary || ''),
        education: Array.isArray(resumeData?.education) ? resumeData.education.map((item) => ({
            degree: String(item?.degree || ''),
            institution: String(item?.school || ''),
            location: String(item?.location || ''),
            startYear: String(item?.startDate || ''),
            endYear: String(item?.endDate || ''),
            gpa: String(item?.gpa || '')
        })) : [],
        workExperience: Array.isArray(resumeData?.experience) ? resumeData.experience.map((item) => ({
            company: String(item?.company || ''),
            role: String(item?.role || ''),
            location: String(item?.location || ''),
            startDate: String(item?.startDate || ''),
            endDate: String(item?.endDate || ''),
            bullets: String(item?.description || '')
                .split(/\n|\u2022|•/)
                .map((bullet) => bullet.trim())
                .filter(Boolean)
        })) : [],
        projects: Array.isArray(resumeData?.projects) ? resumeData.projects.map((item) => ({
            projectName: String(item?.name || ''),
            description: String(item?.description || ''),
            techStack: '',
            githubLink: String(item?.link || ''),
            liveLink: ''
        })) : [],
        skills: {
            languages: [],
            frameworks: [],
            tools: Array.isArray(resumeData?.skills) ? resumeData.skills.map((item) => String(item?.name || '').trim()).filter(Boolean) : [],
            databases: [],
            cloud: [],
            other: []
        },
        certifications: Array.isArray(resumeData?.certifications) ? resumeData.certifications.map((item) => ({
            name: String(item?.name || ''),
            issuer: String(item?.issuer || ''),
            date: String(item?.issueDate || ''),
            link: String(item?.link || '')
        })) : [],
        achievements: []
    };
};

const normalizeMasterProfileFromClaude = (parsed = {}) => ({
    personal: {
        fullName: String(parsed?.personal?.fullName || ''),
        email: String(parsed?.personal?.email || ''),
        phone: String(parsed?.personal?.phone || ''),
        location: String(parsed?.personal?.location || ''),
        linkedInUrl: String(parsed?.personal?.linkedin || ''),
        githubUrl: String(parsed?.personal?.github || ''),
        portfolioUrl: String(parsed?.personal?.portfolio || '')
    },
    summary: String(parsed?.summary || ''),
    education: Array.isArray(parsed?.education) ? parsed.education.map((item) => ({
        degree: String(item?.degree || ''),
        institution: String(item?.institution || ''),
        location: String(item?.location || ''),
        startYear: String(item?.startYear || ''),
        endYear: String(item?.endYear || ''),
        gpa: String(item?.gpa || '')
    })) : [],
    workExperience: Array.isArray(parsed?.workExperience) ? parsed.workExperience.map((item) => ({
        company: String(item?.company || ''),
        role: String(item?.role || ''),
        location: String(item?.location || ''),
        startDate: String(item?.startDate || ''),
        endDate: String(item?.endDate || ''),
        bullets: Array.isArray(item?.bullets) ? item.bullets.map((bullet) => String(bullet || '').trim()).filter(Boolean) : []
    })) : [],
    projects: Array.isArray(parsed?.projects) ? parsed.projects.map((item) => ({
        projectName: String(item?.name || ''),
        description: String(item?.description || ''),
        techStack: Array.isArray(item?.techStack) ? item.techStack.map((x) => String(x || '').trim()).filter(Boolean).join(', ') : String(item?.techStack || ''),
        githubLink: String(item?.githubLink || ''),
        liveLink: String(item?.liveLink || '')
    })) : [],
    skills: {
        languages: Array.isArray(parsed?.skills?.languages) ? parsed.skills.languages.map((x) => String(x || '').trim()).filter(Boolean) : [],
        frameworks: Array.isArray(parsed?.skills?.frameworks) ? parsed.skills.frameworks.map((x) => String(x || '').trim()).filter(Boolean) : [],
        tools: Array.isArray(parsed?.skills?.tools) ? parsed.skills.tools.map((x) => String(x || '').trim()).filter(Boolean) : [],
        databases: Array.isArray(parsed?.skills?.databases) ? parsed.skills.databases.map((x) => String(x || '').trim()).filter(Boolean) : [],
        cloud: Array.isArray(parsed?.skills?.cloud) ? parsed.skills.cloud.map((x) => String(x || '').trim()).filter(Boolean) : [],
        other: Array.isArray(parsed?.skills?.other) ? parsed.skills.other.map((x) => String(x || '').trim()).filter(Boolean) : []
    },
    certifications: Array.isArray(parsed?.certifications) ? parsed.certifications.map((item) => ({
        name: String(item?.name || ''),
        issuer: String(item?.issuer || ''),
        date: String(item?.date || ''),
        link: String(item?.link || '')
    })) : [],
    achievements: Array.isArray(parsed?.achievements) ? parsed.achievements.map((x) => String(x || '').trim()).filter(Boolean) : []
});

// Resume parse API route (Claude + PDF upload)
app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
    try {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured.' });
        }

        let rawText = '';
        if (req.file?.buffer) {
            const pdfData = await pdfParse(req.file.buffer);
            rawText = String(pdfData?.text || '').trim();
        } else if (typeof req.body?.resumeText === 'string') {
            rawText = req.body.resumeText.trim();
        }

        if (!rawText) {
            return res.status(400).json({ error: 'Resume file or resumeText is required.' });
        }

        const client = new Anthropic({ apiKey });

        const prompt = `Parse this resume text and return ONLY a valid JSON object.
No explanation, no markdown, no code blocks. Just raw JSON.

Use exactly this structure:
{
  "personal": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "portfolio": ""
  },
  "summary": "",
  "education": [
    {
      "degree": "",
      "institution": "",
      "location": "",
      "startYear": "",
      "endYear": "",
      "gpa": ""
    }
  ],
  "workExperience": [
    {
      "company": "",
      "role": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "bullets": []
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "techStack": [],
      "githubLink": "",
      "liveLink": ""
    }
  ],
  "skills": {
    "languages": [],
    "frameworks": [],
    "tools": [],
    "databases": [],
    "cloud": [],
    "other": []
  },
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": "",
      "link": ""
    }
  ],
  "achievements": []
}

Rules:
- phone must be ONLY the phone number, nothing else
- email must be ONLY the email address
- linkedin must be ONLY the LinkedIn URL
- github must be ONLY the GitHub URL
- Each job must be a SEPARATE object in workExperience array
- Each education must be a SEPARATE object in education array
- Each project must be a SEPARATE object in projects array
- bullets must be an array of strings, one per bullet point
- If a field is not found, use empty string "" or empty array []
- Never merge multiple values into one field

Resume text:
${rawText}`;

        const primaryModel = process.env.ANTHROPIC_PARSE_MODEL || 'claude-opus-4-5';
        const fallbackModels = ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'];
        const modelCandidates = [primaryModel, ...fallbackModels.filter((m) => m !== primaryModel)];

        let message = null;
        let lastModelError = null;
        for (const model of modelCandidates) {
            try {
                message = await client.messages.create({
                    model,
                    max_tokens: 4096,
                    messages: [{ role: 'user', content: prompt }]
                });
                break;
            } catch (modelError) {
                lastModelError = modelError;
            }
        }

        if (!message) {
            throw lastModelError || new Error('Unable to parse resume with available Anthropic models');
        }

        const responseText = extractTextContentFromClaude(message?.content);
        const cleanJson = cleanClaudeJsonResponse(responseText);
        const parsedProfile = JSON.parse(cleanJson);
        const normalizedProfile = normalizeMasterProfileFromClaude(parsedProfile);

        const userId = getUserIdFromRequest(req);
        if (userId) {
            const { error } = await supabase
                .from('master_profiles')
                .upsert({
                    user_id: userId,
                    profile_data: normalizedProfile,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) {
                if (isMissingMasterProfilesTable(error) || isMasterProfilesUserForeignKeyError(error)) {
                    try {
                        await upsertProfilesFallbackAdaptive(userId, normalizedProfile);
                    } catch (fallbackError) {
                        if (!isProfilesUserForeignKeyError(fallbackError)) {
                            console.warn('Parse route profile persistence skipped:', fallbackError?.message || fallbackError);
                        }
                    }
                } else {
                    // Parsing should still succeed even when persistence fails.
                    console.warn('Parse route profile persistence failed:', error?.message || error);
                }
            }
        }

        res.json({ success: true, profile: normalizedProfile });
    } catch (error) {
        console.error('Resume Parse Error:', error);
        res.status(500).json({
            error: 'Resume parsing failed',
            details: error.message
        });
    }
});

app.get('/api/master-profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        const { data, error } = await supabase
            .from('master_profiles')
            .select('id, user_id, profile_data, updated_at, created_at')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            if (!isMissingMasterProfilesTable(error)) {
                return res.status(400).json({ error: error.message });
            }

            const fallback = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (fallback.error) return res.status(400).json({ error: fallback.error.message });
            const fallbackProfile = buildMasterProfileFromProfilesRow(fallback.data || {});
            return res.json({ success: true, profile: fallbackProfile, data: fallback.data || null, fallback: 'profiles' });
        }
        return res.json({ success: true, profile: data?.profile_data || null, data: data || null });
    } catch (error) {
        console.error('Get master profile error:', error);
        return res.status(500).json({ error: error.message });
    }
});

app.put('/api/master-profile', async (req, res) => {
    try {
        const userId = req.body?.userId;
        const profile = req.body?.profile;

        if (!userId) return res.status(400).json({ error: 'userId is required' });
        if (!profile || typeof profile !== 'object') return res.status(400).json({ error: 'profile is required' });

        const normalizedProfile = normalizeMasterProfileFromClaude(profile);

        const { data, error } = await supabase
            .from('master_profiles')
            .upsert({
                user_id: userId,
                profile_data: normalizedProfile,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
            .select('id, user_id, profile_data, updated_at, created_at')
            .maybeSingle();

        if (error) {
            if (!isMissingMasterProfilesTable(error) && !isMasterProfilesUserForeignKeyError(error)) {
                return res.status(400).json({ error: error.message });
            }

            try {
                const fallbackData = await upsertProfilesFallbackAdaptive(userId, normalizedProfile);
                return res.json({ success: true, profile: normalizedProfile, data: fallbackData || null, fallback: 'profiles' });
            } catch (fallbackError) {
                if (isProfilesUserForeignKeyError(fallbackError)) {
                    return res.json({
                        success: true,
                        profile: normalizedProfile,
                        data: null,
                        fallback: 'local-only',
                        warning: 'Profile could not be stored in profiles table due to user_id foreign key constraint.'
                    });
                }
                throw fallbackError;
            }
        }
        return res.json({ success: true, profile: data?.profile_data || normalizedProfile, data });
    } catch (error) {
        console.error('Save master profile error:', error);
        return res.status(500).json({ error: error.message });
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
