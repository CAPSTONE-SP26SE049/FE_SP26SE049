import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  PlusOutlined,
  ReadOutlined,
  SearchOutlined,
  TrophyOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Input,
  Pagination,
  Popconfirm,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  createChallengeColumnsForSkill,
  groupQuizChallengesBySkill,
} from './chapterManagementColumns';
import { DIFFICULTY_CONFIG, SKILL_CONFIG } from './constants';
import { getRegionLabel } from './regionUtils';

const { Title, Text } = Typography;

/** Sao chép layout từ Antigravity brain `1cc7d1c6-.../walkthrough.md.resolved` (List lưới + Card từng học phần). */
type ChapterListViewProps = {
  searchText: string;
  onSearchChange: (v: string) => void;
  /** Nhãn miền đang chọn từ menu sidebar (URL ?region=). */
  regionBadgeLabel?: string;
  onOpenImport: () => void;
  onOpenCreateChapter: () => void;
  filteredLevels: any[];
  loading: boolean;
  getRegionKey: (dialectId: string) => string;
  onOpenQuizzes: (record: any) => void;
  onEditChapter: (record: any) => void;
  onDeleteLevel: (id: string) => void;
  /** Gom từ GET /admin/content/quizzes + engagement-stats. */
  levelStats?: Record<
    string,
    { quizCount?: number; learnerCount?: number; successRate?: number; failRate?: number }
  >;
  /** Đang tải batch thống kê (một request cho cả danh sách). */
  statsLoading?: boolean;
  loadingStats?: Record<string, boolean>;
};

