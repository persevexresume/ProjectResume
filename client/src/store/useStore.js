import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const initialResumeData = {
  personalInfo: {
    firstName: '', lastName: '', email: '', title: '', phone: '', summary: '',
    location: '', github: '', linkedin: '', website: '', profilePhoto: ''
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  jobDescription: ''
};

const useStore = create(
  persist(
    (set, get) => ({
      user: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setUser: (user) => {
        const previousUser = get().user;
        const previousUserId = previousUser?.studentId || previousUser?.uid || previousUser?.id || '';
        const nextUserId = user?.studentId || user?.uid || user?.id || '';
        const switchedAccounts = Boolean(previousUserId && nextUserId && previousUserId !== nextUserId);

        try {
          if (user) {
            localStorage.setItem('persevex_user', JSON.stringify(user));
          } else {
            localStorage.removeItem('persevex_user');
          }
        } catch {
          // Ignore storage write failures and keep in-memory state.
        }
        set({
          user,
          ...(switchedAccounts ? { editingResumeId: null, resumeData: initialResumeData } : {})
        });
      },
      clearUser: () => {
        try {
          localStorage.removeItem('persevex_user');
        } catch {
          // Ignore storage cleanup failures and keep in-memory state.
        }
        set({ user: null, templatesLocked: true, editingResumeId: null, resumeData: initialResumeData });
      },
      restoreUserFromFallback: () => {
        try {
          const raw = localStorage.getItem('persevex_user');
          if (!raw) return;
          const parsed = JSON.parse(raw);
          const parsedUserId = parsed?.studentId || parsed?.uid || parsed?.id;
          if (parsedUserId && parsed?.role) {
            set({ user: parsed, templatesLocked: parsed.role === 'student' ? false : true });
          }
        } catch {
          // Ignore malformed fallback storage.
        }
      },

      // templates are locked for non-students
      templatesLocked: true,
      setTemplatesLocked: (locked) => set({ templatesLocked: locked }),

      // Theme settings
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      // Builder Customization & Selection
      selectedTemplate: 'prof-sebastian',
      setSelectedTemplate: (id) => set({ selectedTemplate: id }),
      editingResumeId: null,
      setEditingResumeId: (id) => set({ editingResumeId: id }),

      customization: {
        font: 'Inter',
        fontSize: '14px',
        themeColor: '#4f46e5',
      },
      setCustomization: (data) => set((state) => ({
        customization: { ...state.customization, ...data }
      })),

      // Comprehensive Resume Data
      resumeData: initialResumeData,

      updatePersonalInfo: (data) => set((state) => ({
        resumeData: { ...state.resumeData, personalInfo: { ...state.resumeData.personalInfo, ...data } }
      })),

      setExperience: (experience) => set((state) => ({
        resumeData: { ...state.resumeData, experience }
      })),

      setEducation: (education) => set((state) => ({
        resumeData: { ...state.resumeData, education }
      })),

      setSkills: (skills) => set((state) => ({
        resumeData: { ...state.resumeData, skills }
      })),

      setProjects: (projects) => set((state) => ({
        resumeData: { ...state.resumeData, projects }
      })),

      setCertifications: (certifications) => set((state) => ({
        resumeData: { ...state.resumeData, certifications }
      })),

      setJobDescription: (jobDescription) => set((state) => ({
        resumeData: { ...state.resumeData, jobDescription }
      })),

      resetResume: () => set({
        editingResumeId: null,
        resumeData: initialResumeData
      }),

      loadResume: (resume) => set({
        editingResumeId: resume.id,
        resumeData: resume.data,
        customization: resume.customization,
        selectedTemplate: resume.template_id || resume.template || resume.templateId || 'prof-sebastian'
      })
    }),
    {
      name: 'persevex-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        templatesLocked: state.templatesLocked,
        theme: state.theme,
        selectedTemplate: state.selectedTemplate,
        editingResumeId: state.editingResumeId,
        customization: state.customization,
        resumeData: state.resumeData
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      }
    }
  )
);

export default useStore;
