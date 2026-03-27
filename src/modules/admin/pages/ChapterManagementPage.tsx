import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Form, message } from 'antd';
import { adminService } from '../services/adminService';
import { ChapterManagementModals } from './chapter-management/ChapterManagementModals';
import {
  ChapterListView,
  QuizDetailView,
  QuizListView,
} from './chapter-management/ChapterManagementViews';
import {
  createChallengeColumns,
  createChapterColumns,
  createQuizColumns,
} from './chapter-management/chapterManagementColumns';
import { getRegionKeyFromDialect } from './chapter-management/regionUtils';

const AdminChapterManagementPage: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [viewMode, setViewMode] = useState<'CHAPTERS' | 'QUIZZES' | 'QUIZ_DETAIL'>('CHAPTERS');
  const [selectedChapter, setSelectedChapter] = useState<any | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);

  const [levels, setLevels] = useState<any[]>([]);
  const [dialects, setDialects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<any | null>(null);

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [isCreateQuizModalOpen, setIsCreateQuizModalOpen] = useState(false);
  const [creatingQuiz, setCreatingQuiz] = useState(false);

  const [quizChallenges, setQuizChallenges] = useState<any[]>([]);
  const [loadingQuizChallenges, setLoadingQuizChallenges] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [availableChallenges, setAvailableChallenges] = useState<any[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [quizForm] = Form.useForm();

  const [searchText, setSearchText] = useState('');
  const [filterRegion, setFilterRegion] = useState<string | undefined>(undefined);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchLevels();
    fetchDialects();
  }, []);

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const response = await adminService.getLevels();
      setLevels(response.data || []);
    } catch (error) {
      messageApi.error('Không thể tải danh sách học phần');
    } finally {
      setLoading(false);
    }
  };

  const fetchDialects = async () => {
    try {
      const response = await adminService.getDialects();
      setDialects(response.data || []);
    } catch (error) {
      console.error('Lỗi tải phương ngữ:', error);
    }
  };

  const fetchQuizzes = async (chapterId: string) => {
    setLoadingQuizzes(true);
    try {
      const response = await adminService.getQuizzesByLevel(chapterId);
      setQuizzes(response.data || []);
    } catch (error) {
      messageApi.error('Không thể tải danh sách bài kiểm tra');
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const fetchQuizChallenges = async (quizId: string) => {
    setLoadingQuizChallenges(true);
    try {
      const response = await adminService.getQuizChallenges(quizId);
      setQuizChallenges(response.data || []);
    } catch (error) {
      messageApi.error('Không thể tải danh sách thử thách');
    } finally {
      setLoadingQuizChallenges(false);
    }
  };

  const getRegionKey = useCallback(
    (dialectId: string) => getRegionKeyFromDialect(dialectId, dialects),
    [dialects]
  );

  const fetchChallengeBank = async (skillType: string) => {
    setLoadingBank(true);
    try {
      const region = getRegionKey(selectedChapter?.dialectId);
      const levelId = selectedChapter?.id;
      const response = await adminService.getChallengeBank(skillType, region, levelId);

      const existingIds = new Set(
        quizChallenges
          .map((c: any) => c.challenge?.id ?? c.challengeId ?? c.id)
          .filter(Boolean)
      );
      const available = (response.data || []).filter((c: any) => c.id && !existingIds.has(c.id));

      setAvailableChallenges(available);
    } catch (error) {
      messageApi.error('Không thể tải ngân hàng thử thách');
    } finally {
      setLoadingBank(false);
    }
  };

  const handleCreateLevel = async (values: any) => {
    setCreating(true);
    try {
      await adminService.createLevel({
        ...values,
        levelOrder: levels.length + 1,
        status: 'APPROVED',
      });
      messageApi.success('Đã thêm học phần mới');
      setIsCreateModalOpen(false);
      form.resetFields();
      fetchLevels();
    } catch (error) {
      messageApi.error('Lỗi khi thêm học phần');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateLevel = async (values: any) => {
    if (!selectedLevel) return;
    setUpdating(true);
    try {
      await adminService.updateLevel(selectedLevel.id, values);
      messageApi.success('Đã cập nhật học phần');
      setIsEditModalOpen(false);
      fetchLevels();
    } catch (error) {
      messageApi.error('Lỗi khi cập nhật học phần');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteLevel = async (id: string) => {
    try {
      await adminService.deleteLevel(id);
      messageApi.success('Đã xóa học phần');
      fetchLevels();
    } catch (error) {
      messageApi.error('Lỗi khi xóa học phần');
    }
  };

  const handleCreateQuiz = async (values: any) => {
    if (!selectedChapter) return;
    setCreatingQuiz(true);
    try {
      await adminService.createQuiz({
        levelId: selectedChapter.id,
        title: values.title,
        description: values.description,
        instructions: values.instructions,
        passingScore: values.passingScore ?? 80,
        timeLimitMinutes: values.timeLimitMinutes ?? 15,
        skillType: values.skillType,
        difficulty: values.difficultyTag ?? 'BEGINNER',
        questionCount: values.questionCount ?? 0,
        pointsPerQuestion: values.pointsPerQuestion ?? 10,
        comment: values.comment ?? 'Tạo quiz từ admin',
      });
      messageApi.success('Đã thêm bài kiểm tra mới');
      setIsCreateQuizModalOpen(false);
      quizForm.resetFields();
      fetchQuizzes(selectedChapter.id);
    } catch (error) {
      messageApi.error('Lỗi khi thêm bài kiểm tra');
    } finally {
      setCreatingQuiz(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await adminService.deleteQuiz(quizId);
      messageApi.success('Đã xóa bài kiểm tra');
      if (selectedChapter) fetchQuizzes(selectedChapter.id);
    } catch (error) {
      messageApi.error('Lỗi khi xóa bài kiểm tra');
    }
  };

  const handleAssignChallenges = async () => {
    if (!selectedQuiz || selectedBankIds.length === 0) return;
    setLoadingBank(true);
    try {
      await adminService.assignChallengesToQuiz(selectedQuiz.id, selectedBankIds);
      messageApi.success(`Đã thêm ${selectedBankIds.length} thử thách`);
      setIsChallengeModalOpen(false);
      setSelectedBankIds([]);
      fetchQuizChallenges(selectedQuiz.id);
    } catch (error) {
      messageApi.error('Lỗi khi gán thử thách');
    } finally {
      setLoadingBank(false);
    }
  };

  const handleRemoveChallenge = async (challengeId: string) => {
    if (!selectedQuiz) return;
    try {
      await adminService.removeChallengeFromQuiz(selectedQuiz.id, challengeId);
      messageApi.success('Đã gỡ thử thách');
      fetchQuizChallenges(selectedQuiz.id);
    } catch (error) {
      messageApi.error('Lỗi khi gỡ thử thách');
    }
  };

  const filteredLevels = useMemo(() => {
    let data = [...levels];
    if (searchText) {
      data = data.filter((l) => (l.name || '').toLowerCase().includes(searchText.toLowerCase()));
    }
    if (filterRegion) {
      data = data.filter((l) => getRegionKey(l.dialectId) === filterRegion);
    }
    return data;
  }, [levels, searchText, filterRegion, getRegionKey]);

  const chapterColumns = useMemo(
    () =>
      createChapterColumns({
        getRegionKey,
        onOpenQuizzes: (record) => {
          setSelectedChapter(record);
          setViewMode('QUIZZES');
          fetchQuizzes(record.id);
        },
        onEdit: (record) => {
          setSelectedLevel(record);
          editForm.setFieldsValue({
            name: record.name,
            dialectId: record.dialectId,
            description: record.metadata_json?.description || record.description,
            minStarsRequired: record.metadata_json?.min_stars_required || record.minStarsRequired,
          });
          setIsEditModalOpen(true);
        },
        onDeleteLevel: handleDeleteLevel,
      }),
    [getRegionKey, editForm, fetchQuizzes, handleDeleteLevel]
  );

  const quizColumns = useMemo(
    () =>
      createQuizColumns({
        onOpenQuizDetail: (record) => {
          setSelectedQuiz(record);
          setSelectedLevel(selectedChapter);
          setViewMode('QUIZ_DETAIL');
          fetchQuizChallenges(record.id);
        },
        onDeleteQuiz: handleDeleteQuiz,
      }),
    [selectedChapter, fetchQuizChallenges, handleDeleteQuiz]
  );

  const challengeColumns = useMemo(
    () =>
      createChallengeColumns({
        onRemoveChallenge: handleRemoveChallenge,
      }),
    [handleRemoveChallenge]
  );

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px' }}>
        {viewMode === 'CHAPTERS' && (
          <ChapterListView
            searchText={searchText}
            onSearchChange={setSearchText}
            filterRegion={filterRegion}
            onFilterRegion={setFilterRegion}
            onOpenImport={() => setIsImportModalOpen(true)}
            onOpenCreateChapter={() => setIsCreateModalOpen(true)}
            filteredLevels={filteredLevels}
            chapterColumns={chapterColumns}
            loading={loading}
          />
        )}
        {viewMode === 'QUIZZES' && (
          <QuizListView
            chapterName={selectedChapter?.name}
            onBack={() => setViewMode('CHAPTERS')}
            onOpenCreateQuiz={() => setIsCreateQuizModalOpen(true)}
            quizzes={quizzes}
            quizColumns={quizColumns}
            loadingQuizzes={loadingQuizzes}
          />
        )}
        {viewMode === 'QUIZ_DETAIL' && (
          <QuizDetailView
            quizTitle={selectedQuiz?.title}
            quizDescription={selectedQuiz?.description}
            onBack={() => setViewMode('QUIZZES')}
            onOpenChallengeBank={() => {
              fetchChallengeBank(selectedQuiz?.skillType);
              setIsChallengeModalOpen(true);
            }}
            quizChallenges={quizChallenges}
            challengeColumns={challengeColumns}
            loadingQuizChallenges={loadingQuizChallenges}
          />
        )}

        <ChapterManagementModals
          dialects={dialects}
          form={form}
          editForm={editForm}
          quizForm={quizForm}
          isCreateModalOpen={isCreateModalOpen}
          isEditModalOpen={isEditModalOpen}
          isCreateQuizModalOpen={isCreateQuizModalOpen}
          isChallengeModalOpen={isChallengeModalOpen}
          isImportModalOpen={isImportModalOpen}
          creating={creating}
          updating={updating}
          creatingQuiz={creatingQuiz}
          loadingBank={loadingBank}
          importing={importing}
          importFile={importFile}
          selectedBankIds={selectedBankIds}
          availableChallenges={availableChallenges}
          onCloseCreate={() => setIsCreateModalOpen(false)}
          onCloseEdit={() => setIsEditModalOpen(false)}
          onCloseQuiz={() => setIsCreateQuizModalOpen(false)}
          onCloseChallenge={() => setIsChallengeModalOpen(false)}
          onCloseImport={() => setIsImportModalOpen(false)}
          onSubmitCreate={() => form.submit()}
          onSubmitEdit={() => editForm.submit()}
          onSubmitQuiz={() => quizForm.submit()}
          onSubmitChallenge={handleAssignChallenges}
          onCreateFinish={handleCreateLevel}
          onEditFinish={handleUpdateLevel}
          onQuizFinish={handleCreateQuiz}
          onBankSelectionChange={setSelectedBankIds}
          onImportFileChange={setImportFile}
          onImportStart={async () => {
            if (!importFile) return;
            setImporting(true);
            messageApi.info('Tính năng import đang được tối ưu hóa');
            setImporting(false);
            setIsImportModalOpen(false);
          }}
        />
      </div>
    </>
  );
};

export default AdminChapterManagementPage;
