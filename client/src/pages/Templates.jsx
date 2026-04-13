import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import useStore from '../store/useStore'
import { resumeTemplates } from '../data/templates'
import EnhancedTemplateCard from '../components/templates/EnhancedTemplateCard'
import { supabase } from '../supabase'
import { getDbUserId } from '../lib/userIdentity'
import * as resumeParser from '../lib/resumeParser'
import { isDbUuid } from '../lib/userIdentity'
import { withApiBase } from '../lib/apiBase'

export default function Templates() {
  const navigate = useNavigate()
  const { user, resumeData, masterProfile, uploadedResumePrefill, setUploadedResumePrefill, setSelectedTemplate, setEditingResumeId, updatePersonalInfo, setExperience, setEducation, setSkills, setProjects, setCertifications, applyMasterProfile, setMasterProfile } = useStore()

  useEffect(() => {
    const hydrateFromMasterProfile = async () => {
      if (!user) return
      if (uploadedResumePrefill) return

      // Do not overwrite parsed upload data that is already present in store.
      const hasExistingResumeData = Boolean(
        resumeData?.personalInfo?.firstName ||
        resumeData?.personalInfo?.lastName ||
        resumeData?.personalInfo?.email ||
        resumeData?.personalInfo?.summary ||
        (resumeData?.experience?.length || 0) > 0 ||
        (resumeData?.education?.length || 0) > 0 ||
        (resumeData?.skills?.length || 0) > 0 ||
        (resumeData?.projects?.length || 0) > 0 ||
        (resumeData?.certifications?.length || 0) > 0
      )
      if (hasExistingResumeData) return

      const localMaster = masterProfile ? resumeParser.normalizeMasterProfile(masterProfile) : null
      if (localMaster && resumeParser.calculateMasterProfileCompleteness(localMaster) > 0) {
        applyMasterProfile(localMaster)
        return
      }

      const dbUserId = getDbUserId(user)
      if (!dbUserId) return

      try {
        const apiResponse = await fetch(withApiBase(`/api/master-profile/${encodeURIComponent(dbUserId)}`))
        if (apiResponse.ok) {
          const payload = await apiResponse.json()
          if (payload?.profile) {
            const normalizedMaster = resumeParser.normalizeMasterProfile(payload.profile)
            if (resumeParser.calculateMasterProfileCompleteness(normalizedMaster) > 0) {
              setMasterProfile(normalizedMaster)
              applyMasterProfile(normalizedMaster)
              return
            }
          }
        }
      } catch (error) {
        const message = String(error?.message || '')
        if (!message.includes('404')) {
          console.warn('Master profile API fetch failed, falling back to direct table reads:', error)
        }
      }

      if (!isDbUuid(dbUserId)) {
        return
      }

      const tableCandidates = ['profiles']
      for (const tableName of tableCandidates) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('user_id', dbUserId)
          .maybeSingle()

        if (data) {
          if (data.master_profile) {
            const rawMaster = typeof data.master_profile === 'string' ? JSON.parse(data.master_profile) : data.master_profile
            const normalizedMaster = resumeParser.normalizeMasterProfile(rawMaster)
            setMasterProfile(normalizedMaster)
            applyMasterProfile(normalizedMaster)
            return
          }

          if (data.resume_data) {
            const parsedResume = typeof data.resume_data === 'string' ? JSON.parse(data.resume_data) : data.resume_data
            const normalizedMaster = resumeParser.createMasterProfileFromParsed(parsedResume)
            setMasterProfile(normalizedMaster)
            applyMasterProfile(normalizedMaster)
            return
          }

          const city = data.city || data.location?.split(',')[0]?.trim() || ''
          const country = data.country || data.location?.split(',')[1]?.trim() || ''

          updatePersonalInfo({
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            location: data.location || [city, country].filter(Boolean).join(', '),
            title: data.title || '',
            summary: data.summary || ''
          })

          setExperience(Array.isArray(data.experience_data) ? data.experience_data : [])
          setEducation(Array.isArray(data.education_data) ? data.education_data : [])
          setSkills(Array.isArray(data.skills_data) ? data.skills_data : [])
          setProjects(Array.isArray(data.projects_data) ? data.projects_data : [])
          setCertifications(Array.isArray(data.certifications_data) ? data.certifications_data : [])
          return
        }

        if (!error) continue

        const fullMessage = [error.message, error.details, error.hint].filter(Boolean).join(' | ')
        const relationMissing = error.code === 'PGRST205' || /relation .* does not exist|schema cache|not found|404/i.test(fullMessage)
        const noRows = error.code === 'PGRST116' || /0 rows|no rows/i.test(fullMessage)
        if (relationMissing || noRows) continue
      }
    }

    hydrateFromMasterProfile()
  }, [user, resumeData, masterProfile, uploadedResumePrefill, updatePersonalInfo, setExperience, setEducation, setSkills, setProjects, setCertifications, applyMasterProfile, setMasterProfile])

  const filtered = resumeTemplates

  const handleSelectTemplate = (templateId) => {
    // If data came from upload, keep DB draft id and just apply template choice.
    if (!uploadedResumePrefill) {
      setEditingResumeId(null)
    }
    setUploadedResumePrefill(false)
    setSelectedTemplate(templateId)
    const query = uploadedResumePrefill
      ? `template=${encodeURIComponent(templateId)}`
      : `template=${encodeURIComponent(templateId)}&new=1`
    navigate(`/build?${query}`)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-20 pb-20 px-6">
      {/* Sticky Header + Filters */}
      <div className="sticky top-20 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-2" />
      </div>

      {/* Template Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="mb-8 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
          <p className="text-[11px] font-black uppercase tracking-wider text-indigo-700">Quick Start</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] font-bold text-slate-700">
            <span className="rounded-full border border-indigo-200 bg-white px-3 py-1">1. Choose any template</span>
            <span className="rounded-full border border-indigo-200 bg-white px-3 py-1">2. Fill guided sections</span>
            <span className="rounded-full border border-indigo-200 bg-white px-3 py-1">3. Save and download PDF</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-600">Click any template card below to continue. You can switch templates later in the builder.</p>
        </section>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-semibold text-slate-600">No templates found</p>
            <p className="text-sm text-slate-500">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filtered.map((template, i) => (
                  <EnhancedTemplateCard
                    key={template.id}
                    template={template}
                    index={i}
                    onSelect={() => handleSelectTemplate(template.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
