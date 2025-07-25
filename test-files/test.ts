// 测试文件：验证中文提取功能

// 1. TypeScript 枚举测试 - 只提取 value 中的中文，不提取 key 中的中文
enum Status {
  待处理 = 'pending',           // key 是中文，value 是英文 - 不应提取 "待处理"
  已完成 = '任务已完成',         // key 是中文，value 是中文 - 应提取 "任务已完成"
  ACTIVE = '激活状态',          // key 是英文，value 是中文 - 应提取 "激活状态"
  ERROR = 'error_code',         // key 是英文，value 是英文 - 不应提取
  失败状态 = '操作失败了'        // key 是中文，value 是中文 - 应提取 "操作失败了"
}

// 2. console.log 测试 - 不应提取其中的中文
console.log('这是调试信息，不应该被提取');
console.warn('警告：网络连接失败');
console.error('错误：数据加载失败');

// 3. 普通字符串测试 - 应该提取
const message = '用户登录成功';
const title = "页面标题";
const template = `欢迎使用系统`;

// 4. 枚举使用测试 - 不应提取（因为是枚举引用）
const currentStatus = Status.待处理;
const config = {
  status: Status.已完成
};

// 5. 混合场景测试
function showMessage() {
  const alertText = '请确认您的操作';  // 应该提取
  console.log('函数执行中...');      // 不应提取
  return '操作完成';                // 应该提取
}

// 6. 对象属性测试
const userInfo = {
  name: '张三',
  role: '管理员',
  status: '在线状态'
};

// 7. 数组测试
const menuItems = ['首页', '用户管理', '系统设置'];

// 8. 复杂字符串测试
const complexMessage = `用户 ${userInfo.name} 已经${Status.已完成}任务`;
