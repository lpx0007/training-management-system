import { useState, useContext } from 'react';
import { ChevronDown, ChevronUp, Calendar, Users, Plus, Edit, Trash2, User } from 'lucide-react';
import { AuthContext } from '@/contexts/authContext';
import type { CourseWithSessions } from '@/lib/supabase/types';

interface CourseCardProps {
  course: CourseWithSessions;
  onAddSession: (courseId: number) => void;
  onEdit: (courseId: number) => void;
  onDelete?: (courseId: number) => void;
}

export function CourseCard({ course, onAddSession, onEdit, onDelete }: CourseCardProps) {
  const { user } = useContext(AuthContext);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md">
      {/* 课程头部 */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                {course.module}
              </span>
              {course.code && (
                <span className="text-xs text-gray-500">
                  #{course.code}
                </span>
              )}
              <span className="text-xs text-gray-500">
                {course.actualSessionCount}/{course.sessionsPerYear}期
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {course.name}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {course.durationDays}天/期
              </span>
              {course.projectManagerName && (
                <span className="flex items-center gap-1">
                  <User size={14} />
                  {course.projectManagerName}
                </span>
              )}
            </div>
            {course.description && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {course.description}
              </p>
            )}
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddSession(course.id)}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="添加场次"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => onEdit(course.id)}
              className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="编辑课程"
            >
              <Edit size={18} />
            </button>
            {user?.role === 'admin' && onDelete && (
              <button
                onClick={() => onDelete(course.id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="删除课程"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={expanded ? '收起' : '展开'}
            >
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {/* 统计信息 - 紧凑显示 */}
        <div className="mt-3 flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">已有期数:</span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {course.actualSessionCount}/{course.sessionsPerYear}期
            </span>
          </div>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">负责人:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {course.projectManagerName || (
                <span className="text-gray-400 dark:text-gray-500">待分配</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 展开的场次列表 */}
      {expanded && course.sessions && course.sessions.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">培训场次</h4>
          <div className="space-y-2">
            {course.sessions.map((session, index) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    第{session.sessionNumber || index + 1}期
                  </span>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{session.date}</span>
                    {session.endDate && session.endDate !== session.date && (
                      <span className="text-gray-500">至 {session.endDate}</span>
                    )}
                  </div>
                  {session.area && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">{session.area}</span>
                  )}
                  {session.expert && (
                    <span className="text-sm text-gray-500">{session.expert}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Users size={14} />
                    {session.participants}人
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    session.status === 'completed' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                    session.status === 'ongoing' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  }`}>
                    {session.status === 'completed' ? '已完成' :
                     session.status === 'ongoing' ? '进行中' : '计划中'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 展开但没有场次 */}
      {expanded && (!course.sessions || course.sessions.length === 0) && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            暂无培训场次，
            <button
              onClick={() => onAddSession(course.id)}
              className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
            >
              立即添加
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
