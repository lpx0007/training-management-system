import React, { useState, useContext } from 'react';
import { Edit, Trash2, Plus, ArrowUpDown, ArrowUp, ArrowDown, CheckSquare, Square } from 'lucide-react';
import { AuthContext } from '@/contexts/authContext';
import type { CourseWithSessions } from '@/lib/supabase/types';

interface CourseTableProps {
  courses: CourseWithSessions[];
  onAddSession: (courseId: number) => void;
  onEdit: (courseId: number) => void;
  onDelete?: (courseId: number) => void;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
  enableBatchSelect?: boolean;
}

type SortField = 'name' | 'module' | 'code' | 'durationDays' | 'sessionsPerYear' | 'standardFee' | 'actualSessionCount';
type SortDirection = 'asc' | 'desc' | null;

export function CourseTable({ 
  courses, 
  onAddSession, 
  onEdit, 
  onDelete,
  selectedIds = [],
  onSelectionChange,
  enableBatchSelect = false
}: CourseTableProps) {
  const { user } = useContext(AuthContext);
  const [sortField, setSortField] = useState<SortField>('module');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // 排序处理
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 切换排序方向：asc -> desc -> null -> asc
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField('module'); // 重置为默认排序
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 排序数据
  const sortedCourses = React.useMemo(() => {
    if (!sortDirection) return courses;

    return [...courses].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // 处理null/undefined
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // 字符串比较
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue, 'zh-CN')
          : bValue.localeCompare(aValue, 'zh-CN');
      }

      // 数字比较
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [courses, sortField, sortDirection]);

  // 全选/取消全选
  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (selectedIds.length === sortedCourses.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(sortedCourses.map(c => c.id));
    }
  };

  // 单个选择
  const handleSelectOne = (courseId: number) => {
    if (!onSelectionChange) return;
    
    if (selectedIds.includes(courseId)) {
      onSelectionChange(selectedIds.filter(id => id !== courseId));
    } else {
      onSelectionChange([...selectedIds, courseId]);
    }
  };

  // 排序图标
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-gray-400" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp size={14} className="text-blue-600" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown size={14} className="text-blue-600" />;
    }
    return <ArrowUpDown size={14} className="text-gray-400" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {enableBatchSelect && (
                <th className="px-6 py-3 text-left" style={{ width: '50px' }}>
                  <button
                    onClick={handleSelectAll}
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {selectedIds.length === sortedCourses.length && sortedCourses.length > 0 ? (
                      <CheckSquare size={18} />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
              )}
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
                onClick={() => handleSort('module')}
                style={{ width: '100px' }}
              >
                <div className="flex items-center gap-1">
                  模块
                  <SortIcon field="module" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('name')}
                style={{ minWidth: '200px' }}
              >
                <div className="flex items-center gap-1">
                  课程名称
                  <SortIcon field="name" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
                onClick={() => handleSort('durationDays')}
                style={{ width: '80px' }}
              >
                <div className="flex items-center justify-center gap-1">
                  天数
                  <SortIcon field="durationDays" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
                onClick={() => handleSort('actualSessionCount')}
                style={{ width: '80px' }}
              >
                <div className="flex items-center justify-center gap-1">
                  期数
                  <SortIcon field="actualSessionCount" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ width: '100px' }}>
                负责人
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
                onClick={() => handleSort('standardFee')}
                style={{ width: '100px' }}
              >
                <div className="flex items-center justify-end gap-1">
                  费用
                  <SortIcon field="standardFee" />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ width: '80px' }}>
                状态
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ width: '120px' }}>
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedCourses.length === 0 ? (
              <tr>
                <td colSpan={enableBatchSelect ? 9 : 8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  暂无课程数据
                </td>
              </tr>
            ) : (
              sortedCourses.map((course) => (
                <tr 
                  key={course.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                    selectedIds.includes(course.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  {enableBatchSelect && (
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSelectOne(course.id)}
                        className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {selectedIds.includes(course.id) ? (
                          <CheckSquare size={18} className="text-blue-600" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                      {course.module}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ minWidth: '200px' }}>
                    <div className="text-sm font-medium text-gray-900 dark:text-white whitespace-normal" title={course.name}>
                      {course.name}
                    </div>
                    {course.description && (
                      <div className="hidden lg:block text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1" title={course.description}>
                        {course.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                    {course.durationDays}天
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {course.actualSessionCount}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      /{course.sessionsPerYear}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {course.projectManagerName || (
                      <span className="text-gray-400 dark:text-gray-500">待分配</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      ¥{course.standardFee?.toLocaleString() || '-'}
                    </div>
                    {course.onlinePrice && course.offlinePrice && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
                        <span className="hidden lg:inline">线上¥{course.onlinePrice.toLocaleString()} / 线下¥{course.offlinePrice.toLocaleString()}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      course.status === 'active' 
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}>
                      {course.status === 'active' ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onAddSession(course.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="添加场次"
                      >
                        <Plus size={20} />
                      </button>
                      <button
                        onClick={() => onEdit(course.id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="编辑课程"
                      >
                        <Edit size={20} />
                      </button>
                      {user?.role === 'admin' && onDelete && (
                        <button
                          onClick={() => onDelete(course.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="删除课程"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
