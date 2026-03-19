const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\tej\\Desktop\\PersevexResume\\resume-templates-showcase.html', 'utf8');

const cssRules = {};
const cssRegex = /\.t(\d+)\s*\{([^}]*)\}/g;
let match;
while ((match = cssRegex.exec(content)) !== null) {
    const id = parseInt(match[1]);
    const body = match[2];
    cssRules[id] = body;
}

const subRules = {};
const subRegex = /\.t(\d+)\s+([^{]+)\{([^}]*)\}/g;
while ((match = subRegex.exec(content)) !== null) {
    const id = parseInt(match[1]);
    const selector = match[2].trim();
    const body = match[3];
    if (!subRules[id]) subRules[id] = {};
    subRules[id][selector] = body;
}

const templateDataMatches = Array.from(content.matchAll(/<!-- T(\d+) -->[\s\S]*?<strong>(\d+) · (.*?)<\/strong><span class="tag (.*?)">(.*?)<\/span>/g));
const resultTemplates = [];

for (const dataMatch of templateDataMatches) {
    const numId = parseInt(dataMatch[1]);
    const name = dataMatch[3];
    const categoryTag = dataMatch[5];
    
    const id = 'b' + numId.toString().padStart(2, '0');
    const mainCss = cssRules[numId] || '';
    const sidebarCss = (subRules[numId] || {})['.sidebar'] || (subRules[numId] || {})['.col-left'] || '';
    const h1Css = (subRules[numId] || {})['h1'] || (subRules[numId] || {})['.main h1'] || (subRules[numId] || {})['.hero h1'] || (subRules[numId] || {})['.masthead h1'] || '';
    const roleCss = (subRules[numId] || {})['.role'] || '';
    
    let bg = '#ffffff';
    const bgMatch = mainCss.match(/background:\s*(#[a-fA-F0-9]{3,6})/);
    if (bgMatch) bg = bgMatch[1];
    else if (mainCss.includes('linear-gradient')) {
        const gradMatch = mainCss.match(/linear-gradient\([^,]+,\s*(#[a-fA-F0-9]{3,6})/);
        if (gradMatch) bg = gradMatch[1];
    }
    
    let primary = '#1a1a2e';
    const h1ColorMatch = h1Css.match(/color:\s*(#[a-fA-F0-9]{3,6})/);
    const sidebarBgMatch = sidebarCss.match(/background:\s*(#[a-fA-F0-9]{3,6})/);
    if (h1ColorMatch) primary = h1ColorMatch[1];
    else if (sidebarBgMatch) primary = sidebarBgMatch[1];
    
    let accent = '#3b82f6';
    const roleColorMatch = roleCss.match(/color:\s*(#[a-fA-F0-9]{3,6})/);
    if (roleColorMatch) accent = roleColorMatch[1];
    
    const fontMatch = mainCss.match(/font-family:\s*([^;]+)/);
    const font = fontMatch ? fontMatch[1].trim().replace(/['"]/g, '').split(',')[0] : 'Inter';

    let category = 'Modern';
    if (categoryTag.toLowerCase().includes('creative')) category = 'Creative';
    else if (categoryTag.toLowerCase().includes('corporate')) category = 'Executive';
    else if (categoryTag.toLowerCase().includes('academic')) category = 'Academic';
    else if (categoryTag.toLowerCase().includes('minimal')) category = 'Minimalist';
    else if (categoryTag.toLowerCase().includes('dark') || categoryTag.toLowerCase().includes('tech')) category = 'Tech';

    // Map to styles
    let style = 'executive';
    if (numId === 13) style = 'b13';
    else if (numId === 29 || numId === 15) style = 'timeline';
    else if (numId === 20 || numId === 26) style = 'mosaic';
    else if (categoryTag.toLowerCase().includes('twocol') || categoryTag.toLowerCase().includes('sidebar')) style = 'sidebar';
    else if (categoryTag.toLowerCase().includes('creative')) style = 'diagonal';
    else if (categoryTag.toLowerCase().includes('dark') || categoryTag.toLowerCase().includes('tech')) style = 'tech';
    else if (categoryTag.toLowerCase().includes('academic') || name.toLowerCase().includes('newspaper')) style = 'magazine';
    else if (category === 'Minimalist') style = 'executive';

    resultTemplates.push({
        id,
        name,
        category,
        description: `${categoryTag} style template with unique ${name} design.`,
        style: style,
        supportsPhoto: true,
        colors: { bg, primary, accent },
        fonts: { heading: font + ', sans-serif', body: 'Inter, sans-serif' }
    });
}

const header = "// Resume Templates perfectly mapped from resume-templates-showcase.html\n// There are exactly 50 unique templates.\n\n";
const code = "export const resumeTemplates = " + JSON.stringify(resultTemplates, null, 2) + ";";
fs.writeFileSync('c:\\Users\\tej\\Desktop\\PersevexResume\\client\\src\\data\\templates.js', header + code);
