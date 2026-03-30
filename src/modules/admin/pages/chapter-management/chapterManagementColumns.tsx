import React from 'react';
import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import {
  ArrowRightOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileAddOutlined,
  ReadOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { DIFFICULTY_CONFIG, SKILL_CONFIG } from './constants';
import { getRegionLabel } from './regionUtils';

const { Text } = Typography;

export type ChapterColumnHandlers = {
  getRegionKey: (dialectId: string) => string;
  onOpenQuizzes: (record: any) => void;
  onEdit: (record: any) => void;
  onDeleteLevel: (id: string) => void;
};

export function createChapterColumns(h: ChapterColumnHandlers): ColumnsType<any> {
  return [
    {
      title: 'Tên học phần',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.metadata_json?.description || record.description || 'Không có mô tả'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Vùng miền',
      dataIndex: 'dialectId',
      key: 'dialectId',
      render: (dialectId: string) => {
        const region = h.getRegionKey(dialectId);
        const color = region === 'BAC' ? 'red' : region === 'TRUNG' ? 'gold' : 'blue';
        return <Tag color={color}>{getRegionLabel(region)}</Tag>;
      },
    },
    {
      title: 'Yêu cầu sao',
      dataIndex: ['metadata_json', 'min_stars_required'],
      key: 'min_stars_required',
      render: (stars: any, record: any) => {
        const val = stars ?? record.minStarsRequired ?? 0;
        return (
          <Space>
            <TrophyOutlined style={{ color: '#faad14' }} /> {val}
          </Space>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      align: 'center',
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="Quản lý bài kiểm tra">
            <Button
              type="primary"
              icon={<FileAddOutlined />}
              size="middle"
              onClick={() => h.onOpenQuizzes(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="middle"
              onClick={() => h.onEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa học phần">
            <Popconfirm
              title="Xóa học phần này?"
              description="Tất cả bài kiểm tra trong học phần cũng sẽ bị ảnh hưởng."
              onConfirm={() => h.onDeleteLevel(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button type="primary" danger icon={<DeleteOutlined />} size="middle" />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];
}

export type QuizColumnHandlers = {
  onOpenQuizDetail: (record: any) => void;
  onEditQuiz: (record: any) => void;
  onDeleteQuiz: (id: string) => void;
};

export function createQuizColumns(h: QuizColumnHandlers): ColumnsType<any> {
  return [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (text: string, record: any) => {
        const heading = (text ?? record?.name ?? '').trim() || '—';
        return (
          <Text strong style={{ color: 'rgba(0, 0, 0, 0.88)', fontSize: 14 }}>
            {heading}
          </Text>
        );
      },
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 240,
      ellipsis: true,
      render: (text: string, record: any) => {
        const d = (text ?? record?.description ?? '').trim();
        return d ? (
          <Text type="secondary" ellipsis={{ tooltip: d }}>
            {d}
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
    },
    {
      title: (
        <span>
          <UnorderedListOutlined style={{ marginRight: 6, color: '#1677ff' }} />
          Số câu
        </span>
      ),
      key: 'questionCount',
      width: 96,
      align: 'center',
      render: (_: any, record: any) => {
        const n = record?.questionCount ?? record?.question_count ?? record?.metadata_json?.question_count;
        if (n != null && n !== '' && !Number.isNaN(Number(n))) {
          return <Text strong>{Number(n)}</Text>;
        }
        const qs = record?.questions;
        if (Array.isArray(qs) && qs.length > 0) return <Text strong>{qs.length}</Text>;
        return <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Kỹ năng',
      dataIndex: 'skillType',
      key: 'skillType',
      width: 140,
      render: (type: string) => {
        const config = SKILL_CONFIG[type] || { label: type, color: 'default', icon: <ReadOutlined /> };
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Độ khó',
      dataIndex: 'difficultyTag',
      key: 'difficultyTag',
      width: 120,
      render: (tag: string, record: any) => {
        const t = tag ?? record?.difficulty ?? record?.difficultyTag;
        const config = DIFFICULTY_CONFIG[t] || (t ? { label: t, color: 'default' } : null);
        return config ? <Tag color={config.color}>{config.label}</Tag> : <span>—</span>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      align: 'center',
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space size="small" wrap>
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={() => h.onOpenQuizDetail(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button type="default" icon={<EditOutlined />} onClick={() => h.onEditQuiz(record)} />
          </Tooltip>
          <Tooltip title="Xóa bài kiểm tra">
            <Popconfirm title="Xóa bài kiểm tra này?" onConfirm={() => h.onDeleteQuiz(record.id)}>
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];
}

export type ChallengeColumnHandlers = {
  onViewChallenge: (record: any) => void;
  onRemoveChallenge: (challengeId: string) => void;
};

export function challengeMeta(record: any): { ch: any; m: Record<string, any> } {
  const ch = record.challenge ?? record;
  const m = (ch?.metadataJson ?? ch?.metadata_json ?? {}) as Record<string, any>;
  return { ch, m };
}

export const QUIZ_CHALLENGE_SKILL_ORDER = ['READING', 'LISTENING', 'WRITING', 'SPEAKING', 'ENTRY_TEST'] as const;

/** Gom dòng quiz–challenge theo skill để mỗi kỹ năng một bảng / bộ cột riêng. */
export function groupQuizChallengesBySkill(items: any[]): { skill: string; rows: any[] }[] {
  const order = [...QUIZ_CHALLENGE_SKILL_ORDER] as string[];
  const bucket = new Map<string, any[]>();
  for (const r of items) {
    const ch = r.challenge ?? r;
    const raw = (ch.skillType ?? ch.skill_type ?? '').toString().toUpperCase().trim();
    const key = order.includes(raw) ? raw : 'OTHER';
    if (!bucket.has(key)) bucket.set(key, []);
    bucket.get(key)!.push(r);
  }
  const out: { skill: string; rows: any[] }[] = [];
  for (const k of order) {
    const rows = bucket.get(k);
    if (rows?.length) out.push({ skill: k, rows });
  }
  const other = bucket.get('OTHER');
  if (other?.length) out.push({ skill: 'OTHER', rows: other });
  return out;
}

function challengeSttColumn(): ColumnsType<any>[number] {
  return {
    title: '#',
    key: 'stt',
    width: 48,
    align: 'center',
    render: (_t: any, _r: any, index: number) => index + 1,
  };
}

function challengeDifficultyColumn(): ColumnsType<any>[number] {
  return {
    title: 'Độ khó',
    key: 'difficulty',
    width: 108,
    render: (_: any, record: any) => {
      const ch = record.challenge ?? record;
      const d = ch.difficultyTag ?? ch.difficulty_tag ?? ch.difficulty;
      const cfg = d ? DIFFICULTY_CONFIG[d] : null;
      return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{d || '—'}</Tag>;
    },
  };
}

function challengeContentColumn(title: string): ColumnsType<any>[number] {
  return {
    title,
    key: 'content',
    ellipsis: true,
    render: (_: any, record: any) => {
      const ch = record.challenge ?? record;
      return ch.contentText ?? ch.content_text ?? '—';
    },
  };
}

function challengeActionsColumn(h: ChallengeColumnHandlers): ColumnsType<any>[number] {
  return {
    title: 'Thao tác',
    key: 'action',
    width: 108,
    align: 'center',
    fixed: 'right',
    render: (_: any, record: any) => {
      const ch = record.challenge ?? record;
      const cid = ch.id;
      return (
        <Space size={4}>
          <Tooltip title="Xem đề — câu hỏi & đáp án">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => h.onViewChallenge(record)} />
          </Tooltip>
          <Tooltip title="Gỡ khỏi bài kiểm tra">
            <Popconfirm title="Gỡ thử thách khỏi bài kiểm tra?" onConfirm={() => cid && h.onRemoveChallenge(String(cid))}>
              <Button danger type="text" size="small" icon={<DeleteOutlined />} disabled={!cid} />
            </Popconfirm>
          </Tooltip>
        </Space>
      );
    },
  };
}

function audioTag(record: any): React.ReactNode {
  const { m } = challengeMeta(record);
  const url = m.audio_url || m.audioUrl || m.referenceAudioUrl || m.reference_audio_url;
  return url ? <Tag color="cyan">Đã có</Tag> : <Tag>Chưa có</Tag>;
}

/** Bảng chi tiết quiz: cột phụ thuộc kỹ năng (đọc / nghe / viết / nói…). */
export function createChallengeColumnsForSkill(skill: string, h: ChallengeColumnHandlers): ColumnsType<any> {
  const actions = challengeActionsColumn(h);
  const diffCol = challengeDifficultyColumn();

  switch (skill) {
    case 'READING':
      return [
        challengeSttColumn(),
        challengeContentColumn('Nội dung / yêu cầu'),
        {
          title: 'Cấu trúc đề đọc',
          key: 'readingBrief',
          width: 220,
          ellipsis: true,
          render: (_: any, record: any) => {
            const { m } = challengeMeta(record);
            const words = m.words;
            const opts = m.options;
            const errIdx = m.error_index ?? m.errorIndex;
            const parts: string[] = [];
            if (Array.isArray(words) && words.length) parts.push(`${words.length} từ trong câu`);
            if (Array.isArray(opts) && opts.length) parts.push(`${opts.length} lựa chọn`);
            if (errIdx != null && errIdx !== '') parts.push('Tìm lỗi chính tả / từ sai');
            return parts.length ? <Text type="secondary">{parts.join(' · ')}</Text> : <Text type="secondary">—</Text>;
          },
        },
        diffCol,
        actions,
      ];
    case 'LISTENING':
      return [
        challengeSttColumn(),
        challengeContentColumn('Câu hỏi'),
        {
          title: 'Transcript',
          key: 'transcript',
          ellipsis: true,
          render: (_: any, record: any) => {
            const { m } = challengeMeta(record);
            const t = m.transcript ?? m.transcriptText ?? m.transcript_text;
            if (!t) return <Text type="secondary">—</Text>;
            const s = String(t);
            return <Text type="secondary">{s.length > 140 ? `${s.slice(0, 140)}…` : s}</Text>;
          },
        },
        {
          title: 'Âm thanh',
          key: 'audio',
          width: 100,
          render: (_: any, record: any) => audioTag(record),
        },
        {
          title: 'Lựa chọn',
          key: 'opts',
          width: 100,
          align: 'center',
          render: (_: any, record: any) => {
            const opts = challengeMeta(record).m.options;
            return Array.isArray(opts) && opts.length ? <Tag>{opts.length} đáp án</Tag> : <Text type="secondary">—</Text>;
          },
        },
        diffCol,
        actions,
      ];
    case 'WRITING':
      return [
        challengeSttColumn(),
        challengeContentColumn('Đề bài'),
        {
          title: 'Dữ liệu viết',
          key: 'writingBrief',
          width: 220,
          ellipsis: true,
          render: (_: any, record: any) => {
            const { m } = challengeMeta(record);
            const scr = m.scrambledWords ?? m.scrambled_words;
            const lim = m.word_limit ?? m.wordLimit;
            const parts: string[] = [];
            if (Array.isArray(scr) && scr.length) parts.push(`${scr.length} từ xáo trộn`);
            if (lim != null && lim !== '') parts.push(`Giới hạn ≤ ${lim} từ`);
            if (m.correctSentence ?? m.correct_sentence) parts.push('Có câu mẫu');
            if (m.hint) parts.push('Có gợi ý');
            return parts.length ? <Text type="secondary">{parts.join(' · ')}</Text> : <Text type="secondary">—</Text>;
          },
        },
        diffCol,
        actions,
      ];
    case 'SPEAKING':
    case 'ENTRY_TEST':
      return [
        challengeSttColumn(),
        challengeContentColumn('Yêu cầu / mẫu'),
        {
          title: 'Nội dung cần nói',
          key: 'speakText',
          ellipsis: true,
          render: (_: any, record: any) => {
            const { m } = challengeMeta(record);
            const t = m.transcript ?? m.referenceText ?? m.reference_text;
            if (!t) return <Text type="secondary">—</Text>;
            const s = String(t);
            return <Text type="secondary">{s.length > 140 ? `${s.slice(0, 140)}…` : s}</Text>;
          },
        },
        {
          title: 'Âm thanh mẫu',
          key: 'refAudio',
          width: 120,
          render: (_: any, record: any) => audioTag(record),
        },
        diffCol,
        actions,
      ];
    default:
      return [
        challengeSttColumn(),
        challengeContentColumn('Nội dung'),
        {
          title: 'Kỹ năng',
          key: 'skillType',
          width: 130,
          render: (_: any, record: any) => {
            const ch = record.challenge ?? record;
            const st = ch.skillType ?? ch.skill_type;
            const cfg = st ? SKILL_CONFIG[st] : null;
            return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{st || '—'}</Tag>;
          },
        },
        {
          title: 'Âm thanh',
          key: 'audio',
          width: 100,
          render: (_: any, record: any) => audioTag(record),
        },
        diffCol,
        actions,
      ];
  }
}

export function createChallengeColumns(h: ChallengeColumnHandlers): ColumnsType<any> {
  return createChallengeColumnsForSkill('OTHER', h);
}
