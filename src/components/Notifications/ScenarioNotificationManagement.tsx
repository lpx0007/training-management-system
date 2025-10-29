import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, Megaphone, Send, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { notificationService } from '../../lib/services/notificationService';
import { supabase } from '../../lib/supabase/client';

interface Training {
  id: number;
  name: string;
  date: string;
  salesperson_id?: string;
  salesperson_name?: string;
}

interface ScenarioCardProps {
  scenario: {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
    color: string;
  };
  onSend: (params: any) => Promise<void>;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onSend }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; role: string }>>([]);
  
  // 场景特定的参数
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [maintenanceStart, setMaintenanceStart] = useState('');
  const [maintenanceEnd, setMaintenanceEnd] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [targetUserCount, setTargetUserCount] = useState(0);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载培训列表
        const { data: trainingData } = await supabase
          .from('training_sessions')
          .select('id, name, date, salesperson_id, salesperson_name')
          .order('date', { ascending: false })
          .limit(20);
        
        if (trainingData) setTrainings(trainingData);

        // 加载用户列表
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('id, name, role')
          .order('name');
        
        if (userData) setUsers(userData);
      } catch (error) {
        console.error('加载数据失败:', error);
      }
    };

    if (isExpanded) {
      loadData();
    }
  }, [isExpanded]);

  // 计算目标用户数量
  useEffect(() => {
    const calculateTargetUsers = async () => {
      let count = 0;

      if (scenario.id === 'training_reminder' && selectedTraining) {
        // 获取该培训的参与业务员
        const { data } = await supabase
          .from('training_participants')
          .select('salesperson_name')
          .eq('training_session_id', selectedTraining.id);
        
        if (data) {
          const uniqueSalespersons = [...new Set(data.map((d: any) => d.salesperson_name))];
          count = uniqueSalespersons.length;
        }
      } else if (scenario.id === 'registration_deadline') {
        // 所有业务员
        count = users.filter(u => u.role === 'salesperson').length;
      } else if (scenario.id === 'system_maintenance') {
        // 所有用户
        count = users.length;
      } else if (scenario.id === 'important_notice') {
        // 按角色统计
        count = users.filter(u => selectedRoles.includes(u.role)).length;
      }

      setTargetUserCount(count);
    };

    calculateTargetUsers();
  }, [scenario.id, selectedTraining, selectedRoles, users]);

  const handleSend = async () => {
    setLoading(true);
    try {
      let params: any = {};

      if (scenario.id === 'training_reminder') {
        params = { training: selectedTraining };
      } else if (scenario.id === 'registration_deadline') {
        params = { training: selectedTraining };
      } else if (scenario.id === 'system_maintenance') {
        params = { startTime: maintenanceStart, endTime: maintenanceEnd };
      } else if (scenario.id === 'important_notice') {
        params = { roles: selectedRoles, customTitle, customContent };
      }

      await onSend(params);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsExpanded(false);
      }, 2000);
    } catch (error) {
      console.error('发送失败:', error);
      alert('发送失败');
    } finally {
      setLoading(false);
    }
  };

  const canSend = () => {
    if (scenario.id === 'training_reminder' || scenario.id === 'registration_deadline') {
      return selectedTraining !== null;
    } else if (scenario.id === 'system_maintenance') {
      return maintenanceStart && maintenanceEnd;
    } else if (scenario.id === 'important_notice') {
      return selectedRoles.length > 0 && customTitle && customContent;
    }
    return false;
  };

  return (
    <div className={`border-2 rounded-lg overflow-hidden transition-all ${
      isExpanded ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* 卡片头部 */}
      <div
        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${scenario.color}`}
        onClick={() => !loading && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="text-2xl flex-shrink-0">{scenario.icon}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {scenario.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {scenario.description}
              </p>
              {success && (
                <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Check size={16} />
                  <span className="text-sm">已发送给 {targetUserCount} 人</span>
                </div>
              )}
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* 展开的配置区域 */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {/* 课程提醒 */}
          {scenario.id === 'training_reminder' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  选择培训 *
                </label>
                <select
                  value={selectedTraining?.id || ''}
                  onChange={(e) => {
                    const training = trainings.find(t => t.id === Number(e.target.value));
                    setSelectedTraining(training || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">请选择培训</option>
                  {trainings.map(training => (
                    <option key={training.id} value={training.id}>
                      {training.name} - {training.date}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 报名截止 */}
          {scenario.id === 'registration_deadline' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  选择培训 *
                </label>
                <select
                  value={selectedTraining?.id || ''}
                  onChange={(e) => {
                    const training = trainings.find(t => t.id === Number(e.target.value));
                    setSelectedTraining(training || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">请选择培训</option>
                  {trainings.map(training => (
                    <option key={training.id} value={training.id}>
                      {training.name} - {training.date}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 系统维护 */}
          {scenario.id === 'system_maintenance' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  维护开始时间 *
                </label>
                <input
                  type="datetime-local"
                  value={maintenanceStart}
                  onChange={(e) => setMaintenanceStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  维护结束时间 *
                </label>
                <input
                  type="datetime-local"
                  value={maintenanceEnd}
                  onChange={(e) => setMaintenanceEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* 重要通知 */}
          {scenario.id === 'important_notice' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  选择角色 *
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'admin', label: '管理员' },
                    { value: 'salesperson', label: '业务员' },
                    { value: 'expert', label: '专家' }
                  ].map(role => (
                    <label key={role.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRoles([...selectedRoles, role.value]);
                          } else {
                            setSelectedRoles(selectedRoles.filter(r => r !== role.value));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {role.label} ({users.filter(u => u.role === role.value).length} 人)
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  通知标题 *
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="输入通知标题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  通知内容 *
                </label>
                <textarea
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="输入通知内容"
                />
              </div>
            </div>
          )}

          {/* 内容预览 */}
          {canSend() && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📝 通知内容预览
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">标题：</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {scenario.id === 'training_reminder' && selectedTraining && 
                      `${selectedTraining.name}即将开始`}
                    {scenario.id === 'registration_deadline' && selectedTraining && 
                      `${selectedTraining.name}报名即将截止`}
                    {scenario.id === 'system_maintenance' && maintenanceStart && 
                      '系统维护通知'}
                    {scenario.id === 'important_notice' && customTitle}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">内容：</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {scenario.id === 'training_reminder' && selectedTraining && 
                      `${selectedTraining.name}将于${selectedTraining.date}开始，请提醒您的客户准备好相关资料（身份证、学习资料等）。`}
                    {scenario.id === 'registration_deadline' && selectedTraining && 
                      `${selectedTraining.name}报名即将截止，请抓紧时间联系您的客户完成报名。`}
                    {scenario.id === 'system_maintenance' && maintenanceStart && maintenanceEnd &&
                      `系统将于${new Date(maintenanceStart).toLocaleString('zh-CN')}至${new Date(maintenanceEnd).toLocaleString('zh-CN')}进行维护升级，期间无法访问，请提前做好工作安排。`}
                    {scenario.id === 'important_notice' && customContent}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 预览和发送 */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-900 dark:text-blue-300">
                <strong>将通知：</strong>{targetUserCount} 位用户
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={loading}
              >
                取消
              </button>
              <button
                onClick={handleSend}
                disabled={!canSend() || loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
                {loading ? '发送中...' : '立即发送'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ScenarioNotificationManagement: React.FC = () => {
  const scenarios = [
    {
      id: 'training_reminder',
      name: '课程提醒',
      icon: <Calendar />,
      description: '课程即将开始，提醒业务员通知客户准备资料',
      color: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      id: 'registration_deadline',
      name: '报名截止',
      icon: <Clock />,
      description: '报名即将截止，提醒所有业务员抓紧时间',
      color: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      id: 'system_maintenance',
      name: '系统维护',
      icon: <AlertCircle />,
      description: '系统维护前通知所有用户做好准备',
      color: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      id: 'important_notice',
      name: '重要通知',
      icon: <Megaphone />,
      description: '发布重要通知给指定角色的用户',
      color: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  const handleSendNotification = async (scenarioId: string, params: any) => {
    let title = '';
    let content = '';
    let targetUserIds: string[] = [];

    // 根据场景生成通知内容和目标用户
    if (scenarioId === 'training_reminder') {
      const training = params.training;
      title = `${training.name}即将开始`;
      content = `${training.name}将于${training.date}开始，请提醒您的客户准备好相关资料（身份证、学习资料等）。`;
      
      // 获取培训参与业务员
      const { data } = await supabase
        .from('training_participants')
        .select('salesperson_name')
        .eq('training_session_id', training.id);
      
      if (data) {
        const uniqueSalespersons = [...new Set(data.map((d: any) => d.salesperson_name))];
        const { data: users } = await supabase
          .from('user_profiles')
          .select('id')
          .in('name', uniqueSalespersons);
        
        if (users) targetUserIds = users.map((u: any) => u.id);
      }
    } else if (scenarioId === 'registration_deadline') {
      const training = params.training;
      title = `${training.name}报名即将截止`;
      content = `${training.name}报名即将截止，请抓紧时间联系您的客户完成报名。`;
      
      // 所有业务员
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'salesperson');
      
      if (users) targetUserIds = users.map((u: any) => u.id);
    } else if (scenarioId === 'system_maintenance') {
      title = '系统维护通知';
      content = `系统将于${params.startTime}至${params.endTime}进行维护升级，期间无法访问，请提前做好工作安排。`;
      
      // 所有用户
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id');
      
      if (users) targetUserIds = users.map((u: any) => u.id);
    } else if (scenarioId === 'important_notice') {
      title = params.customTitle;
      content = params.customContent;
      
      // 按角色获取用户
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id')
        .in('role', params.roles);
      
      if (users) targetUserIds = users.map((u: any) => u.id);
    }

    // 批量创建通知
    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      type: 'system_alert' as const,
      title,
      content,
      link: scenarioId === 'training_reminder' ? '/training-performance' : '/announcements',
    }));

    await notificationService.createBatchNotifications(notifications);

    // 记录发送历史
    await notificationService.recordNotificationHistory({
      scenario_type: scenarioId,
      title,
      content,
      target_count: targetUserIds.length,
      target_roles: scenarioId === 'important_notice' ? params.roles : undefined,
      related_training_id: (scenarioId === 'training_reminder' || scenarioId === 'registration_deadline') ? params.training?.id : undefined,
      related_training_name: (scenarioId === 'training_reminder' || scenarioId === 'registration_deadline') ? params.training?.name : undefined,
    });
  };

  return (
    <div>
      {/* 说明 */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          快捷通知场景
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400">
          选择常用场景，快速配置并发送通知。点击场景卡片展开配置，填写必要信息后即可发送。
        </p>
      </div>

      {/* 场景卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map(scenario => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onSend={(params) => handleSendNotification(scenario.id, params)}
          />
        ))}
      </div>

      {/* 提示信息 */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          💡 提示：以上场景覆盖了大部分常用通知需求，选择对应场景即可快速发送
        </p>
      </div>
    </div>
  );
};

export default ScenarioNotificationManagement;
