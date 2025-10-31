/**
 * 数据服务类 - 统一数据管理和API接口实现
 * 模拟完整的数据库操作，确保所有角色看到一致的数据
 */

// 用户接口
export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'salesperson' | 'expert';
  name: string;
  department: string;
  permissions?: string[]; // 用户权限列表
}

// 客户接口
export interface Customer {
  id: number;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  company: string;
  position: string;
  location: string;
  status: string;
  salesperson: string;
  followUpStatus: string;
  createdAt: string;
  lastContact: string;
  trainingHistory: {
    id: number;
    name: string;
    date: string;
    status: string;
  }[];
  tags: string[];
}

// 课程接口
export interface Course {
  id: string;
  name: string;
  description: string;
  duration: number; // 课程时长（小时）
  price: number;
  category: string;
  expertId?: number; // 关联专家ID
  createdAt: string;
  updatedAt: string;
}

// 权限接口
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

// 专家接口
export interface Expert {
  id: number;
  name: string;
  avatar: string;
  title: string;
  field: string;
  experience: string;
  rating: number;
  courses: string[];
  location: string;
  available: boolean;
  bio: string;
  pastSessions: number;
  totalParticipants: number;
  feedback: {
    id: number;
    content: string;
    rating: number;
  }[];
}

// 业务员接口
export interface Salesperson {
  id: number;
  name: string;
  avatar: string;
  department: string;
  position: string;
  phone: string;
  email: string;
  joinDate: string;
  status: string;
  performance: {
    revenue: number;
    completedSessions: number;
    conversionRate: number;
    customers: number;
  };
  team: string;
  permissions?: string[];
}

// 培训场次接口
export interface TrainingSession {
  id: number;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  participants: number;
  expert: string;
  expertId: number;
  area: string;
  detailedAddress?: string | null;
  revenue: number;
  status: string;
  rating: number;
  salespersonId?: number;
  salespersonName?: string;
  participantsList?: {
    id: number;
    name: string;
    phone: string;
    email: string;
    registrationDate: string;
    paymentStatus: string;
    salespersonName?: string; // 报名该客户的业务员
    customerId?: number; // 关联的客户ID
  }[];
  courseId?: string; // 关联的课程ID
}

// 从localStorage加载数据或使用默认数据
const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage`, error);
    return defaultValue;
  }
};

// 保存数据到localStorage
const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage`, error);
  }
};

// 数据服务类
class DataService {
  // 模拟数据存储 - 使用localStorage实现持久化
  private storage: {
    users: Record<string, User>;
    customers: Customer[];
    experts: Expert[];
    salespersons: Salesperson[];
    trainingSessions: TrainingSession[];
    courses: Course[];
    permissions: Permission[];
  };

