export const MOCK_CURRICULUM = {
  north: [
    {
      id: 'north-1',
      title: 'Level 1 - Northern Basics',
      description: 'Giới thiệu phát âm và từ vựng cơ bản phương ngữ miền Bắc.',
      errorTag: 'phonetics_north_basic',
      aiThreshold: 70,
      status: 'published',
    },
    {
      id: 'north-2',
      title: 'Level 2 - Daily Conversations',
      description:
        'Luyện hội thoại hằng ngày với ngữ điệu Bắc chuẩn trong bối cảnh đời sống.',
      errorTag: 'intonation_north_daily',
      aiThreshold: 75,
      status: 'draft',
    },
  ],
  central: [
    {
      id: 'central-1',
      title: 'Level 1 - Central Pronunciation',
      description: 'Làm quen hệ thống âm và thanh điệu miền Trung.',
      errorTag: 'phonetics_central_intro',
      aiThreshold: 72,
      status: 'published',
    },
    {
      id: 'central-2',
      title: 'Level 2 - Cultural Scenarios',
      description:
        'Luyện nói qua các tình huống gắn với văn hóa miền Trung (chợ, lễ hội, du lịch).',
      errorTag: 'context_central_culture',
      aiThreshold: 78,
      status: 'published',
    },
  ],
  south: [
    {
      id: 'south-1',
      title: 'Level 1 - Southern Tone Patterns',
      description: 'Nắm vững đặc trưng ngữ điệu và từ địa phương miền Nam.',
      errorTag: 'intonation_south_pattern',
      aiThreshold: 68,
      status: 'draft',
    },
    {
      id: 'south-2',
      title: 'Level 2 - Scenario-based Practice',
      description:
        'Thực hành hội thoại theo kịch bản tại quán ăn, nơi làm việc, và giao tiếp thân mật.',
      errorTag: 'scenario_south_applied',
      aiThreshold: 80,
      status: 'published',
    },
  ],
}

