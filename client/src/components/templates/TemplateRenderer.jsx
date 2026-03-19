// Basic Template Renderer Component - stripped of all designs
export const TemplateRenderer = ({ template = {}, resumeData, themeColor }) => {
    if (!resumeData) return null;
    
    // Add default fallbacks for spacing and fonts to avoid undefined errors
    const spacing = template?.spacing || { margin: 10, padding: 10, lineHeight: 1.5 };
    const fonts = template?.fonts || { heading: 'sans-serif', body: 'sans-serif' };

    const { personalInfo = {}, experience = [], education = [], skills = [] } = resumeData;

    return (
        <div style={{
            fontFamily: fonts.body,
            lineHeight: spacing.lineHeight,
            padding: `${spacing.padding}px`,
            color: '#333'
        }}>
            <header style={{ marginBottom: `${spacing.margin}px`, textAlign: 'center' }}>
                <h1 style={{ fontFamily: fonts.heading, fontSize: '24px', margin: 0 }}>
                    {personalInfo.firstName || 'First'} {personalInfo.lastName || 'Last'}
                </h1>
                <p>
                    {personalInfo.email} | {personalInfo.phone} | {personalInfo.location}
                </p>
                <p style={{ marginTop: '10px' }}>{personalInfo.summary}</p>
            </header>

            {experience.length > 0 && (
                <section style={{ marginBottom: `${spacing.margin}px` }}>
                    <h2 style={{ fontFamily: fonts.heading, borderBottom: '1px solid #ccc' }}>Experience</h2>
                    {experience.map((exp, i) => (
                        <div key={i} style={{ marginBottom: '10px' }}>
                            <h3 style={{ margin: '5px 0' }}>{exp.position} - {exp.company}</h3>
                            <p style={{ fontSize: '12px', color: '#666' }}>{exp.startDate} to {exp.endDate}</p>
                            <p>{exp.description}</p>
                        </div>
                    ))}
                </section>
            )}

            {education.length > 0 && (
                <section style={{ marginBottom: `${spacing.margin}px` }}>
                    <h2 style={{ fontFamily: fonts.heading, borderBottom: '1px solid #ccc' }}>Education</h2>
                    {education.map((edu, i) => (
                        <div key={i} style={{ marginBottom: '10px' }}>
                            <h3 style={{ margin: '5px 0' }}>{edu.degree} in {edu.field}</h3>
                            <p style={{ fontSize: '12px', color: '#666' }}>{edu.school}, Graduated: {edu.graduationDate}</p>
                        </div>
                    ))}
                </section>
            )}

            {skills.length > 0 && (
                <section style={{ marginBottom: `${spacing.margin}px` }}>
                    <h2 style={{ fontFamily: fonts.heading, borderBottom: '1px solid #ccc' }}>Skills</h2>
                    <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', listStyle: 'none', padding: 0 }}>
                        {skills.map((skill, i) => (
                            <li key={i} style={{ background: '#eee', padding: '5px 10px', borderRadius: '4px' }}>
                                {skill}
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    )
}

export default TemplateRenderer;
