import React from 'react';
import { ArrowLeftOutlined, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Input, Row, Select, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

type ChapterListViewProps = {
  searchText: string;
  onSearchChange: (v: string) => void;
  filterRegion: string | undefined;
  onFilterRegion: (v: string | undefined) => void;
  onOpenImport: () => void;
  onOpenCreateChapter: () => void;
  filteredLevels: any[];
  chapterColumns: ColumnsType<any>;
  loading: boolean;
};

export function ChapterListView({
  searchText,
  onSearchChange,
  filterRegion,
  onFilterRegion,
  onOpenImport,
  onOpenCreateChapter,
  filteredLevels,
  chapterColumns,
  loading,
}: ChapterListViewProps) {
  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Bộ lọc" styles={{ body: { padding: '16px' } }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} sm={16} md={18}>
            <Space size="middle" wrap style={{ width: '100%' }}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Tìm kiếm học phần..."
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{ width: 300, maxWidth: '100%' }}
              />
              <Select
                style={{ width: 180 }}
                placeholder="Vùng miền"
                allowClear
                value={filterRegion}
                onChange={(val) => onFilterRegion(val)}
              >
                <Select.Option value="BAC">Miền Bắc</Select.Option>
                <Select.Option value="TRUNG">Miền Trung</Select.Option>
                <Select.Option value="NAM">Miền Nam</Select.Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={8} md={6} style={{ textAlign: 'right' }}>
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
      <Card title="Danh sách học phần">
        <Table
          dataSource={filteredLevels}
          columns={chapterColumns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </Space>
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
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            Quay lại danh sách học phần
          </Button>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <Title level={2} style={{ margin: 0 }}>
              Bài kiểm tra — {chapterName ?? '—'}
            </Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={onOpenCreateQuiz}>
              Thêm bài kiểm tra
            </Button>
          </div>
        </Space>
      </Card>
      <Card title="Danh sách bài kiểm tra">
        <Table dataSource={quizzes} columns={quizColumns} rowKey="id" loading={loadingQuizzes} />
      </Card>
    </Space>
  );
}

type QuizDetailViewProps = {
  quizTitle?: string;
  quizDescription?: string;
  onBack: () => void;
  onOpenChallengeBank: () => void;
  quizChallenges: any[];
  challengeColumns: ColumnsType<any>;
  loadingQuizChallenges: boolean;
};

export function QuizDetailView({
  quizTitle,
  quizDescription,
  onBack,
  onOpenChallengeBank,
  quizChallenges,
  challengeColumns,
  loadingQuizChallenges,
}: QuizDetailViewProps) {
  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            Quay lại danh sách bài kiểm tra
          </Button>
        </Space>
      </Card>
      <Card
        title="Thông tin bài kiểm tra"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={onOpenChallengeBank}>
            Thêm từ ngân hàng
          </Button>
        }
      >
        <Title level={4} style={{ marginTop: 0 }}>
          {quizTitle}
        </Title>
        <Typography.Text type="secondary">{quizDescription}</Typography.Text>
      </Card>
      <Card title="Thử thách trong bài kiểm tra">
        <Table
          dataSource={quizChallenges}
          columns={challengeColumns}
          rowKey={(r: any) => String((r.challenge ?? r).id ?? r.orderIndex)}
          loading={loadingQuizChallenges}
        />
      </Card>
    </Space>
  );
}
