import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Card,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Typography,
  Divider,
  Empty
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { Quiz, QuizCreateRequest, QuizQuestionRequest } from '../services/educatorService';
import { educatorService } from '../services/educatorService';

const { Title, Text } = Typography;

interface QuizManagementComponentProps {
  levelId?: string;
  embedded?: boolean;
}

const QuizManagementComponent: React.FC<QuizManagementComponentProps> = ({ levelId, embedded = false }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [form] = Form.useForm();
  const [questions, setQuestions] = useState<QuizQuestionRequest[]>([]);
  const [dialects, setDialects] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [fetchingLevels, setFetchingLevels] = useState(false);

  const fetchDialects = async () => {
    try {
      const res = await educatorService.getDialects();
      setDialects(res.data || (Array.isArray(res) ? res : []));
    } catch (error) {
      console.error('Failed to fetch dialects:', error);
    }
  };

  const fetchLevelsByRegion = async (regionName: string) => {
    try {
      setFetchingLevels(true);
      const res = await educatorService.getCurriculumByRegion(regionName);
      const data = res.data || (Array.isArray(res) ? res : []);
      setLevels(data);
    } catch (error) {
      console.error('Failed to fetch levels:', error);
      message.error('Không thể tải danh sách bài học cho vùng này');
    } finally {
      setFetchingLevels(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res: any = await educatorService.getQuizzes();
      let data = res.data || (Array.isArray(res) ? res : []);

      if (levelId) {
        data = data.filter((q: Quiz) => q.levelId === levelId);
      }

      setQuizzes(data);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
      message.error('Không thể tải danh sách bài kiểm tra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    fetchDialects();
  }, [levelId]);

  const openNewQuizModal = () => {
    setEditingQuiz(null);
    form.resetFields();

    if (levelId) {
      form.setFieldsValue({ levelId });
    }

    setLevels([]);
    setQuestions([{
      skillType: 'PRONUNCIATION',
      difficulty: 'MEDIUM',
      questionOrder: 1,
      points: 10,
      contentData: { text: '' }
    }]);
    setModalOpen(true);
  };

  const openEditQuizModal = async (record: Quiz) => {
    try {
      setLoading(true);
      const res: any = await educatorService.getQuizDetails(record.id);
      const fullQuiz = res.data || res;
      setEditingQuiz(fullQuiz);

      // Try to determine the dialect from the level if the backend provides it
      if (fullQuiz.level?.dialect?.name) {
        fetchLevelsByRegion(fullQuiz.level.dialect.name);
        form.setFieldsValue({
          dialectName: fullQuiz.level.dialect.name,
        });
      }

      form.setFieldsValue({
        levelId: fullQuiz.levelId,
        title: fullQuiz.title,
        description: fullQuiz.description,
        instructions: fullQuiz.instructions,
        secondsPerQuestion: Math.round((fullQuiz.timeLimitSeconds || 900) / (fullQuiz.questions?.length || 10)),
      });
      setQuestions(fullQuiz.questions || []);
      setModalOpen(true);
    } catch (error) {
      message.error('Không thể tải chi tiết bài kiểm tra');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (questions.length === 0) {
        message.warning('Vui lòng thêm ít nhất một câu hỏi');
        return;
      }

      setLoading(true);
      const { dialectName, secondsPerQuestion, ...restValues } = values;
      const payload: QuizCreateRequest = {
        ...restValues,
        passingScore: restValues.passingScore || 80,
        timeLimitSeconds: (secondsPerQuestion || 90) * questions.length,
        levelId: levelId || restValues.levelId, // Prioritize levelId from props
        questions: questions.map((q, index) => ({ ...q, questionOrder: index + 1 }))
      };

      if (editingQuiz) {
        await educatorService.updateQuiz(editingQuiz.id, payload);
        message.success('Cập nhật bài kiểm tra thành công');
      } else {
        await educatorService.createQuiz(payload);
        message.success('Tạo bài kiểm tra thành công. Chờ Admin phê duyệt.');
      }

      setModalOpen(false);
      fetchQuizzes();
    } catch (error) {
      console.error('Save quiz error:', error);
      message.error('Lỗi khi lưu bài kiểm tra');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, {
      skillType: 'PRONUNCIATION',
      difficulty: 'MEDIUM',
      questionOrder: questions.length + 1,
      points: 10,
      contentData: { text: '' }
    }]);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (index: number, field: keyof QuizQuestionRequest, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleContentDataChange = (index: number, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], contentData: { ...newQuestions[index].contentData, text: value } };
    setQuestions(newQuestions);
  };

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let label = status;
        if (status === 'APPROVED') { color = 'success'; label = 'Đã duyệt'; }
        if (status === 'PENDING') { color = 'warning'; label = 'Chờ duyệt'; }
        if (status === 'REJECTED') { color = 'error'; label = 'Từ chối'; }
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Điểm đạt',
      dataIndex: 'passingScore',
      key: 'passingScore',
      render: (val: number) => <Tag color="blue">{val}đ</Tag>,
    },
    {
      title: 'Thời gian',
      dataIndex: 'timeLimitSeconds',
      key: 'timeLimitSeconds',
      render: (val: number) => val ? `${val} giây` : '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: Quiz) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditQuizModal(record)}
          >
            Sửa
          </Button>
          {!embedded && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              href={`/learner/quiz/${record.id}`}
              target="_blank"
            >
              Xem thử
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const content = (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={embedded ? 5 : 3} style={{ margin: 0 }}>
            {levelId ? 'Bài kiểm tra của bài học' : 'Quản lý Bài kiểm tra'}
          </Title>
          {!embedded && <Text type="secondary">Tạo và quản lý các bài kiểm tra đánh giá năng lực học sinh</Text>}
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openNewQuizModal}
          size={embedded ? "middle" : "large"}
          style={{
            borderRadius: '10px',
            background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
          }}
        >
          Tạo Bài Kiểm Tra
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={quizzes}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: embedded ? 5 : 10 }}
        className="custom-table"
        size={embedded ? "small" : "middle"}
      />

      <Modal
        title={editingQuiz ? "Chỉnh sửa Bài kiểm tra" : "Tạo Bài kiểm tra mới"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={800}
        okText="Lưu bài kiểm tra"
        cancelText="Hủy"
        centered
        confirmLoading={loading}
      >
        <Form layout="vertical" form={form} style={{ marginTop: '16px' }}>
          <Title level={5}>Thông tin chung</Title>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="title"
              label="Tiêu đề bài kiểm tra"
              rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
              className="col-span-2"
            >
              <Input placeholder="Ví dụ: Kiểm tra phát âm trung cấp" />
            </Form.Item>

            {!levelId && (
              <>
                <Form.Item
                  name="dialectName"
                  label="Vùng miền (Dialect)"
                  rules={[{ required: true, message: 'Vui lòng chọn vùng miền' }]}
                >
                  <Select
                    placeholder="Chọn vùng miền..."
                    onChange={(val) => {
                      form.setFieldValue('levelId', undefined);
                      fetchLevelsByRegion(val);
                    }}
                  >
                    {dialects.map(d => (
                      <Select.Option key={d.id} value={d.name}>{d.description || d.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="levelId"
                  label="Cấp độ (Level)"
                  rules={[{ required: true, message: 'Vui lòng chọn cấp độ' }]}
                >
                  <Select
                    placeholder="Chọn bài học..."
                    loading={fetchingLevels}
                    disabled={!form.getFieldValue('dialectName')}
                  >
                    {levels.map(l => (
                      <Select.Option key={l.id} value={l.id}>{l.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </>
            )}
          </div>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={2} placeholder="Mô tả ngắn gọn về nội dung bài kiểm tra" />
          </Form.Item>

          <Form.Item
            name="instructions"
            label="Hướng dẫn học sinh"
          >
            <Input.TextArea rows={2} placeholder="Ví dụ: Đọc to các câu sau đây với âm điệu chuẩn..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            {/* Điểm đạt ẩn đi và mặc định 80 */}
            <Form.Item
              name="secondsPerQuestion"
              label="Số giây mỗi câu hỏi"
              initialValue={90}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Divider orientation={"left" as any}>Danh sách câu hỏi ({questions.length})</Divider>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {questions.map((q, index) => (
              <Card
                key={index}
                size="small"
                className="bg-gray-50 border-gray-200"
                actions={[
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveQuestion(index)}
                  >
                    Xóa câu hỏi
                  </Button>
                ]}
              >
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Loại kỹ năng</Text>
                    <Select
                      className="w-full"
                      size="small"
                      value={q.skillType}
                      onChange={(v) => handleQuestionChange(index, 'skillType', v)}
                    >
                      <Select.Option value="PRONUNCIATION">Phát âm</Select.Option>
                      <Select.Option value="LISTENING">Nghe</Select.Option>
                      <Select.Option value="VOCABULARY">Giao tiếp</Select.Option>
                    </Select>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Điểm số</Text>
                    <InputNumber
                      min={1}
                      size="small"
                      className="w-full"
                      value={q.points}
                      onChange={(v) => handleQuestionChange(index, 'points', v)}
                    />
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '11px' }}>Nội dung câu hỏi</Text>
                  <Input.TextArea
                    size="small"
                    placeholder="Nhập nội dung text cho câu hỏi..."
                    value={q.contentData?.text}
                    onChange={(e) => handleContentDataChange(index, e.target.value)}
                  />
                </div>
              </Card>
            ))}

            {questions.length === 0 && (
              <Empty description="Chưa có câu hỏi nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}

            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              onClick={handleAddQuestion}
              style={{ marginTop: '8px' }}
            >
              Thêm Câu Hỏi
            </Button>
          </div>
        </Form>
      </Modal>

      <style>{`
        .custom-table .ant-table-thead > tr > th {
          background: #fafafa;
          font-weight: 700;
          color: #595959;
          text-transform: uppercase;
          font-size: 11px;
        }
        .custom-table .ant-table-tbody > tr:hover > td {
          background: #f0f7ff !important;
        }
      `}</style>
    </>
  );

  if (embedded) {
    return <div className="p-1">{content}</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <Card variant="borderless" className="shadow-sm rounded-2xl">
        {content}
      </Card>
    </div>
  );
};

export default QuizManagementComponent;
