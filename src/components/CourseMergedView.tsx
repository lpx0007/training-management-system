import { useState, useContext } from 'react';
import { ChevronDown, ChevronRight, Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { AuthContext } from '@/contexts/authContext';
import type { CourseWithSessions } from '@/lib/supabase/types';

interface CourseMergedViewProps {
  courses: CourseWithSessions[];
  onAddSession: (courseId: number) => void;
  onEdit: (courseId: number) => void;
  onDelete?: (courseId: number) => void;
}

interface ModuleGroup {
  module: string;
  courses: CourseWithSessions[];
  totalSessions: number;
  totalDays: number;
}

export function CourseMergedView({ courses, onAddSession, onEdit, onDelete }: CourseMergedViewProps) {
  const { user } = useContext(AuthContext);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // 按模块分组
  const groupedByModule: ModuleGroup[] = courses.reduce((acc, course) => {
    const existingGroup = acc.find(g => g.module === course.module);
    const courseDays = (course.sessionsPerYear || 0) * (course.durationDays || 0);
    
    if (existingGroup) {
      existingGroup.courses.push(course);
      existingGroup.totalSessions += course.sessionsPerYear || 0;
      existingGroup.totalDays += courseDays;
    } else {
      acc.push({
        module: course.module,
        courses: [course],
        totalSessions: course.sessionsPerYear || 0,
        totalDays: courseDays,
      });
    }
    
    return acc;
  }, [] as ModuleGroup[]);

  // 切换模块展开/收起
  const toggleModule = (module: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  // 全部展开/收起
  const toggleAll = () => {
    if (expandedModules.size === groupedByModule.length) {
      setExpandedModules(new Set());
    } else {
      setExpandedModules(new Set(groupedByModule.map(g => g.module)));
    }
  };

  return (
    <div className="space-y-4">
      {/* 顶部工具栏 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          共 {groupedByModule.length} 个模块，{courses.length} 门课程
        </div>
        <button
          onClick={toggleAll}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          {expandedModules.size === groupedByModule.length ? '全部收起' : '全部展开'}
        </button>
      </div>

      {/* 模块列表 */}
      <div className="space-y-3">
        {groupedByModule.map((group) => {
          const isExpanded = expandedModules.has(group.module);
          
          return (
            <div
              key={group.module}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* 模块头部 */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                onClick={() => toggleModule(group.module)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <button className="text-gray-500 dark:text-gray-400">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {group.module}
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                          {group.courses.length} 门课程
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 模块统计 */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-gray-500 dark:text-gray-400 text-xs">总期数</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{group.totalSessions}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 dark:text-gray-400 text-xs">总天数</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{group.totalDays}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 展开的课程列表 */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {group.courses.map((course) => (
                      <div key={course.id} className="p-4 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-base font-medium text-gray-900 dark:text-white">
                                {course.name}
                              </h4>
                              {course.code && (
                                <span className="text-xs text-gray-500">#{course.code}</span>
                              )}
                              <span className={`px-2 py-0.5 text-xs rounded ${
                                course.status === 'active' 
                                  ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                              }`}>
                                {course.status === 'active' ? '启用' : '停用'}
                              </span>
                            </div>

                            {/* 课程信息 */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {course.durationDays}天/期
                              </span>
                              <span className="font-medium">
                                {course.sessionsPerYear}期
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                总天数: {(course.sessionsPerYear || 0) * (course.durationDays || 0)}
                              </span>
                            </div>

                            {course.description && (
                              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                {course.description}
                              </p>
                            )}
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddSession(course.id);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="添加场次"
                            >
                              <Plus size={20} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(course.id);
                              }}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="编辑课程"
                            >
                              <Edit size={20} />
                            </button>
                            {user?.role === 'admin' && onDelete && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(course.id);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="删除课程"
                              >
                                <Trash2 size={20} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 空状态 */}
      {groupedByModule.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            暂无课程数据
          </p>
        </div>
      )}
    </div>
  );
}
