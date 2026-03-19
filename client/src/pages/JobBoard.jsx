import { useEffect } from 'react'

export default function JobBoard() {
    useEffect(() => {
        window.location.href = 'https://www.persevex.com/job-portal'
    }, [])

    return null
}
