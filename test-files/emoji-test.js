// 测试文件：验证 emoji 和特殊符号过滤功能

// 包含各种 emoji 和特殊符号的中文文本
const messages = {
  success: '✅ 操作成功',
  error: '❌ 操作失败',
  loading: '🔍 正在加载数据',
  warning: '⚠️ 请注意安全',
  info: '📝 信息提示',
  rocket: '🚀 启动成功',
  star: '⭐ 收藏成功',
  fire: '🔥 热门推荐',
  heart: '❤️ 点赞成功',
  thumbsUp: '👍 很棒',
  
  // 混合符号
  complex1: '🎉✨ 恭喜您获得奖励 🎁💰',
  complex2: '📊📈 数据统计报告 📉📋',
  complex3: '🛠️⚙️ 系统维护中 🔧🔨',
  
  // 应该保留的纯中文
  pure1: '用户登录',
  pure2: '数据保存',
  pure3: '系统设置'
};

// 数组中的测试
const statusList = [
  '✅ 已完成',
  '❌ 已取消', 
  '⏭️ 跳过',
  '🔍 查找中',
  '纯中文状态'
];

// 函数中的测试
function showNotification(type) {
  if (type === 'success') {
    return '🎉 操作成功完成！';
  } else if (type === 'error') {
    return '💥 操作执行失败';
  }
  return '📢 默认提示信息';
}