  constructor() {
    // 初始化存储，从localStorage加载或使用默认数据
    const defaultData = {
      users: {
        'admin': {
          id: '1',
          username: 'admin',
          password: 'admin123',
          role: 'admin',
          name: '系统管理员',
          department: '管理部',
          permissions: ['all_access'] // 管理员拥有所有权限
        },
        'sales1': {
          id: '2',
          username: 'sales1',
          password: 'sales123',
          role: 'salesperson',
          name: '张三',
          department: '销售部',
          permissions: ['customer_view', 'training_view', 'training_add_customer']
        },
        // 临时添加一个测试业务员账号，用于验证权限控制逻辑
        'sales_test': {
          id: '10',
          username: 'sales_test',
          password: 'test123',
          role: 'salesperson',
          name: '测试业务员',
          department: '销售部',
          permissions: ['customer_view', 'training_view', 'training_add_customer']
        },
        'expert1': {
          id: '3',
          username: 'expert1',
          password: 'expert123',
          role: 'expert',
          name: '李四',
          department: '培训部',
          permissions: ['training_view', 'expert_profile_edit']
        }
      },
      customers: [
      {
        id: 1,
        name: '李明',
        avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=young%20asian%20male%20business%20casual&sign=be726229e95cc0f6fb5893bd709b548f',
        phone: '138****1234',
        email: 'liming@example.com',
        company: '科技有限公司',
        position: '技术总监',
        location: '北京',
        status: '已成交',
        salesperson: '张三',
        followUpStatus: '已完成',
        createdAt: '2025-10-01',
        lastContact: '2025-10-20',
        trainingHistory: [
          { id: 1, name: '前端开发进阶班', date: '2025-10-20', status: '已完成' },
          { id: 2, name: '项目管理实战', date: '2025-10-23', status: '即将开始' }
        ],
        tags: ['重要客户', '技术类']
      },
      {
        id: 2,
        name: '张华',
        avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=middle-aged%20asian%20male%20businessman%20professional&sign=5dc198ccf308668f7b588577ad1069f0',
        phone: '139****5678',
        email: 'zhanghua@example.com',
        company: '金融服务公司',
        position: '项目经理',
        location: '上海',
        status: '跟进中',
        salesperson: '李四',
        followUpStatus: '待跟进',
        createdAt: '2025-10-05',
        lastContact: '2025-10-18',
        trainingHistory: [
          { id: 1, name: '项目管理实战', date: '2025-10-23', status: '即将开始' }
        ],
        tags: ['潜在客户', '管理类']
      },
      {
        id: 3,
        name: '王芳',
        avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=young%20asian%20female%20businesswoman%20smiling&sign=0f30a4dd26cdf2b69ccc4066454701db',
        phone: '137****9012',
        email: 'wangfang@example.com',
        company: '互联网公司',
        position: '产品经理',
        location: '广州',
        status: '已成交',
        salesperson: '王五',
        followUpStatus: '已完成',
        createdAt: '2025-09-28',
        lastContact: '2025-10-15',
        trainingHistory: [
          { id: 1, name: 'UI设计原理', date: '2025-09-30', status: '已完成' },
          { id: 2, name: '数据分析与可视化', date: '2025-10-15', status: '已完成' }
        ],
        tags: ['重要客户', '设计类']
      },
      // 为张三添加更多客户
      {
        id: 4,
        name: '刘强',
        avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=middle-aged%20asian%20male%20business%20executive&sign=03350cfeea6bb93511e843c3f27f6117',
        phone: '136****3456',
        email: 'liuqiang@example.com',
        company: '智能制造有限公司',
        position: '运营总监',
        location: '深圳',
        status: '跟进中',
        salesperson: '张三',
        followUpStatus: '进行中',
        createdAt: '2025-10-08',
        lastContact: '2025-10-21',
        trainingHistory: [],
        tags: ['潜在客户', '制造类']
      },
      {
        id: 5,
        name: '陈静',
        avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=young%20asian%20female%20marketing%20professional&sign=63254a54e48594df2aeea580dc254f86',
        phone: '135****7890',
        email: 'chenjing@example.com',
        company: '数字营销公司',
        position: '市场总监',
        location: '北京',
        status: '潜在客户',
        salesperson: '张三',
        followUpStatus: '待跟进',
        createdAt: '2025-10-12',
        lastContact: '2025-10-19',
        trainingHistory: [],
        tags: ['高潜力', '营销类']
      },
      {
        id: 6,
        name: '赵伟',
        avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=middle-aged%20asian%20male%20financial%20manager&sign=436f246831e62b42eacc0ce0391a79e3',
        phone: '134****2345',
        email: 'zhaowei@example.com',
        company: '投资银行',
        position: '财务总监',
        location: '上海',
        status: '已成交',
        salesperson: '张三',
        followUpStatus: '已完成',
        createdAt: '2025-09-20',
        lastContact: '2025-10-15',
        trainingHistory: [
          { id: 1, name: '税务管理', date: '2025-09-28', status: '已完成' }
        ],
        tags: ['重要客户', '金融类']
      },
      {
        id: 7,
        name: '孙丽',
        avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=young%20asian%20female%20hr%20manager%20professional&sign=9750478b5fe6e6fdc19d5f8c7498cf62',
        phone: '132****6789',
        email: 'sunli@example.com',
        company: '人力资源公司',
        position: '人力资源总监',
        location: '广州',
        status: '潜在客户',
        salesperson: '张三',
        followUpStatus: '待跟进',
        createdAt: '2025-10-15',
        lastContact: '2025-10-20',
        trainingHistory: [],
        tags: ['高潜力', 'HR培训']
      },
      {
        id: 8,
        name: '周强',
        avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=middle-aged%20asian%20male%20supply%20chain%20manager&sign=9224342da0849bd4d85deb2faf1e56c9',
        phone: '131****0123',
        email: 'zhouqiang@example.com',
        company: '物流集团',
        position: '供应链总监',
        location: '深圳',
        status: '跟进中',
        salesperson: '张三',
        followUpStatus: '进行中',
        createdAt: '2025-10-05',
        lastContact: '2025-10-22',
        trainingHistory: [],
        tags: ['潜在客户', '供应链']
      },
      {
        id: 9,
        name: '吴敏',
        avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=middle-aged%20asian%20female%20education%20manager&sign=c560b4a13cd278b62ba3a6d32f09bdc9',
        phone: '130****4567',
        email: 'wumin@example.com',
        company: '教育科技公司',
        position: '培训总监',
        location: '北京',
        status: '已成交',
        salesperson: '张三',
        followUpStatus: '已完成',
        createdAt: '2025-09-30',
        lastContact: '2025-10-18',
        trainingHistory: [
          { id: 1, name: '教学方法创新', date: '2025-10-10', status: '已完成' }
        ],
        tags: ['重要客户', '教育培训']
      },
      // 为张三添加额外测试客户
      {
        id: 10,
        name: '郑华',
        avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=young%20asian%20male%20software%20developer%20smiling&sign=ac4ead578103509d6df13e8f9bbd8431',
        phone: '139****4567',
        email: 'zhenghua@example.com',
        company: '软件开发公司',
        position: '技术经理',
        location: '上海',
        status: '跟进中',
        salesperson: '张三',
        followUpStatus: '进行中',
        createdAt: '2025-10-10',
        lastContact: '2025-10-21',
        trainingHistory: [],
        tags: ['技术类', '待跟进']
      },
      {
        id: 11,
        name: '黄丽',
        avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=middle-aged%20asian%20female%20marketing%20director&sign=8e561822ba467a343604bbc04a57cd94',
        phone: '137****8901',
        email: 'huangli@example.com',
        company: '电子商务公司',
        position: '营销总监',
        location: '广州',
        status: '潜在客户',salesperson: '张三',
        followUpStatus: '待跟进',
        createdAt: '2025-10-15',
        lastContact: '2025-10-20',
        trainingHistory: [],
        tags: ['高价值', '营销类']
      },
      {
        id: 12,
        name: '陈明',
        avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=middle-aged%20asian%20male%20executive%20confident&sign=081044af3ab0c82de406d341a3fc5c7a',
        phone: '136****2345',
        email: 'chenming@example.com',
        company: '医疗科技公司',
        position: 'CEO',
        location: '北京',
        status: '已成交',
        salesperson: '张三',
        followUpStatus: '已完成',
        createdAt: '2025-09-25',
        lastContact: '2025-10-22',
        trainingHistory: [
          { id: 1, name: '领导力提升', date: '2025-10-15', status: '已完成' }
        ],
        tags: ['重要客户', '高管培训']
      }
      ],
      experts: [
        {
          id: 1,
          name: '张教授',
          avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=middle-aged%20asian%20male%20professor%20glasses%20formal%20wear&sign=4ef5da0fa5c152bcda7af488ff1cb2cd',
          title: '计算机科学教授',
          field: '技术培训',
          experience: '15年',
          rating: 4.8,
          courses: ['前端开发进阶', 'React高级应用', 'TypeScript实战'],
          location: '北京',
          available: true,
          bio: '北京大学计算机科学博士，拥有15年前端开发和教学经验，曾在多家知名科技公司担任技术总监。',
          pastSessions: 45,
          totalParticipants: 1200,
          feedback: [
            { id: 1, content: '讲解清晰，案例丰富，收获很大', rating: 5 },
            { id: 2, content: '实战经验分享很有价值', rating: 4 }
          ]
        },
        {
          id: 2,
          name: '李博士',
          avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=middle-aged%20asian%20male%20business%20suit%20confident&sign=b80675e50e25828ae30d7e62a11634c0',
          title: '项目管理专家',
          field: '管理培训',
          experience: '12年',
          rating: 4.6,
          courses: ['项目管理实战', '敏捷开发方法', '团队协作技巧'],
          location: '上海',
          available: true,
          bio: '上海交通大学管理学博士，PMP认证讲师，拥有丰富的项目管理实战经验。',
          pastSessions: 38,
          totalParticipants: 950,
          feedback: [
            { id: 1, content: '理论与实践结合，实用性强', rating: 5 },
            { id: 2, content: '案例分析很到位', rating: 5 }
          ]
        },
        {
          id: 3,
          name: '王税务师',
          avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=middle-aged%20asian%20male%20professional%20accountant%20glasses&sign=766fe18cf40ba1105169938f1b9120fe',
          title: '高级税务顾问',
          field: '税务培训',
          experience: '10年',
          rating: 4.9,
          courses: ['税务管理', '税法更新解读', '税务筹划策略'],
          location: '广州',
          available: true,
          bio: '注册税务师，拥有10年税务咨询和培训经验，擅长企业税务筹划和合规管理。',
          pastSessions: 30,
          totalParticipants: 800,
          feedback: [
            { id: 1, content: '讲解深入浅出，实用性强', rating: 5 },
            { id: 2, content: '案例真实，对实际工作很有帮助', rating: 5 }
          ]
        }
      ],
      salespersons: [
        {
          id: 1,
          name: '张三',
          avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=young%20asian%20male%20businessman%20smiling&sign=29984a17d73c8a710865666cfdecf860',
          department: '销售一部',
          position: '高级销售顾问',
          phone: '138****1234',
          email: 'zhangsan@example.com',
          joinDate: '2023-01-15',
          status: 'active',
          performance: {
            revenue: 120000,
            completedSessions: 12,
            conversionRate: 35,
            customers: 45
          },
          team: '北京团队',
          permissions: ['customer_view', 'training_view', 'training_add_customer']
        },
        {
          id: 2,
          name: '李四',
          avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=middle-aged%20asian%20male%20businessman%20confident&sign=074b5676cf23160ba1962f7cc78b3371',
          department: '销售二部',
          position: '销售顾问',
          phone: '139****5678',
          email: 'lisi@example.com',
          joinDate: '2023-03-20',
          status: 'active',
          performance: {
            revenue: 95000,
            completedSessions: 9,
            conversionRate: 30,
            customers: 38
          },
          team: '上海团队',
          permissions: ['customer_view', 'training_view']
        },
        {
          id: 3,
          name: '王五',
          avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=middle-aged%20asian%20male%20businessman%20serious&sign=b4b584687479b6a444a6b19435b6fc8f',
          department: '销售三部',
          position: '销售顾问',
          phone: '137****8901',
          email: 'wangwu@example.com',
          joinDate: '2023-05-10',
          status: 'active',
          performance: {
            revenue: 85000,
            completedSessions: 8,
            conversionRate: 28,
            customers: 35
          },
          team: '广州团队',
          permissions: ['customer_view', 'training_view']
        }
      ],
      trainingSessions: [
        {
          id: 1,
          name: '前端开发进阶班',
          date: '2025-10-20',
          startTime: '09:00',
          endTime: '17:00',
          participants: 45,
          expert: '张教授',
          expertId: 1,
          area: '北京',
          revenue: 45000,
          status: 'completed',
          rating: 4.8,
          salespersonId: 1,
          salespersonName: '张三',
          courseId: 'course001',
          participantsList: [
            { id: 1, name: '李明', phone: '138****1234', email: 'liming@example.com', registrationDate: '2025-10-01', paymentStatus: '已支付', salespersonName: '张三' },
            { id: 2, name: '张华', phone: '139****5678', email: 'zhanghua@example.com', registrationDate: '2025-10-05', paymentStatus: '已支付', salespersonName: '李四' }
          ]
        },
        {
          id: 2,
          name: '项目管理实战',
          date: '2025-10-23',
          startTime: '10:00',
          endTime: '16:00',
          participants: 30,
          expert: '李博士',
          expertId: 2,
          area: '上海',
          revenue: 36000,
          status: 'upcoming',
          rating: 0,
          salespersonId: 2,
          salespersonName: '李四',
          courseId: 'course002',
          participantsList: [
            { id: 1, name: '刘强', phone: '136****3456', email: 'liuqiang@example.com', registrationDate: '2025-10-15', paymentStatus: '已支付', salespersonName: '李四' }
          ]
        },
        {
          id: 3,
          name: '税务管理',
          date: '2025-10-28',
          startTime: '09:30',
          endTime: '17:30',
          participants: 25,
          expert: '王税务师',
          expertId: 3,
          area: '广州',
          revenue: 30000,
          status: 'upcoming',
          rating: 0,
          salespersonId: 3,
          salespersonName: '王五',
          courseId: 'course003',
          participantsList: []
        }
      ],
      courses: [
        {
          id: 'course001',
          name: '前端开发进阶',
          description: '深入学习现代前端开发技术，包括React、TypeScript等',
          duration: 8,
          price: 1000,
          category: '技术培训',
          expertId: 1,
          createdAt: '2025-09-01',
          updatedAt: '2025-09-15'
        },
        {
          id: 'course002',
          name: '项目管理实战',
          description: '掌握项目管理核心技能，提升团队协作效率',
          duration: 6,
          price: 1200,
          category: '管理培训',
          expertId: 2,
          createdAt: '2025-09-05',
          updatedAt: '2025-09-20'
        },
        {
          id: 'course003',
          name: '税务管理',
          description: '企业税务筹划与合规管理最佳实践',
          duration: 6,
          price: 1500,
          category: '财务培训',
          expertId: 3,
          createdAt: '2025-09-10',
          updatedAt: '2025-09-25'
        }
      ],
      permissions: [
        { id: 'customer_view', name: '查看客户', description: '查看客户信息', category: '客户管理' },
        { id: 'customer_edit', name: '编辑客户', description: '编辑客户信息', category: '客户管理' },
        { id: 'customer_add', name: '添加客户', description: '添加新客户', category: '客户管理' },
        { id: 'training_view', name: '查看培训', description: '查看培训计划和详情', category: '培训管理' },
        { id: 'training_edit', name: '编辑培训', description: '编辑培训计划', category: '培训管理' },
        { id: 'training_add', name: '添加培训', description: '添加新培训计划', category: '培训管理' },
        { id: 'training_add_customer', name: '添加培训客户', description: '向培训中添加客户', category: '培训管理' },
        { id: 'expert_view', name: '查看专家', description: '查看专家信息', category: '专家管理' },
        { id: 'expert_edit', name: '编辑专家', description: '编辑专家信息', category: '专家管理' },
        { id: 'expert_add', name: '添加专家', description: '添加新专家', category: '专家管理' },
        { id: 'salesperson_view', name: '查看业务员', description: '查看业务员信息', category: '人员管理' },
        { id: 'salesperson_edit', name: '编辑业务员', description: '编辑业务员信息', category: '人员管理' },
        { id: 'salesperson_add', name: '添加业务员', description: '添加新业务员', category: '人员管理' },
        { id: 'permission_manage', name: '管理权限', description: '管理用户权限', category: '系统管理' },
        { id: 'course_manage', name: '管理课程', description: '管理培训课程', category: '系统管理' },
        { id: 'data_export', name: '数据导出', description: '导出系统数据', category: '系统管理' },
        { id: 'expert_profile_edit', name: '编辑专家资料', description: '编辑自己的专家资料', category: '个人管理' }
      ]
    };

    // 从localStorage加载数据，如不存在则使用默认数据
    this.storage = {
      users: loadFromLocalStorage('users', defaultData.users),
      customers: loadFromLocalStorage('customers', defaultData.customers),
      experts: loadFromLocalStorage('experts', defaultData.experts),
      salespersons: loadFromLocalStorage('salespersons', defaultData.salespersons),
      trainingSessions: loadFromLocalStorage('trainingSessions', defaultData.trainingSessions),
      courses: loadFromLocalStorage('courses', defaultData.courses),
      permissions: loadFromLocalStorage('permissions', defaultData.permissions)
    };
  }

