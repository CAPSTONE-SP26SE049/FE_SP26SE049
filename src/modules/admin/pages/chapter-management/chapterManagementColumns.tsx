import React from 'react';
import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import {
  ArrowRightOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  ReadOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { DIFFICULTY_CONFIG, SKILL_CONFIG } from './constants';

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
        return <Tag color={color}>{region}</Tag>;
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
  onDeleteQuiz: (id: string) => void;
};

export function createQuizColumns(h: QuizColumnHandlers): ColumnsType<any> {
  return [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Kỹ năng',
      dataIndex: 'skillType',
      key: 'skillType',
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
      render: (tag: string) => {
        const config = DIFFICULTY_CONFIG[tag] || { label: tag, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={() => h.onOpenQuizDetail(record)}
            />
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
  onRemoveChallenge: (challengeId: string) => void;
};

export function createChallengeColumns(h: ChallengeColumnHandlers): ColumnsType<any> {
  return [
    {
      title: 'Nội dung',
      key: 'contentText',
      ellipsis: true,
      render: (_: any, record: any) => {
        const ch = record.challenge ?? record;
        return ch.contentText ?? '—';
      },
    },
    {
      title: 'Kỹ năng',
      key: 'skillType',
      render: (_: any, record: any) => {
        const ch = record.challenge ?? record;
        const st = ch.skillType;
        const cfg = st ? SKILL_CONFIG[st] : null;
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{st || '—'}</Tag>;
      },
    },
    {
      title: 'Âm thanh',
      key: 'audio',
      render: (_: any, record: any) => {
        const meta = (record.challenge ?? record)?.metadataJson || {};
        const url = meta.audio_url || meta.audioUrl || meta.referenceAudioUrl;
        return url ? <Tag color="cyan">Đã có</Tag> : <Tag>Chưa có</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_: any, record: any) => {
        const ch = record.challenge ?? record;
        const cid = ch.id;
        return (
          <Tooltip title="Gỡ khỏi bài kiểm tra">
            <Popconfirm title="Gỡ thử thách?" onConfirm={() => cid && h.onRemoveChallenge(String(cid))}>
              <Button danger type="text" icon={<DeleteOutlined />} disabled={!cid} />
            </Popconfirm>
          </Tooltip>
        );
      },
    },
  ];
}
