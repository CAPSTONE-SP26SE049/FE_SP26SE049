import React, { useEffect, useMemo, useState } from 'react';
import {
    Card,
    Select,
    Table,
    Tag,
    Spin,
    Empty,
    Typography,
    Space,
    Badge,
    Tooltip,
    Statistic,
    Row,
    Col,
    Divider,
    Button,
    Modal,
    Tabs,
    Form,
    Input,
    InputNumber,
    message,
} from 'antd';
import {
    FileTextOutlined,
    ClockCircleOutlined,
    TrophyOutlined,
    QuestionCircleOutlined,
    ReadOutlined,
    SoundOutlined,
    AudioOutlined,
    PlusOutlined,
    BankOutlined,
    EditOutlined,
    SearchOutlined,
    EyeOutlined,
    InfoCircleOutlined,
    ArrowLeftOutlined,
    DownloadOutlined,
    UploadOutlined,
    ExportOutlined,
    DeleteOutlined,
    ArrowRightOutlined
} from '@ant-design/icons';
import { educatorService } from '../services/educatorService';
import { excelService, downloadBlob } from '../services/excelService';

const { Title, Text } = Typography;
const { Option } = Select;

const SKILL_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    READING: { label: 'Đọc hiểu', color: '#2563eb', icon: <ReadOutlined /> },
    LISTENING: { label: 'Nghe hiểu', color: '#7c3aed', icon: <SoundOutlined /> },
    WRITING: { label: 'Viết', color: '#059669', icon: <EditOutlined /> },
    SPEAKING: { label: 'Nói', color: '#ea580c', icon: <AudioOutlined /> },
};

const REGION_LABEL: Record<string, { label: string; color: string; bg: string }> = {
    NORTH: { label: 'Miền Bắc', color: '#1d4ed8', bg: '#dbeafe' },
    SOUTH: { label: 'Miền Nam', color: '#15803d', bg: '#dcfce7' },
    CENTRAL: { label: 'Miền Trung', color: '#b45309', bg: '#fef3c7' },
};

const QuizManagementPage: React.FC = () => {
    const [levels, setLevels] = useState<any[]>([]);
    const [dialects, setDialects] = useState<any[]>([]);
    const [selectedLevelId, setSelectedLevelId] = useState<string | undefined>(undefined);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [quiz, setQuiz] = useState<any | null>(null);
    const [loadingQuiz, setLoadingQuiz] = useState(false);
    useEffect(() => {
        const fetchLevels = async () => {
            try {
                const res: any = await educatorService.getLevelsForSelection();
                setLevels(res?.data || (Array.isArray(res) ? res : []));
            } catch {
                setLevels([]);
            }
        };
        const fetchDialects = async () => {
            try {
                const res: any = await educatorService.getDialects();
                setDialects(res?.data || (Array.isArray(res) ? res : []));
            } catch {
                setDialects([]);
            }
        };
        fetchLevels();
        fetchDialects();
    }, []);
    // ... existing component continues unchanged ...

    return <div />;
};

export default QuizManagementPage;
