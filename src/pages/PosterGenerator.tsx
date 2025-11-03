import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { generatePoster } from '@/lib/volcengine/posterService';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import type { TrainingSession, Expert } from '@/lib/supabase/types';
import Sidebar from '@/components/Sidebar';

// 图片比例选项（基础尺寸在 512-2048 范围内）
const ASPECT_RATIOS = [
  { id: '9:16', name: '竖版手机 (9:16)', width: 1080, height: 1920, description: '适合手机海报、朋友圈' },
  { id: '16:9', name: '横版宽屏 (16:9)', width: 1920, height: 1080, description: '适合电脑展示、横屏' },
  { id: '1:1', name: '正方形 (1:1)', width: 1024, height: 1024, description: '适合社交媒体、头像' },
  { id: '3:4', name: '竖版标准 (3:4)', width: 1536, height: 2048, description: '适合打印、海报' },
  { id: '4:3', name: '横版标准 (4:3)', width: 2048, height: 1536, description: '适合PPT、演示' },
];

// 分辨率选项（确保最终尺寸不超过 2048）
const RESOLUTIONS = [
  { id: 'sd', name: '标清 (SD)', multiplier: 0.5, description: '快速生成，文件小' },
  { id: 'hd', name: '高清 (HD)', multiplier: 1, description: '推荐使用，质量好' },
  { id: 'fhd', name: '超清 (FHD)', multiplier: 1, description: '最高质量（部分比例不可用）' },
];

// 海报风格模板
const POSTER_STYLES = [
  {
    id: 'modern',
    name: '现代商务',
    description: '简洁大气，蓝色主色调，适合企业培训',
    template: '采用现代商务设计风格，蓝色渐变背景，简洁大气的排版，标题醒目，内容清晰，整体呈现专业高端的视觉效果',
  },
  {
    id: 'tech',
    name: '科技感',
    description: '科技元素，深色背景，适合技术类培训',
    template: '采用科技感设计风格，深蓝色或黑色背景，搭配几何图形和光效元素，营造未来科技氛围，文字使用现代字体',
  },
  {
    id: 'warm',
    name: '温馨活力',
    description: '暖色调，亲和力强，适合软技能培训',
    template: '采用温馨活力设计风格，橙黄色或暖色调背景，圆润的设计元素，亲和力强，充满活力和正能量',
  },
  {
    id: 'elegant',
    name: '典雅中国风',
    description: '中国风元素，适合传统文化培训',
    template: '采用典雅中国风设计风格，融入水墨、祥云等传统元素，红金配色，传统与现代结合，文化气息浓厚',
  },
];

