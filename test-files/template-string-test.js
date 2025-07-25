// 模板字符串中文提取测试
// 测试各种模板字符串中的中文内容提取

const branchName = 'feature/user-management';
const regexPattern = '/user/.*';

// 1. 基础模板字符串
const confirmMessage = `正则【${regexPattern}】已在分支【${branchName}】中存在，是否再次添加？`;

// 2. 多行模板字符串
const multiLineMessage = `
  检测到冲突：
  正则模式：${regexPattern}
  目标分支：${branchName}
  请确认是否继续操作？
`;

// 3. 嵌套模板字符串
const nestedTemplate = `用户【${`管理员${branchName}`}】正在执行操作`;

// 4. 条件模板字符串
const conditionalMessage = `${branchName ? `分支【${branchName}】` : '默认分支'}已准备就绪`;

// 5. 函数调用中的模板字符串
function showAlert(pattern, branch) {
  alert(`正则【${pattern}】在分支【${branch}】中已存在，是否覆盖？`);
}

// 6. 对象属性中的模板字符串
const config = {
  title: `配置管理 - ${branchName}`,
  description: `当前正在配置分支【${branchName}】的正则规则【${regexPattern}】`,
  warningText: `警告：此操作将影响分支【${branchName}】的所有规则`
};

// 7. 数组中的模板字符串
const messages = [
  `正则【${regexPattern}】验证通过`,
  `分支【${branchName}】状态正常`,
  `系统提示：配置已保存到【${branchName}】分支`
];

// 8. 复杂表达式的模板字符串
const complexMessage = `
  操作结果：${regexPattern.includes('user') ? '用户相关规则' : '系统规则'}
  目标位置：分支【${branchName.split('/')[1] || '未知'}】
  执行时间：${new Date().toLocaleString('zh-CN')}
`;

// 9. 错误处理中的模板字符串
try {
  throw new Error(`正则【${regexPattern}】解析失败，请检查分支【${branchName}】的配置`);
} catch (error) {
  console.error(`捕获异常：${error.message}`);
}

// 10. 导出的模板字符串
export const exportedMessage = `导出消息：正则【${regexPattern}】已成功应用到分支【${branchName}】`;

// 应该被过滤的内容（console.log）
console.log(`调试信息：正则【${regexPattern}】在分支【${branchName}】中的状态`);
console.warn(`警告日志：分支【${branchName}】可能存在冲突`);
