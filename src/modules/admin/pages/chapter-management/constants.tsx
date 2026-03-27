import React from 'react';
import { ReadOutlined, SoundOutlined, EditOutlined, AudioOutlined } from '@ant-design/icons';

export const SKILL_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  READING: { label: 'Đọc hiểu', color: '#2563eb', icon: <ReadOutlined /> },
  LISTENING: { label: 'Nghe hiểu', color: '#7c3aed', icon: <SoundOutlined /> },
  WRITING: { label: 'Viết', color: '#059669', icon: <EditOutlined /> },
  SPEAKING: { label: 'Nói', color: '#ea580c', icon: <AudioOutlined /> },
};

export const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  BEGINNER: { label: 'Cơ bản', color: 'green' },
  INTERMEDIATE: { label: 'Trung bình', color: 'gold' },
  ADVANCED: { label: 'Nâng cao', color: 'red' },
};
