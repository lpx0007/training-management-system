import React, { useState, useEffect } from 'react';
import { X, Save, Users, UserCog, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface UserRoleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
    department?: string;
    department_id?: number;
  };
  onSave: () => void;
}

export default function UserRoleEditModal({ isOpen, onClose, user, onSave }: UserRoleEditModalProps) {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(user.department_id || null);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string; manager_id: string | null }>>([]);
  const [managers, setManagers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedManager, setSelectedManager] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  // 加载部门列表
  useEffect(() => {
    const loadDepartments = async () => {
      const { data } = await supabase
        .from('departments')
        .select('id, name, manager_id')
        .eq('status', 'active');
      setDepartments(data || []);
    };
    loadDepartments();
  }, []);

  // 加载经理列表
  useEffect(() => {
    const loadManagers = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, name')
        .eq('role', 'manager');
      setManagers(data || []);
    };
    loadManagers();
  }, []);

  // 当选择经理角色时，加载团队成员
  useEffect(() => {
    if (selectedRole === 'manager' && user.id) {
      loadTeamMembers(user.id);
    }
  }, [selectedRole, user.id]);

  const loadTeamMembers = async (managerId: string) => {
    // 获取已分配的团队成员
    const { data: existingMembers } = await supabase
      .from('team_members')
      .select('member_id')
      .eq('manager_id', managerId)
      .eq('status', 'active');
    
    const memberIds = existingMembers?.map(m => m.member_id) || [];
    setTeamMembers(memberIds);

    // 获取可分配的业务员
    const { data: salespersons } = await supabase
      .from('user_profiles')
      .select('id, name')
      .eq('role', 'salesperson');
    
    setAvailableMembers(salespersons || []);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. 更新用户角色
      const { error: roleError } = await supabase
        .from('user_profiles')
        .update({ 
          role: selectedRole,
          department_id: selectedDepartment 
        })
        .eq('id', user.id);

      if (roleError) throw roleError;

      // 2. 如果是提升为经理，配置团队关系
      if (selectedRole === 'manager') {
        // 删除旧的团队关系
        await supabase
          .from('team_members')
          .delete()
          .eq('manager_id', user.id);

        // 如果分配了部门，更新部门的经理
        if (selectedDepartment) {
          await supabase
            .from('departments')
            .update({ manager_id: user.id })
            .eq('id', selectedDepartment);

          // 自动分配该部门的所有业务员给新经理
          const { data: deptMembers } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('department_id', selectedDepartment)
            .eq('role', 'salesperson');

          if (deptMembers && deptMembers.length > 0) {
            const teamRelations = deptMembers.map(member => ({
              manager_id: user.id,
              member_id: member.id,
              department_id: selectedDepartment,
              status: 'active'
            }));

            await supabase
              .from('team_members')
              .insert(teamRelations);
          }
        }

        // 如果手动选择了团队成员
        if (teamMembers.length > 0) {
          const teamRelations = teamMembers.map(memberId => ({
            manager_id: user.id,
            member_id: memberId,
            department_id: selectedDepartment,
            status: 'active'
          }));

          await supabase
            .from('team_members')
            .upsert(teamRelations, { onConflict: 'manager_id,member_id' });
        }
      }

      // 3. 如果从经理降级，清理相关数据
      if (user.role === 'manager' && selectedRole !== 'manager') {
        // 删除团队关系
        await supabase
          .from('team_members')
          .delete()
          .eq('manager_id', user.id);

        // 清除部门的经理
        await supabase
          .from('departments')
          .update({ manager_id: null })
          .eq('manager_id', user.id);
      }

      toast.success('用户角色已更新');
      onSave();
      onClose();
    } catch (error: any) {
      toast.error('更新失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                编辑用户角色
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {user.name} • {user.username}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 角色选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              用户角色
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="salesperson">业务员</option>
              <option value="manager">部门经理</option>
              <option value="expert">专家</option>
              <option value="admin">管理员</option>
            </select>
          </div>

          {/* 部门选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              所属部门
            </label>
            <select
              value={selectedDepartment || ''}
              onChange={(e) => setSelectedDepartment(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">无</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} {dept.manager_id === user.id && '(当前管理)'}
                </option>
              ))}
            </select>
          </div>

          {/* 部门经理特殊配置 */}
          {selectedRole === 'manager' && (
            <div className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <div className="flex items-start mb-3">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-400 mr-2 mt-1" size={18} />
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white mb-1">
                    部门经理配置
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    提升为部门经理后，将自动获得查看和管理本部门业务员及其客户的权限。
                  </p>
                </div>
              </div>

              {/* 自动分配说明 */}
              {selectedDepartment && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>自动配置：</strong>选择部门后，该部门的所有业务员将自动分配给此经理。
                    RLS策略将立即生效，经理可以查看和管理本部门所有客户数据。
                  </p>
                </div>
              )}

              {/* 团队成员选择（可选） */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  团队成员（可选）
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
                  {availableMembers.map(member => (
                    <label key={member.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={teamMembers.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTeamMembers([...teamMembers, member.id]);
                          } else {
                            setTeamMembers(teamMembers.filter(id => id !== member.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {member.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 警告信息 */}
          {user.role === 'manager' && selectedRole !== 'manager' && (
            <div className="mt-4 p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="text-red-600 dark:text-red-400 mr-2 mt-1" size={18} />
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
                    降级警告
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    将此用户从部门经理降级将：
                  </p>
                  <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 mt-1">
                    <li>移除其管理本部门的权限</li>
                    <li>解除与团队成员的关联</li>
                    <li>失去查看本部门客户的权限</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
