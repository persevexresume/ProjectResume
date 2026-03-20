/**
 * Gemini API PDF Extractor
 * Extracts resume data from PDF files using Google's Gemini API
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

/**
 * Convert PDF file to base64
 */
export const pdfToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Extract base64 from data URL
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Extract resume data from PDF using Gemini API
 */
export const extractResumeFromPDF = async (file) => {
    try {
        if (!file) throw new Error('No file provided');
        if (file.type !== 'application/pdf') throw new Error('File must be a PDF');

        // Convert PDF to base64
        const base64PDF = await pdfToBase64(file);

        // Prepare request to Gemini API
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: `Please extract all resume/CV information from this PDF document and return it as a JSON object with the following structure:
{
  "personalInfo": {
    "firstName": "string",
    "lastName": "string",
    "title": "string or job title",
    "email": "string",
    "phone": "string",
    "location": "string (city)",
    "country": "string",
    "summary": "string (professional summary or objective)",
    "profilePhoto": ""
  },
  "experience": [
    {
      "jobTitle": "string",
      "company": "string",
      "startDate": "string (YYYY-MM)",
      "endDate": "string (YYYY-MM) or 'Present'",
      "description": "string"
    }
  ],
  "education": [
    {
      "schoolName": "string",
      "degree": "string",
      "field": "string",
      "startDate": "string (YYYY-MM)",
      "endDate": "string (YYYY-MM)"
    }
  ],
  "skills": ["skill1", "skill2", "skill3", ...]
}

Extract ONLY the information present in the resume. Use empty strings or empty arrays for missing data. Return ONLY valid JSON, no other text.`
                        },
                        {
                            inlineData: {
                                mimeType: 'application/pdf',
                                data: base64PDF
                            }
                        }
                    ]
                }
            ]
        };

        // Call Gemini API
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // Extract text from response
        if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
            throw new Error('Invalid response from Gemini API');
        }

        const responseText = result.candidates[0].content.parts[0].text;

        // Parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Could not extract JSON from response');
        }

        const extractedData = JSON.parse(jsonMatch[0]);

        return {
            success: true,
            data: extractedData,
            rawResponse: responseText
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
};

/**
 * Validate and clean extracted resume data
 */
export const validateResumeData = (data) => {
    const cleaned = {
        personalInfo: {
            firstName: data?.personalInfo?.firstName || '',
            lastName: data?.personalInfo?.lastName || '',
            title: data?.personalInfo?.title || '',
            email: data?.personalInfo?.email || '',
            phone: data?.personalInfo?.phone || '',
            location: data?.personalInfo?.location || '',
            country: data?.personalInfo?.country || '',
            summary: data?.personalInfo?.summary || '',
            profilePhoto: data?.personalInfo?.profilePhoto || ''
        },
        experience: Array.isArray(data?.experience) ? data.experience : [],
        education: Array.isArray(data?.education) ? data.education : [],
        skills: Array.isArray(data?.skills) ? data.skills : []
    };

    return cleaned;
};
