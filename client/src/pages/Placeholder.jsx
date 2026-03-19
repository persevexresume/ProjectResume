import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

export default function Placeholder() {
    const location = useLocation()
    const title = location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.substring(2)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ padding: '6rem 5%', textAlign: 'center', minHeight: '60vh' }}
        >
            <h2 style={{ fontSize: '3rem', color: 'var(--color-accent-primary)', marginBottom: '1rem' }}>{title}</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem' }}>This section is currently under construction.</p>
        </motion.div>
    )
}