export default function PosterGenerator() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [trainings, setTrainings] = useState<TrainingSession[]>([]);
  const [experts, setExpertMap] = useState<Map<number, Expert>>(new Map());
  const [selectedTraining, setSelectedTraining] = useState<TrainingSession | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(POSTER_STYLES[0]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // 内容选择选项
  const [includeTitle, setIncludeTitle] = useState(true);
  const [includeInstructor, setIncludeInstructor] = useState(true);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [includeCourseContent, setIncludeCourseContent] = useState(true);
  const [includeAvatar, setIncludeAvatar] = useState(false);

  // 可编辑的提示词
  const [editablePrompt, setEditablePrompt] = useState('');

  // 讲师头像图片
  const [avatarImage, setAvatarImage] = useState<string | null>(null);

  // 图片配置选项
  const [aspectRatio, setAspectRatio] = useState<string>('9:16'); // 默认竖版手机
  const [resolution, setResolution] = useState<string>('1080x1920'); // 默认高清
  const [includeWatermark, setIncludeWatermark] = useState(false);

  // 加载培训数据
  useEffect(() => {
    loadTrainings();
  }, []);

  const loadTrainings = async () => {
    try {
      setLoadingData(true);

      // 加载培训列表（只加载未来的培训）
      const { data: trainingsData, error: trainingsError } = await supabase
        .from('training_sessions')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(20);

      if (trainingsError) throw trainingsError;

      // 加载所有专家信息
      const { data: expertsData, error: expertsError } = await supabase
        .from('experts')
        .select('*');

      if (expertsError) throw expertsError;

      // 创建专家 Map
      const expertMap = new Map<number, Expert>();
      expertsData?.forEach((expert: Expert) => {
        expertMap.set(expert.id, expert);
      });

      setTrainings(trainingsData || []);
      setExpertMap(expertMap);

      // 默认选择第一个培训
      if (trainingsData && trainingsData.length > 0) {
        setSelectedTraining(trainingsData[0]);
      }
    } catch (error) {
      console.error('加载培训数据失败:', error);
      toast.error('加载培训数据失败');
    } finally {
      setLoadingData(false);
    }
  };

  // 生成完整的提示词
  const generateFullPrompt = () => {
    if (!selectedTraining) return '';

    const expert = selectedTraining.expert_id
      ? experts.get(selectedTraining.expert_id)
      : null;

    const location = selectedTraining.detailed_address || selectedTraining.area || '待定';

    // 构建海报内容信息
    let contentParts: string[] = [];

    // 课程名称（大标题）
    if (includeTitle) {
      contentParts.push(`大标题文字："${selectedTraining.name}"`);
    }

    // 讲师信息（副标题）
    if (includeInstructor && expert) {
      let instructorText = `副标题文字："讲师：${expert.name}`;
      if (expert.title) {
        instructorText += ` ${expert.title}`;
      }
      instructorText += `"`;
      contentParts.push(instructorText);
    }

    // 地点信息
    if (includeLocation) {
      contentParts.push(`地点信息："${location}"`);
    }

    // 课程内容（详细信息）
    if (includeCourseContent && selectedTraining.course_description) {
      // 保留完整的课程内容，不截断
      contentParts.push(`课程内容："${selectedTraining.course_description}"`);
    }

    // 构建完整提示词
    let prompt = `请设计一张培训课程宣传海报，竖版手机屏幕比例。`;

    if (contentParts.length > 0) {
      prompt += `海报需要包含以下文字内容：${contentParts.join('，')}。`;
    }

    // 人物头像要求
    if (includeAvatar && expert) {
      prompt += `需要包含讲师头像照片。`;
    }

    prompt += `设计要求：${selectedStyle.template}，文字清晰易读，信息层次分明，整体布局美观专业。`;

    return prompt;
  };

  // 当培训或选项改变时，更新可编辑提示词
  useEffect(() => {
    if (selectedTraining) {
      setEditablePrompt(generateFullPrompt());
    }
  }, [selectedTraining, selectedStyle, includeTitle, includeInstructor, includeLocation, includeCourseContent, includeAvatar]);

  const handleGenerate = async () => {
    if (!selectedTraining) {
      toast.error('请选择培训课程');
      return;
    }

    if (!editablePrompt.trim()) {
      toast.error('提示词不能为空');
      return;
    }

    if (includeAvatar && !avatarImage) {
      toast.error('请上传讲师头像图片');
      return;
    }

    setLoading(true);
    setImageUrl(null);

    try {
      // 根据用户选择的比例和分辨率计算实际尺寸
      const selectedRatio = ASPECT_RATIOS.find(r => r.id === aspectRatio) || ASPECT_RATIOS[0];
      const selectedRes = RESOLUTIONS.find(r => r.id === resolution) || RESOLUTIONS[1];
      
      let width = Math.round(selectedRatio.width * selectedRes.multiplier);
      let height = Math.round(selectedRatio.height * selectedRes.multiplier);
      
      // 确保尺寸在 512-2048 范围内
      const maxSize = 2048;
      const minSize = 512;
      
      if (width > maxSize || height > maxSize) {
        const scale = maxSize / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        toast.warning(`尺寸已自动调整到 ${width}x${height} 以符合限制`);
      }
      
      if (width < minSize || height < minSize) {
        const scale = minSize / Math.min(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        toast.warning(`尺寸已自动调整到 ${width}x${height} 以符合限制`);
      }
      
      const ratioName = selectedRatio.name;
      const resName = selectedRes.name;
      
      toast.info(`正在生成${ratioName} ${resName}海报 (${width}x${height})，预计需要 10-30 秒...`);

      const result = await generatePoster({
        prompt: editablePrompt,
        width,
        height,
        imageUrl: includeAvatar && avatarImage ? avatarImage : undefined,
        watermark: includeWatermark,
      });

      if (result.data && result.data[0]?.url) {
        setImageUrl(result.data[0].url);
        toast.success('海报生成成功！');
      } else {
        toast.error('生成失败：未返回图片');
      }
    } catch (error) {
      console.error('生成海报失败:', error);
      toast.error(error instanceof Error ? error.message : '生成失败');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentPath={location.pathname}
        />

        {/* 移动端遮罩层 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-transparent lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部栏 */}
          <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 lg:hidden"
                >
                  <i className="fas fa-bars text-xl"></i>
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">AI 海报生成器</h1>
              </div>
            </div>
          </header>

          {/* 主内容区 */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">加载培训数据中...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentPath={location.pathname}
      />

      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-transparent lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 lg:hidden"
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">AI 海报生成器</h1>
            </div>
          </div>
        </header>

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左侧：配置区 */}
              <div className="space-y-6">
                {/* 选择培训课程 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <label className="block text-sm font-medium mb-3 text-gray-800 dark:text-white">
                    1️⃣ 选择培训课程
                  </label>
                  {trainings.length === 0 ? (
                    <p className="text-gray-500 text-sm">暂无即将开始的培训课程</p>
                  ) : (
                    <select
                      value={selectedTraining?.id || ''}
                      onChange={(e) => {
                        const training = trainings.find(t => t.id === Number(e.target.value));
                        setSelectedTraining(training || null);
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {trainings.map(training => {
                        const expert = training.expert_id ? experts.get(training.expert_id) : null;
                        return (
                          <option key={training.id} value={training.id}>
                            {training.name} - {new Date(training.date).toLocaleDateString('zh-CN')}
                            {expert ? ` - ${expert.name}` : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}

                  {/* 显示选中培训的详细信息 */}
                  {selectedTraining && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm space-y-2">
                      <div><span className="font-medium">课程名称：</span>{selectedTraining.name}</div>
                      <div>
                        <span className="font-medium">地点：</span>
                        {selectedTraining.detailed_address || selectedTraining.area || '待定'}
                      </div>
                      {selectedTraining.expert_id && experts.get(selectedTraining.expert_id) && (
                        <div>
                          <span className="font-medium">讲师：</span>
                          {experts.get(selectedTraining.expert_id)!.name}
                          {experts.get(selectedTraining.expert_id)!.title &&
                            ` (${experts.get(selectedTraining.expert_id)!.title})`
                          }
                        </div>
                      )}
                      {selectedTraining.course_description && (
                        <div>
                          <span className="font-medium">课程内容：</span>
                          {selectedTraining.course_description}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 选择风格 */}
                <div className="bg-white rounded-lg shadow p-4">
                  <label className="block text-sm font-medium mb-3">
                    2️⃣ 选择海报风格
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {POSTER_STYLES.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${selectedStyle.id === style.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="font-medium text-sm mb-1">{style.name}</div>
                        <div className="text-xs text-gray-600">{style.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 图片配置 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <label className="block text-sm font-medium mb-3 text-gray-800 dark:text-white">
                    ⚙️ 图片配置
                  </label>
                  
                  {/* 图片比例 */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
                      图片比例
                    </label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                    >
                      {ASPECT_RATIOS.map(ratio => (
                        <option key={ratio.id} value={ratio.id}>
                          {ratio.name} - {ratio.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 分辨率 */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
                      分辨率
                    </label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                    >
                      {RESOLUTIONS.map(res => (
                        <option key={res.id} value={res.id}>
                          {res.name} - {res.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 水印选项 */}
                  <div className="mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeWatermark}
                        onChange={(e) => setIncludeWatermark(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">添加水印</span>
                    </label>
                  </div>

                  {/* 预计尺寸显示 */}
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">预计尺寸：</span>
                    {(() => {
                      const selectedRatio = ASPECT_RATIOS.find(r => r.id === aspectRatio) || ASPECT_RATIOS[0];
                      const selectedRes = RESOLUTIONS.find(r => r.id === resolution) || RESOLUTIONS[1];
                      const width = Math.round(selectedRatio.width * selectedRes.multiplier);
                      const height = Math.round(selectedRatio.height * selectedRes.multiplier);
                      return ` ${width} x ${height} 像素`;
                    })()}
                  </div>
                </div>

                {/* 上传讲师头像 */}
                {includeAvatar && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <label className="block text-sm font-medium mb-3">
                      📸 上传讲师头像（高清）
                    </label>
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // 检查文件大小（限制 5MB）
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('图片大小不能超过 5MB');
                              return;
                            }

                            // 转换为 Base64
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const base64 = event.target?.result as string;
                              setAvatarImage(base64);
                              toast.success('头像上传成功');
                            };
                            reader.onerror = () => {
                              toast.error('图片读取失败');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {avatarImage && (
                        <div className="relative">
                          <img
                            src={avatarImage}
                            alt="讲师头像预览"
                            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            onClick={() => {
                              setAvatarImage(null);
                              toast.info('已移除头像');
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        💡 上传讲师的高清照片，AI 会将其融入海报设计中
                      </p>
                    </div>
                  </div>
                )}

                {/* 选择内容 */}
                <div className="bg-white rounded-lg shadow p-4">
                  <label className="block text-sm font-medium mb-3">
                    3️⃣ 选择海报内容
                  </label>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeTitle}
                        onChange={(e) => setIncludeTitle(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">课程名称</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeInstructor}
                        onChange={(e) => setIncludeInstructor(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">讲师信息</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeLocation}
                        onChange={(e) => setIncludeLocation(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">培训地点</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeCourseContent}
                        onChange={(e) => setIncludeCourseContent(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">课程内容</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer col-span-2">
                      <input
                        type="checkbox"
                        checked={includeAvatar}
                        onChange={(e) => {
                          setIncludeAvatar(e.target.checked);
                          if (!e.target.checked) {
                            setAvatarImage(null);
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">讲师头像（支持上传图片）</span>
                    </label>
                  </div>
                </div>

                {/* 编辑提示词 */}
                <div className="bg-white rounded-lg shadow p-4">
                  <label className="block text-sm font-medium mb-3">
                    4️⃣ 编辑提示词
                  </label>
                  <textarea
                    value={editablePrompt}
                    onChange={(e) => setEditablePrompt(e.target.value)}
                    placeholder="提示词将自动生成，你可以手动调整..."
                    className="w-full h-48 px-3 py-2 border rounded-lg resize-none text-sm font-mono"
                  />
                </div>

                {/* 生成按钮 */}
                <button
                  onClick={handleGenerate}
                  disabled={loading || !selectedTraining}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? '🎨 生成中...' : '✨ 生成海报'}
                </button>

              </div>

              {/* 右侧：预览区 */}
              <div className="space-y-6">
                {/* 生成结果 */}
                {imageUrl ? (
                  <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-lg font-semibold mb-3">🎉 生成结果</h2>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <img
                        src={imageUrl}
                        alt="生成的海报"
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                      <div className="mt-4 flex gap-2">
                        <a
                          href={imageUrl}
                          download={`${selectedTraining?.name || 'poster'}.png`}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-center transition-colors"
                        >
                          📥 下载海报
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(imageUrl);
                            toast.success('图片链接已复制');
                          }}
                          className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                          🔗 复制链接
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-lg font-semibold mb-3">预览区</h2>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                      <div className="text-gray-400 text-6xl mb-4">🖼️</div>
                      <p className="text-gray-500">生成的海报将显示在这里</p>
                      <p className="text-sm text-gray-400 mt-2">
                        选择培训课程和风格后，点击生成按钮
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
