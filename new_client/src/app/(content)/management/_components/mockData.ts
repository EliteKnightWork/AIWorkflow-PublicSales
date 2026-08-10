export interface Project {
  id: string;
  title: string;
  organization: string;
  status: string;
  deadline: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  assignee: string;
  status: string;
  dueDate: string;
  priority: string;
}

export const mockProjects: Project[] = [
  {
    id: 'PRJ001',
    title: '市役所システムリプレイス案件',
    organization: '東京都市役所',
    status: '進行中',
    deadline: '2025-04-30',
    updatedAt: '2025-03-15',
  },
  {
    id: 'PRJ002',
    title: '学校給食管理システム構築',
    organization: '大阪府教育委員会',
    status: '入札準備',
    deadline: '2025-05-15',
    updatedAt: '2025-03-10',
  },
  {
    id: 'PRJ003',
    title: '道路管理システム更新',
    organization: '国土交通省',
    status: '提案書作成中',
    deadline: '2025-04-20',
    updatedAt: '2025-03-18',
  },
];

export const mockTasks: Task[] = [
  {
    id: 'TSK001',
    title: '提案書ドラフト作成',
    assignee: '田中太郎',
    status: '進行中',
    dueDate: '2025-03-25',
    priority: '高',
  },
  {
    id: 'TSK002',
    title: '見積書作成',
    assignee: '鈴木一郎',
    status: '未着手',
    dueDate: '2025-03-27',
    priority: '中',
  },
  {
    id: 'TSK003',
    title: 'クライアントMTG',
    assignee: '佐藤花子',
    status: '完了',
    dueDate: '2025-03-15',
    priority: '高',
  },
];
