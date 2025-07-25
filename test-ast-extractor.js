const { ASTChineseExtractor } = require('./src/ast-chinese-extractor');
const path = require('path');

/**
 * 测试 AST 中文提取器
 */
async function testASTExtractor() {
  console.log('🧪 开始测试 TypeScript AST 中文提取器...\n');

  const extractor = new ASTChineseExtractor();
  
  // 配置提取选项
  extractor.setOptions({
    extractFromComments: false,    // 不提取注释中的中文
    extractFromConsole: false,     // 不提取 console.log 中的中文
    extractFromJSX: true,          // 提取 JSX 文本中的中文
    extractFromEnumValues: true,   // 提取枚举值中的中文
    extractFromEnumKeys: false     // 不提取枚举键中的中文
  });

  // 测试文件路径
  const testFiles = [
    './test-files/template-string-test.js',
    './test-files/emoji-test.js',
    './test-files/punctuation-test.js'
  ];

  console.log('📋 测试配置:');
  console.log('  - 提取注释中文: ❌');
  console.log('  - 提取 console 中文: ❌');
  console.log('  - 提取 JSX 中文: ✅');
  console.log('  - 提取枚举值中文: ✅');
  console.log('  - 提取枚举键中文: ❌\n');

  for (const testFile of testFiles) {
    console.log(`📝 测试文件: ${testFile}`);
    console.log('─'.repeat(60));
    
    try {
      const startTime = Date.now();
      const chineseTexts = await extractor.extractFromFile(testFile);
      const endTime = Date.now();
      
      console.log(`⏱️  解析耗时: ${endTime - startTime}ms`);
      console.log(`📊 提取结果: 共 ${chineseTexts.length} 个中文片段`);
      
      if (chineseTexts.length > 0) {
        console.log('🔍 提取的中文内容:');
        chineseTexts.forEach((text, index) => {
          console.log(`  ${index + 1}. "${text}"`);
        });
      } else {
        console.log('⚠️  未提取到中文内容');
      }
      
    } catch (error) {
      console.error(`❌ 测试失败: ${error.message}`);
    }
    
    console.log('\n');
  }

  // 批量处理测试
  console.log('🚀 批量处理测试');
  console.log('─'.repeat(60));
  
  try {
    const startTime = Date.now();
    const allTexts = await extractor.extractFromFiles(testFiles);
    const endTime = Date.now();
    
    console.log(`⏱️  批量处理耗时: ${endTime - startTime}ms`);
    console.log(`📊 总计提取: 共 ${allTexts.length} 个唯一中文片段`);
    
    // 按字母顺序排序显示
    const sortedTexts = allTexts.sort();
    console.log('🔍 所有唯一中文内容:');
    sortedTexts.forEach((text, index) => {
      console.log(`  ${index + 1}. "${text}"`);
    });
    
  } catch (error) {
    console.error(`❌ 批量处理失败: ${error.message}`);
  }

  console.log('\n✅ AST 提取器测试完成！');
}

/**
 * 性能对比测试
 */
async function performanceComparison() {
  console.log('\n🏁 性能对比测试: AST vs 正则表达式');
  console.log('='.repeat(60));

  const { extractChineseFromFile } = require('./src/index');
  const extractor = new ASTChineseExtractor();
  
  const testFile = './test-files/template-string-test.js';
  const iterations = 10;

  // AST 方法性能测试
  console.log('🔬 AST 方法测试...');
  const astTimes = [];
  let astResults = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    astResults = await extractor.extractFromFile(testFile);
    const endTime = Date.now();
    astTimes.push(endTime - startTime);
  }

  // 正则方法性能测试
  console.log('🔬 正则方法测试...');
  const regexTimes = [];
  let regexResults = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    regexResults = await extractChineseFromFile(testFile);
    const endTime = Date.now();
    regexTimes.push(endTime - startTime);
  }

  // 计算统计数据
  const astAvg = astTimes.reduce((a, b) => a + b, 0) / astTimes.length;
  const regexAvg = regexTimes.reduce((a, b) => a + b, 0) / regexTimes.length;
  
  console.log('\n📊 性能对比结果:');
  console.log(`AST 方法:`);
  console.log(`  - 平均耗时: ${astAvg.toFixed(2)}ms`);
  console.log(`  - 提取数量: ${astResults.length} 个`);
  console.log(`  - 最快: ${Math.min(...astTimes)}ms`);
  console.log(`  - 最慢: ${Math.max(...astTimes)}ms`);
  
  console.log(`正则方法:`);
  console.log(`  - 平均耗时: ${regexAvg.toFixed(2)}ms`);
  console.log(`  - 提取数量: ${regexResults.length} 个`);
  console.log(`  - 最快: ${Math.min(...regexTimes)}ms`);
  console.log(`  - 最慢: ${Math.max(...regexTimes)}ms`);
  
  console.log(`\n🏆 性能比较:`);
  if (astAvg < regexAvg) {
    console.log(`  AST 方法快 ${((regexAvg - astAvg) / regexAvg * 100).toFixed(1)}%`);
  } else {
    console.log(`  正则方法快 ${((astAvg - regexAvg) / astAvg * 100).toFixed(1)}%`);
  }

  console.log(`\n🔍 结果对比:`);
  console.log(`  AST 独有: ${astResults.filter(t => !regexResults.includes(t)).length} 个`);
  console.log(`  正则独有: ${regexResults.filter(t => !astResults.includes(t)).length} 个`);
  console.log(`  共同提取: ${astResults.filter(t => regexResults.includes(t)).length} 个`);
}

// 运行测试
async function runTests() {
  await testASTExtractor();
  await performanceComparison();
}

runTests().catch(console.error);
