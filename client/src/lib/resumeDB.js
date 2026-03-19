import { supabase } from '../supabase';
import { getDbUserId } from './userIdentity';

/**
 * Enhanced Database Resume Management
 * Handles save, load, update, and delete operations for resumes
 */

export const saveResume = async (user, title, resumeData, customization, template_id) => {
  if (!user) throw new Error('User not authenticated');

  const dbUserId = getDbUserId(user);
  if (!dbUserId) throw new Error('Could not determine user ID');

  try {
    const { data, error } = await supabase
      .from('resumes')
      .insert([{
        user_id: dbUserId,
        title: title || 'Untitled Resume',
        data: resumeData,
        customization: customization || {},
        template_id: template_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (err) {
    console.error('Save resume error:', err);
    // Fallback to localStorage
    localStorage.setItem(`resume_${Date.now()}`, JSON.stringify({
      title,
      resumeData,
      customization,
      template_id,
      created_at: new Date().toISOString(),
    }));
    throw err;
  }
};

export const updateResume = async (user, resumeId, title, resumeData, customization, template_id) => {
  if (!user) throw new Error('User not authenticated');
  if (!resumeId) throw new Error('Resume ID required');

  try {
    const { data, error } = await supabase
      .from('resumes')
      .update({
        title: title || 'Untitled Resume',
        data: resumeData,
        customization: customization || {},
        template_id: template_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resumeId)
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (err) {
    console.error('Update resume error:', err);
    throw err;
  }
};

export const loadResume = async (resumeId) => {
  if (!resumeId) throw new Error('Resume ID required');

  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Load resume error:', err);
    throw err;
  }
};

export const deleteResume = async (resumeId) => {
  if (!resumeId) throw new Error('Resume ID required');

  try {
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Delete resume error:', err);
    throw err;
  }
};

export const listUserResumes = async (user) => {
  if (!user) throw new Error('User not authenticated');

  const dbUserId = getDbUserId(user);
  if (!dbUserId) throw new Error('Could not determine user ID');

  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', dbUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('List resumes error:', err);
    return [];
  }
};

export const duplicateResume = async (user, sourceResumeId, newTitle) => {
  if (!user) throw new Error('User not authenticated');
  if (!sourceResumeId) throw new Error('Source resume ID required');

  try {
    const source = await loadResume(sourceResumeId);
    return await saveResume(
      user,
      newTitle || `${source.title} (Copy)`,
      source.data,
      source.customization,
      source.template_id
    );
  } catch (err) {
    console.error('Duplicate resume error:', err);
    throw err;
  }
};

export const exportResumeAsJSON = (resumeData, title) => {
  const json = JSON.stringify(resumeData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title || 'resume'}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importResumeFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