export function ChapterListView({
  searchText,
  onSearchChange,
  regionBadgeLabel,
  onOpenImport,
  onOpenCreateChapter,
  filteredLevels,
  loading,
  getRegionKey,
  onOpenQuizzes,
  onEditChapter,
  onDeleteLevel,
  levelStats = {},
  statsLoading = false,
  loadingStats = {},
}: ChapterListViewProps) {
  const [chapterPage, setChapterPage] = useState(1);
  const chapterPageSize = 12;

  useEffect(() => {
    setChapterPage(1);
  }, [searchText, regionBadgeLabel, filteredLevels.length]);

  const pagedLevels = useMemo(() => {
    const start = (chapterPage - 1) * chapterPageSize;
    return filteredLevels.slice(start, start + chapterPageSize);
  }, [filteredLevels, chapterPage, chapterPageSize]);

  return (
    <div className="space-y-6">
      <Card
        style={{ marginBottom: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        styles={{ body: { padding: '16px' } }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={14} lg={16} xl={18}>
            <Space size="middle" wrap style={{ width: '100%' }} align="center">
              <Input
                prefix={<SearchOutlined />}
                placeholder="Tìm kiếm học phần..."
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{ width: 300, maxWidth: '100%' }}
              />
              {regionBadgeLabel ? (
                <Tooltip title="Đổi miền trong menu trái: Học phần & Bài kiểm tra">
                  <Tag color="processing" style={{ margin: 0, padding: '4px 10px', fontSize: 13 }}>
                    Vùng: {regionBadgeLabel}
                  </Tag>
                </Tooltip>
              ) : (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Tất cả miền — chọn trong menu trái
                </Text>
              )}
            </Space>
          </Col>
          <Col xs={24} md={10} lg={8} xl={6} style={{ textAlign: 'right' }}>
            <Space wrap>
              <Button type="primary" icon={<UploadOutlined />} onClick={onOpenImport}>
                Import
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={onOpenCreateChapter}>
                Thêm học phần
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          {pagedLevels.map((record: any) => {
            const region = getRegionKey(record.dialectId);
            const regionColor = region === 'BAC' ? 'red' : region === 'TRUNG' ? 'gold' : 'blue';
            const stats = levelStats[record.id] || {};
            const quizCount =
              stats.quizCount ??
              (record.total_quizzes ||
                record.totalQuizzes ||
                record.quiz_count ||
                record.quizCount ||
                0);
            const learnerCount =
              stats.learnerCount ??
              (record.learner_count ||
                record.learnerCount ||
                record.participation_count ||
                record.participationCount ||
                0);
            const successPct =
              stats.successRate ??
              record.success_rate ??
              record.successRate ??
              0;
            const failPct = stats.failRate ?? record.fail_rate ?? record.failRate ?? 0;
            const statLoading = statsLoading || loadingStats[record.id];

            return (
              <Col key={record.id} xs={24} sm={12} md={12} lg={8} xl={8} xxl={6}>
                <Card
                  hoverable
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #f0f0f0',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                  styles={{
                    body: {
                      padding: '24px 20px 20px 20px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    },
                  }}
                  actions={[
                    <Tooltip key="quiz" title="Quản lý bài kiểm tra">
                      <FileAddOutlined
                        onClick={() => {
                          onOpenQuizzes(record);
                        }}
                      />
                    </Tooltip>,
                    <Tooltip key="edit" title="Chỉnh sửa">
                      <EditOutlined onClick={() => onEditChapter(record)} />
                    </Tooltip>,
                    <Popconfirm
                      key="del"
                      title="Xóa học phần này?"
                      description="Tất cả bài kiểm tra trong học phần cũng sẽ bị ảnh hưởng."
                      onConfirm={() => onDeleteLevel(record.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <DeleteOutlined style={{ color: '#ff4d4f' }} />
                    </Popconfirm>,
                  ]}
                >
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div
                      style={{
                        marginBottom: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        minHeight: '54px',
                      }}
                    >
                      <Title
                        level={4}
                        style={{
                          margin: 0,
                          fontSize: '17px',
                          lineHeight: '1.4',
                          flex: 1,
                          paddingRight: '8px',
                        }}
                      >
                        {record.name}
                      </Title>
                      <Tag color={regionColor} style={{ marginRight: 0, flexShrink: 0 }}>
                        {getRegionLabel(region)}
                      </Tag>
                    </div>

                    <Text
                      type="secondary"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: '20px',
                        height: '42px',
                        fontSize: '13px',
                        lineHeight: '1.6',
                      }}
                    >
                      {record.metadata_json?.description ||
                        record.description ||
                        'Không có mô tả cho học phần này.'}
                    </Text>

                    <div
                      style={{
                        background: '#f8f9fa',
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                      }}
                    >
                      <Row gutter={[12, 16]}>
                        <Col span={12}>
                          <div
                            style={{
                              fontSize: '10px',
                              color: '#8c8c8c',
                              textTransform: 'uppercase',
                              marginBottom: '4px',
                              fontWeight: 600,
                            }}
                          >
                            Bài kiểm tra
                          </div>
                          <div style={{ fontWeight: 700, color: '#13c2c2', fontSize: '15px' }}>
                            <ReadOutlined style={{ fontSize: '14px' }} />{' '}
                            {statLoading ? <span className="animate-pulse">...</span> : quizCount}
                          </div>
                        </Col>
                        <Col span={12}>
                          <div
                            style={{
                              fontSize: '10px',
                              color: '#8c8c8c',
                              textTransform: 'uppercase',
                              marginBottom: '4px',
                              fontWeight: 600,
                            }}
                          >
                            Tham gia
                          </div>
                          <div style={{ fontWeight: 700, color: '#722ed1', fontSize: '15px' }}>
                            <UserOutlined style={{ fontSize: '14px' }} />{' '}
                            {statLoading ? <span className="animate-pulse">...</span> : learnerCount}
                          </div>
                        </Col>
                        <Col span={12}>
                          <div
                            style={{
                              fontSize: '10px',
                              color: '#8c8c8c',
                              textTransform: 'uppercase',
                              marginBottom: '4px',
                              fontWeight: 600,
                            }}
                          >
                            Tỉ lệ đúng
                          </div>
                          <div style={{ fontWeight: 700, color: '#52c41a', fontSize: '15px' }}>
                            <CheckCircleOutlined style={{ fontSize: '14px' }} />{' '}
                            {successPct}%
                          </div>
                        </Col>
                        <Col span={12}>
                          <div
                            style={{
                              fontSize: '10px',
                              color: '#8c8c8c',
                              textTransform: 'uppercase',
                              marginBottom: '4px',
                              fontWeight: 600,
                            }}
                          >
                            Tỉ lệ sai
                          </div>
                          <div style={{ fontWeight: 700, color: '#ff4d4f', fontSize: '15px' }}>
                            <CloseCircleOutlined style={{ fontSize: '14px' }} />{' '}
                            {failPct}%
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid #f0f0f0',
                      paddingTop: '12px',
                      marginTop: 'auto',
                    }}
                  >
                    <Space>
                      <TrophyOutlined style={{ color: '#faad14' }} />
                      <Text strong>
                        {record.metadata_json?.min_stars_required || record.minStarsRequired || 0} sao
                      </Text>
                    </Space>
                    <Button
                      type="primary"
                      ghost
                      size="small"
                      onClick={() => onOpenQuizzes(record)}
                      icon={<ArrowRightOutlined />}
                    >
                      Chi tiết
                    </Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Spin>
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Pagination
          current={chapterPage}
          pageSize={chapterPageSize}
          total={filteredLevels.length}
          onChange={setChapterPage}
          hideOnSinglePage
          showSizeChanger={false}
        />
      </div>
    </div>
  );
}

type QuizListViewProps = {
  chapterName?: string;
  onBack: () => void;
  onOpenCreateQuiz: () => void;
  quizzes: any[];
  quizColumns: ColumnsType<any>;
  loadingQuizzes: boolean;
};

export function QuizListView({
  chapterName,
  onBack,
  onOpenCreateQuiz,
  quizzes,
  quizColumns,
  loadingQuizzes,
}: QuizListViewProps) {
  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <Card
        variant="borderless"
        className="shadow-sm rounded-xl"
        style={{ border: '1px solid #f0f0f0' }}
        styles={{ body: { padding: '18px 22px' } }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between" wrap>
          <Col xs={24} lg={16}>
            <Space align="start" size="middle" wrap>
              <Button type="default" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ marginTop: 2 }}>
                Quay lại
              </Button>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Title level={4} style={{ margin: 0, lineHeight: 1.35, fontSize: 20 }}>
                  Bài kiểm tra{' '}
                  <Text type="secondary" style={{ fontWeight: 600, color: 'rgba(0,0,0,0.78)' }}>
                    — {chapterName ?? '—'}
                  </Text>
                </Title>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 6, lineHeight: 1.5 }}>
                  Học phần đang mở · Quản lý danh sách bài kiểm tra, số câu và mô tả hiển thị trong bảng bên dưới
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} lg={8} style={{ textAlign: 'right' }}>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={onOpenCreateQuiz}>
              Thêm bài kiểm tra
            </Button>
          </Col>
        </Row>
      </Card>
      <Card
        variant="borderless"
        className="shadow-sm rounded-xl"
        style={{ border: '1px solid #f0f0f0' }}
        title={
          <Title level={5} style={{ margin: 0, fontSize: 16 }}>
            Danh sách bài kiểm tra
          </Title>
        }
        styles={{
          header: { padding: '14px 18px', borderBottom: '1px solid #f0f0f0' },
          body: { padding: '12px 16px 16px' },
        }}
      >
        <Table
          dataSource={quizzes}
          columns={quizColumns}
          rowKey="id"
          loading={loadingQuizzes}
          size="middle"
          bordered
          pagination={{
            pageSize: 10,
            hideOnSinglePage: true,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} bài`,
          }}
          scroll={{ x: 980 }}
        />
      </Card>
    </Space>
  );
}

type QuizDetailViewProps = {
  quizTitle?: string;
  quizDescription?: string;
  quizInstructions?: string;
  quizSkillType?: string;
  quizDifficultyTag?: string;
  quizPassingScore?: number;
  quizTimeLimitMinutes?: number;
  onBack: () => void;
  onOpenChallengeBank: () => void;
  quizChallenges: any[];
  loadingQuizChallenges: boolean;
  onViewChallenge: (record: any) => void;
  onRemoveChallenge: (challengeId: string) => void;
};

export function QuizDetailView({
  quizTitle,
  quizDescription,
  quizInstructions,
  quizSkillType,
  quizDifficultyTag,
  quizPassingScore,
  quizTimeLimitMinutes,
  onBack,
  onOpenChallengeBank,
  quizChallenges,
  loadingQuizChallenges,
  onViewChallenge,
  onRemoveChallenge,
}: QuizDetailViewProps) {
  const heading = (quizTitle ?? '').trim() || '—';
  const descTrim = (quizDescription ?? '').trim();
  const instrTrim = (quizInstructions ?? '').trim();

  const challengeGroups = useMemo(() => groupQuizChallengesBySkill(quizChallenges ?? []), [quizChallenges]);

  const challengeHandlers = useMemo(
    () => ({ onViewChallenge, onRemoveChallenge }),
    [onViewChallenge, onRemoveChallenge]
  );

  return (
    <Space orientation="vertical" size="small" style={{ width: '100%', marginTop: 0 }}>
      <Card
        variant="borderless"
        className="shadow-sm rounded-xl"
        style={{ marginTop: 0, border: '1px solid #f0f0f0' }}
        styles={{
          header: { padding: '10px 16px 12px', minHeight: 0, borderBottom: '1px solid #f0f0f0' },
          body: { padding: '16px 18px 18px' },
        }}
        title={
          <Space align="center" size="small" wrap style={{ rowGap: 0 }}>
            <Button type="link" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ paddingInline: 0, height: 22 }}>
              Quay lại danh sách
            </Button>
            <Text strong style={{ fontSize: 15, lineHeight: '22px' }}>
              Thông tin bài kiểm tra
            </Text>
          </Space>
        }
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onOpenChallengeBank}>
            Thêm từ ngân hàng
          </Button>
        }
      >
        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2, md: 2, lg: 2 }}
          labelStyle={{ width: 148, fontWeight: 600, background: '#fafafa' }}
          contentStyle={{ background: '#fff' }}
        >
          <Descriptions.Item label="Tiêu đề" span={2}>
            <Text strong style={{ fontSize: 15 }}>
              {heading}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={2}>
            {descTrim ? (
              <Text style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{descTrim}</Text>
            ) : (
              <Text type="secondary">Chưa có mô tả</Text>
            )}
          </Descriptions.Item>
          {instrTrim ? (
            <Descriptions.Item label="Hướng dẫn làm bài" span={2}>
              <Text style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{instrTrim}</Text>
            </Descriptions.Item>
          ) : null}
          {quizSkillType ? (
            <Descriptions.Item label="Kỹ năng">
              {SKILL_CONFIG[quizSkillType] ? (
                <Tag color={SKILL_CONFIG[quizSkillType].color} icon={SKILL_CONFIG[quizSkillType].icon} style={{ margin: 0 }}>
                  {SKILL_CONFIG[quizSkillType].label}
                </Tag>
              ) : (
                <Tag>{quizSkillType}</Tag>
              )}
            </Descriptions.Item>
          ) : null}
          {quizDifficultyTag ? (
            <Descriptions.Item label="Độ khó">
              {DIFFICULTY_CONFIG[quizDifficultyTag] ? (
                <Tag color={DIFFICULTY_CONFIG[quizDifficultyTag].color} style={{ margin: 0 }}>
                  {DIFFICULTY_CONFIG[quizDifficultyTag].label}
                </Tag>
              ) : (
                <Tag>{quizDifficultyTag}</Tag>
              )}
            </Descriptions.Item>
          ) : null}
          {quizPassingScore != null && !Number.isNaN(quizPassingScore) ? (
            <Descriptions.Item label="Điểm đạt">{quizPassingScore}%</Descriptions.Item>
          ) : null}
          {quizTimeLimitMinutes != null && !Number.isNaN(quizTimeLimitMinutes) ? (
            <Descriptions.Item label="Thời gian">{quizTimeLimitMinutes} phút</Descriptions.Item>
          ) : null}
        </Descriptions>
      </Card>
      <Card
        variant="borderless"
        className="shadow-sm rounded-xl"
        style={{ marginTop: 0, border: '1px solid #f0f0f0' }}
        title={
          <div>
            <Title level={5} style={{ margin: 0, fontSize: 16 }}>
              Thử thách trong bài kiểm tra
            </Title>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
              Thử thách được nhóm theo kỹ năng; mỗi nhóm có cột phù hợp (đọc / nghe / viết / nói). Xem đề đầy đủ bằng mắt ·
              Gỡ bằng thùng rác
            </Text>
          </div>
        }
        styles={{ header: { padding: '14px 18px', borderBottom: '1px solid #f0f0f0' }, body: { padding: '12px 16px 16px' } }}
      >
        <Spin spinning={loadingQuizChallenges}>
          {!loadingQuizChallenges && challengeGroups.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thử thách trong bài kiểm tra" />
          ) : (
            <Space orientation="vertical" size="large" style={{ width: '100%' }}>
              {challengeGroups.map(({ skill, rows }) => (
                  <div key={skill}>
                    <Table
                      dataSource={rows}
                      columns={createChallengeColumnsForSkill(skill, challengeHandlers)}
                      rowKey={(r: any, i) => String((r.challenge ?? r).id ?? `row-${skill}-${i}`)}
                      size="middle"
                      bordered
                      pagination={
                        rows.length > 8
                          ? { pageSize: 8, showSizeChanger: false, hideOnSinglePage: true }
                          : false
                      }
                      scroll={{ x: 'max-content' }}
                    />
                  </div>
              ))}
            </Space>
          )}
        </Spin>
      </Card>
    </Space>
  );
}
