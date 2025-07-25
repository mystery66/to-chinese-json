const { testEnhancedProcessor } = require('./src/enhanced-chinese-processor-v2');

// 测试用例：模板字符串中的复杂中文文本
const testCases = [
  // 1. 你提到的具体例子
  '正则【${val}】已在分支【${key}】中存在，是否再次添加？',
  
  // 2. 其他复杂的模板字符串
  '检测到冲突：正则模式：${regexPattern}目标分支：${branchName}请确认是否继续操作？',
  
  // 3. 包含多种标点的文本
  '用户【管理员${branchName}】正在执行操作',
  
  // 4. 嵌套引号和括号
  '警告：此操作将影响分支【${branchName}】的所有规则',
  
  // 5. 复杂的中文句子
  '系统提示：配置已保存到【${branchName}】分支'
];

console.log('🧪 开始测试增强版中文处理器...\n');

testCases.forEach((testCase, index) => {
  console.log(`\n📝 测试用例 ${index + 1}:`);
  testEnhancedProcessor(testCase);
  console.log('─'.repeat(50));
});

console.log('\n✅ 测试完成！');
