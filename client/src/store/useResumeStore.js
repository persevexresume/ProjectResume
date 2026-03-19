// Resume data structure and Zustand store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Initial empty resume structure
export const createEmptyResume = () => ({
  templateId: 'neo-minimal',
  personalInfo: {
    firstName: '',
    lastName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
    photoUrl: ''
  },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  customSections: [],
  themeColor: '#0284c7',
  sections: {
    personalInfo: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: false,
    certifications: false,
    languages: false
  }
})

// Zustand store for resume editor
const useResumeStore = create(
  persist(
    (set) => ({
      resume: createEmptyResume(),
      selectedTemplate: 'neo-minimal',
      
      setResume: (resume) => set({ resume }),
      updatePersonalInfo: (info) => set((state) => ({
        resume: {
          ...state.resume,
          personalInfo: { ...state.resume.personalInfo, ...info }
        }
      })),
      setSummary: (summary) => set((state) => ({
        resume: { ...state.resume, summary }
      })),
      addExperience: (job) => set((state) => ({
        resume: {
          ...state.resume,
          experience: [...state.resume.experience, { id: Date.now(), ...job }]
        }
      })),
      updateExperience: (id, job) => set((state) => ({
        resume: {
          ...state.resume,
          experience: state.resume.experience.map((e) => e.id === id ? { ...e, ...job } : e)
        }
      })),
      removeExperience: (id) => set((state) => ({
        resume: {
          ...state.resume,
          experience: state.resume.experience.filter((e) => e.id !== id)
        }
      })),
      addEducation: (edu) => set((state) => ({
        resume: {
          ...state.resume,
          education: [...state.resume.education, { id: Date.now(), ...edu }]
        }
      })),
      updateEducation: (id, edu) => set((state) => ({
        resume: {
          ...state.resume,
          education: state.resume.education.map((e) => e.id === id ? { ...e, ...edu } : e)
        }
      })),
      removeEducation: (id) => set((state) => ({
        resume: {
          ...state.resume,
          education: state.resume.education.filter((e) => e.id !== id)
        }
      })),
      setSkills: (skills) => set((state) => ({
        resume: { ...state.resume, skills }
      })),
      setThemeColor: (color) => set((state) => ({
        resume: { ...state.resume, themeColor: color }
      })),
      setSelectedTemplate: (templateId) => set({ selectedTemplate: templateId }),
      toggleSection: (section) => set((state) => ({
        resume: {
          ...state.resume,
          sections: {
            ...state.resume.sections,
            [section]: !state.resume.sections[section]
          }
        }
      })),
      resetResume: () => set({ resume: createEmptyResume() })
    }),
    {
      name: 'resume-storage',
      version: 1
    }
  )
)

export default useResumeStore
