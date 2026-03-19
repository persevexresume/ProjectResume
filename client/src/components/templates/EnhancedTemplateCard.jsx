import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';
import EnhancedTemplateRenderer from './EnhancedTemplateRenderer';

// Sample data showing what each template will look like
const SAMPLE_DATA = {
  personalInfo: {
    firstName: 'Alex',
    lastName: 'Johnson',
    title: 'Senior Product Manager',
    email: 'alex.johnson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
  },
  summary: 'Results-driven professional with 5+ years of experience.',
  experience: [
    {
      role: 'Senior Manager',
      company: 'Tech Corp',
      startDate: '2022',
      endDate: 'Present',
    },
    {
      role: 'Manager',
      company: 'Previous Co',
      startDate: '2020',
      endDate: '2022',
    },
  ],
  education: [
    {
      degree: 'MBA',
      institution: 'Stanford University',
      year: '2020',
    },
    {
      degree: 'BS Computer Science',
      institution: 'MIT',
      year: '2018',
    },
  ],
  skills: ['Leadership', 'Strategy', 'Analytics', 'React', 'Python', 'Project Management'],
};

export default function EnhancedTemplateCard({
  template,
  index,
  onSelect,
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      style={{
        cursor: 'pointer',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        background: '#fff',
        transition: 'all 300ms ease',
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 20px 40px rgba(0,0,0,0.15)'
          : '0 4px 12px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          height: '300px',
          overflow: 'hidden',
          position: 'relative',
          background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            width: '816px', 
            height: '1056px',
            transform: 'translateX(-50%) scale(0.32)', 
            transformOrigin: 'top center',
            pointerEvents: 'none',
          }}
        >
          <EnhancedTemplateRenderer
            template={template}
            resumeData={SAMPLE_DATA}
            themeColor={template.colors?.accent || '#3b82f6'}
          />
        </div>
      </div>

      {/* Info Section */}
      <div style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#1f2937' }}>
          {template.name}
        </h3>

        {/* Color Swatches */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
          {template.colors && Object.entries(template.colors).map(([key, color], i) => (
            <div
              key={i}
              title={key}
              style={{
                width: '16px',
                height: '16px',
                background: color,
                borderRadius: '4px',
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            />
          ))}
        </div>

        {/* Meta Info */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              background: '#f0fdf4',
              color: '#059669',
              padding: '2px 8px',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {template.style === template.id ? 'Custom' : template.style}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              background: '#f3f4f6',
              color: '#6b7280',
              padding: '2px 8px',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {template.category}
          </span>
        </div>

        {/* Description */}
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
          {template.description}
        </p>

        {/* Use Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSelect}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: isHovered ? '#3b82f6' : '#e0e7ff',
            color: isHovered ? '#fff' : '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '12px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 200ms',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <Play size={14} /> Use Template
        </motion.button>
      </div>
    </motion.div>
  );
}