  // 私有方法：保存当前状态到localStorage
  private saveState(): void {
    saveToLocalStorage('users', this.storage.users);
    saveToLocalStorage('customers', this.storage.customers);
    saveToLocalStorage('experts', this.storage.experts);
    saveToLocalStorage('salespersons', this.storage.salespersons);
    saveToLocalStorage('trainingSessions', this.storage.trainingSessions);
    saveToLocalStorage('courses', this.storage.courses);
    saveToLocalStorage('permissions', this.storage.permissions);
  }

  // 用户相关方法
  authenticate(username: string, password: string): User | null {
    const user = this.storage.users[username];
    if (user && user.password === password) {
      // 返回不包含密码的用户信息
      return {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        department: user.department
      };
    }
    return null;
  }

  // 客户相关方法
  getCustomers(): Promise<Customer[]> {
    return new Promise((resolve) => {
      // 模拟异步请求延迟
      setTimeout(() => {
        // 打印日志，确认返回的客户数据数量
        console.log('从dataService返回的客户数据数量:', this.storage.customers.length);
        // 确保返回完整的客户列表，不做任何过滤
        resolve([...this.storage.customers]);
      }, 100);
    });
  }

  getCustomerById(id: number): Promise<Customer | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const customer = this.storage.customers.find(c => c.id === id) || null;
        resolve(customer);
      }, 100);
    });
  }

  addCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newCustomer: Customer = {
          ...customer,
          id: Math.max(...this.storage.customers.map(c => c.id), 0) + 1
        };
        this.storage.customers.push(newCustomer);
        resolve(newCustomer);
      }, 200);
    });
  }

  updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.storage.customers.findIndex(c => c.id === id);
        if (index !== -1) {
          this.storage.customers[index] = {
            ...this.storage.customers[index],
            ...updates
          };
          this.saveState();
          resolve(this.storage.customers[index]);
        } else {
          resolve(null);
        }
      }, 200);
    });
  }

  deleteCustomer(id: number): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const initialLength = this.storage.customers.length;
        this.storage.customers = this.storage.customers.filter(c => c.id !== id);
        this.saveState();
        resolve(this.storage.customers.length !== initialLength);
      }, 200);
    });
  }

  // 添加客户到培训场次
  addCustomerToTraining(trainingId: number, customerInfo: {
    name: string;
    phone: string;
    email: string;
    registrationDate: string;
    paymentStatus: string;
    salespersonName: string;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const training = this.storage.trainingSessions.find(t => t.id === trainingId);
        if (training) {
          if (!training.participantsList) {
            training.participantsList = [];
          }
          
          // 为新参与者创建ID
          const newId = Math.max(...training.participantsList.map(p => p.id), 0) + 1;
          
          // 添加新参与者
          training.participantsList.push({
            id: newId,
            ...customerInfo
          });
          
          // 更新参与人数
          training.participants += 1;
          
          resolve(true);
        } else {
          resolve(false);
        }
      }, 200);
    });
  }

  // 专家相关方法
  getExperts(): Promise<Expert[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.storage.experts]);
      }, 100);
    });
  }

  // 业务员相关方法
  getSalespersons(): Promise<Salesperson[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.storage.salespersons]);
      }, 100);
    });
  }

  addSalesperson(salesperson: Omit<Salesperson, 'id'>): Promise<Salesperson> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newSalesperson: Salesperson = {
          ...salesperson,
          id: Math.max(...this.storage.salespersons.map(s => s.id), 0) + 1
        };
        this.storage.salespersons.push(newSalesperson);
        this.saveState();
        resolve(newSalesperson);
      }, 200);
    });
  }

  deleteSalesperson(id: number): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const initialLength = this.storage.salespersons.length;
        this.storage.salespersons = this.storage.salespersons.filter(s => s.id !== id);
        this.saveState();
        resolve(this.storage.salespersons.length !== initialLength);
      }, 200);
    });
  }

  // 更新业务员权限
  updateSalespersonPermissions(id: number, permissions: string[]): Promise<Salesperson | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.storage.salespersons.findIndex(s => s.id === id);
        if (index !== -1) {
          this.storage.salespersons[index].permissions = permissions;
          this.saveState();
          resolve(this.storage.salespersons[index]);
        } else {
          resolve(null);
        }
      }, 200);
    });
  }

  // 培训场次相关方法
  getTrainingSessions(): Promise<TrainingSession[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.storage.trainingSessions]);
      }, 100);
    });
  }

  getTrainingSessionById(id: number): Promise<TrainingSession | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const session = this.storage.trainingSessions.find(t => t.id === id) || null;
        resolve(session);
      }, 100);
    });
  }

  // 根据业务员获取培训场次
  getTrainingSessionsBySalesperson(salespersonName: string): Promise<TrainingSession[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sessions = this.storage.trainingSessions.filter(t => 
          t.salespersonName === salespersonName || 
          (t.participantsList && t.participantsList.some(p => p.salespersonName === salespersonName))
        );
        resolve(sessions);
      }, 100);
    });
  }

  // 数据导出方法
  exportData<T>(data: T[], format: 'excel' | 'csv' | 'pdf'): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟导出操作
        const timestamp = new Date().getTime();
        resolve(`导出成功: ${format.toUpperCase()}格式数据，时间戳: ${timestamp}`);
      }, 500);
    });
  }

  // 课程管理方法
  getCourses(): Promise<Course[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.storage.courses]);
      }, 100);
    });
  }

  getCourseById(id: string): Promise<Course | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const course = this.storage.courses.find(c => c.id === id) || null;
        resolve(course);
      }, 100);
    });
  }

  addCourse(course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newCourse: Course = {
          ...course,
          id: `course${String(Date.now()).slice(-6)}`,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0]
        };
        this.storage.courses.push(newCourse);
        this.saveState();
        resolve(newCourse);
      }, 200);
    });
  }

  updateCourse(id: string, updates: Partial<Course>): Promise<Course | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.storage.courses.findIndex(c => c.id === id);
        if (index !== -1) {
          this.storage.courses[index] = {
            ...this.storage.courses[index],
            ...updates,
            updatedAt: new Date().toISOString().split('T')[0]
          };
          this.saveState();
          resolve(this.storage.courses[index]);
        } else {
          resolve(null);
        }
      }, 200);
    });
  }

  deleteCourse(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const initialLength = this.storage.courses.length;
        this.storage.courses = this.storage.courses.filter(c => c.id !== id);
        this.saveState();
        resolve(this.storage.courses.length !== initialLength);
      }, 200);
    });
  }

  // 权限管理方法
  getPermissions(): Promise<Permission[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.storage.permissions]);
      }, 100);
    });
  }

  // 添加培训场次方法
  addTrainingSession(session: Omit<TrainingSession, 'id'>): Promise<TrainingSession> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newSession: TrainingSession = {
          ...session,
          id: Math.max(...this.storage.trainingSessions.map(s => s.id), 0) + 1
        };
        this.storage.trainingSessions.push(newSession);
        this.saveState();
        resolve(newSession);
      }, 200);
    });
  }
}

// 导出单例实例
export default new DataService();