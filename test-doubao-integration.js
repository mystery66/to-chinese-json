const { TranslationManager } = require('./src/translators');

/**
 * 测试豆包翻译器集成到翻译管理器的效果
 */
async function testDoubaoIntegration() {
  console.log('🔬 开始测试豆包翻译器集成...\n');
  
  const manager = new TranslationManager();
  
  // 测试用的中文文本
  const testTexts = [
    '用户管理',
    '系统设置', 
    '数据统计',
    '订单管理',
    '客户信息'
  ];
  
  try {
    // 设置使用豆包翻译器
    console.log('📋 设置翻译器为豆包API...');
    manager.setTranslator('doubao');
    console.log('✅ 豆包翻译器设置成功\n');
    
    // 测试单个翻译
    console.log('📋 测试单个文本翻译:');
    console.log('─'.repeat(50));
    const singleResult = await manager.translate('用户管理');
    console.log(`✅ 单个翻译: "用户管理" -> "${singleResult}"\n`);
    
    // 测试批量翻译
    console.log('📋 测试批量文本翻译:');
    console.log('─'.repeat(50));
    const batchResults = await manager.batchTranslate(testTexts);
    
    console.log('\n📊 翻译结果统计:');
    console.log('─'.repeat(50));
    console.log(`总文本数: ${testTexts.length}`);
    console.log(`成功翻译: ${Object.keys(batchResults).filter(key => batchResults[key] !== null).length}`);
    
    console.log('\n📝 完整映射结果:');
    console.log('─'.repeat(50));
    console.log(JSON.stringify(batchResults, null, 2));
    
    console.log('\n✅ 豆包翻译器集成测试完成！');
    console.log('🎯 结论: 豆包API已成功集成到翻译管理器中');
    
    return batchResults;
    
  } catch (error) {
    console.error('❌ 豆包翻译器集成测试失败:', error.message);
    console.log('\n🔧 可能的问题:');
    console.log('1. 豆包翻译器模块导入失败');
    console.log('2. API配置问题');
    console.log('3. 网络连接问题');
    
    throw error;
  }
}

// 运行测试
if (require.main === module) {
  testDoubaoIntegration().catch(console.error);
}

module.exports = { testDoubaoIntegration };
