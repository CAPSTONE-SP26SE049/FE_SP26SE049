import type React from 'react'
import { MOCK_CURRICULUM } from '../../../services/mockData'

const CurriculumManagerPage: React.FC = () => {
  return (
    <div>
      <h2>Curriculum Manager</h2>
      <p>Quản lý lộ trình học theo vùng miền và cấp độ.</p>
      <pre style={{ marginTop: 16, background: '#f5f5f5', padding: 16 }}>
        {JSON.stringify(MOCK_CURRICULUM, null, 2)}
      </pre>
    </div>
  )
}

export default CurriculumManagerPage

