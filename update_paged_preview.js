const fs = require('fs');

// 1. Update Build.jsx
const buildPath = 'client/src/pages/Build.jsx';
let buildContent = fs.readFileSync(buildPath, 'utf8');

const buildReplacement = `const PagedResumePreview = ({ data, templateId, customization, previewScale, paged }) => {
    const measureRef = useRef(null)
    const [measuredHeight, setMeasuredHeight] = useState(PAGE_HEIGHT)

    useEffect(() => {
        const refreshPages = () => {
            const currentHeight = measureRef.current?.offsetHeight || PAGE_HEIGHT
            setMeasuredHeight(Math.max(currentHeight, PAGE_HEIGHT))
        }

        const frame = window.requestAnimationFrame(() => {
            refreshPages()
            window.setTimeout(refreshPages, 120)
        })

        return () => window.cancelAnimationFrame(frame)
    }, [data, templateId, customization, paged])

    return (
        <div style={{ position: 'relative' }}>
            {/* Hidden div to measure real resume height */}
            <div
                style={{ position: 'absolute', left: '-20000px', top: 0, width: \`\${PAGE_WIDTH}px\`, visibility: 'hidden', pointerEvents: 'none' }}
                aria-hidden="true"
            >
                <div ref={measureRef}>
                    <ResumeRenderer data={data} templateId={templateId} customization={customization} />
                </div>
            </div>
            {/* Scaled visible preview */}
            <div style={{
                width: \`\${PAGE_WIDTH * previewScale}px\`,
                height: \`\${measuredHeight * previewScale}px\`,
                position: 'relative',
                background: '#fff',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
            }}>
                <div style={{
                    transform: \`scale(\${previewScale})\`,
                    transformOrigin: 'top left',
                    width: \`\${PAGE_WIDTH}px\`,
                    height: \`\${measuredHeight}px\`,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }}>
                    <ResumeRenderer data={data} templateId={templateId} customization={customization} />
                </div>
            </div>
        </div>
    )
}`;

const buildRegex = /const PagedResumePreview = \(\{ data, templateId, customization, previewScale, paged \}\) => \{[\s\S]*?\}\s*const HeaderSection/m;
buildContent = buildContent.replace(buildRegex, buildReplacement + '\n\nconst HeaderSection');
fs.writeFileSync(buildPath, buildContent);


// 2. Update StudentDashboard.jsx
const dashboardPath = 'client/src/pages/StudentDashboard.jsx';
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

const dashboardReplacement = `function SavedResumePreview({ resume, templateId }) {
    const measureRef = useRef(null)
    const [measuredHeight, setMeasuredHeight] = useState(PAGE_HEIGHT)
    const [previewScale, setPreviewScale] = useState(0.7)

    useEffect(() => {
        const refreshPages = () => {
            const currentHeight = measureRef.current?.offsetHeight || PAGE_HEIGHT
            setMeasuredHeight(Math.max(currentHeight, PAGE_HEIGHT))
        }

        const frame = window.requestAnimationFrame(() => {
            refreshPages()
            window.setTimeout(refreshPages, 120)
        })

        return () => window.cancelAnimationFrame(frame)
    }, [resume, templateId])

    useEffect(() => {
        const updateScale = () => {
            const maxWidth = window.innerWidth < 768 ? window.innerWidth - 48 : 1150
            const nextScale = Math.max(0.32, Math.min(1.3, maxWidth / PAGE_WIDTH))
            setPreviewScale(nextScale)
        }

        updateScale()
        window.addEventListener('resize', updateScale)
        return () => window.removeEventListener('resize', updateScale)
    }, [])

    return (
        <div className="w-full flex justify-center">
            <div
                style={{
                    position: 'absolute',
                    left: '-20000px',
                    top: 0,
                    width: \`\${PAGE_WIDTH}px\`,
                    visibility: 'hidden',
                    pointerEvents: 'none'
                }}
                aria-hidden="true"
            >
                <div ref={measureRef}>
                    <ResumeRenderer
                        data={resume?.data}
                        templateId={templateId}
                        customization={resume?.customization}
                    />
                </div>
            </div>

            <div className="w-full max-h-full overflow-y-auto">
                <div className="flex flex-col items-center gap-6 pb-4">
                    <div
                        style={{
                            width: \`\${PAGE_WIDTH * previewScale}px\`,
                            height: \`\${measuredHeight * previewScale}px\`,
                            position: 'relative',
                            background: '#fff',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{
                            transform: \`scale(\${previewScale})\`,
                            transformOrigin: 'top left',
                            width: \`\${PAGE_WIDTH}px\`,
                            height: \`\${measuredHeight}px\`,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                        }}>
                            <ResumeRenderer
                                data={resume?.data}
                                templateId={templateId}
                                customization={resume?.customization}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}`;

const dashboardRegex = /function SavedResumePreview\(\{ resume, templateId \}\) \{[\s\S]*?\}\s*function StatCard/m;
dashboardContent = dashboardContent.replace(dashboardRegex, dashboardReplacement + '\n\nfunction StatCard');
fs.writeFileSync(dashboardPath, dashboardContent);
console.log("Done");