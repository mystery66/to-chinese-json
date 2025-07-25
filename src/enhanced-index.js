const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { TranslationManager } = require('./translators');
const { ASTChineseExtractor } = require('./ast-chinese-extractor');
const { 
  extractChineseFromFile,
  findSourceFiles,
  loadApiConfig,
  deduplicateTexts,
  generateMapping
} = require('./index');

/**
 * 增强版执行中文转英文翻译的主函数
 * 支持 AST 和正则两种提取方法
 * @param {Object} options - 配置选项
 * @param {string} options.source - 源目录路径
 * @param {string} options.target - 目标目录路径
 * @param {string} options.output - 输出文件名
 * @param {string} options.translator - 翻译服务
 * @param {string} options.apiConfig - API 配置文件路径
 * @param {string} options.extractMethod - 提取方法 ('ast' | 'regex')
 * @param {Object} options.astOptions - AST 提取选项
 */
async function enhancedExecute(options) {
  try {
    const { 
      source, 
      target, 
      output, 
      translator, 
      apiConfig, 
      extractMethod = 'ast', // 默认使用 AST 方法
      astOptions = {}
    } = options;
    
    console.log(`📂 源目录: ${source}`);
    console.log(`📁 目标目录: ${target || source}`);
    console.log(`📄 输出文件: ${output}`);
    console.log(`🌐 翻译服务: ${translator}`);
    console.log(`🔧 提取方法: ${extractMethod.toUpperCase()}`);
    
    // 加载 API 配置
    await loadApiConfig(source, apiConfig);
    
    // 查找所有需要处理的文件
    const files = await findSourceFiles(source);
    console.log(`🔍 找到 ${files.length} 个文件需要处理`);
    
    // 根据选择的方法提取中文文本
    let chineseTexts;
    if (extractMethod === 'ast') {
      chineseTexts = await extractChineseWithAST(files, astOptions);
    } else {
      chineseTexts = await extractChineseWithRegex(files);
    }
    
    console.log(`📝 初步提取到 ${chineseTexts.size} 个中文文本`);
    
    // 进一步去重和清理
    const uniqueTexts = deduplicateTexts(Array.from(chineseTexts));
    console.log(`✨ 去重后剩余 ${uniqueTexts.length} 个唯一中文文本（减少 ${chineseTexts.size - uniqueTexts.length} 个重复项）`);
    
    // 生成中英文映射 JSON
    const mapping = await generateMapping(uniqueTexts, translator);
    
    // 保存 JSON 文件
    const outputPath = path.join(target || source, output);
    await fs.writeJson(outputPath, mapping, { spaces: 2 });
    
    console.log(`✅ 翻译完成！JSON 文件已保存到: ${outputPath}`);
    
    // 输出统计信息
    console.log(`\n📊 提取统计:`);
    console.log(`  - 扫描文件: ${files.length} 个`);
    console.log(`  - 提取方法: ${extractMethod.toUpperCase()}`);
    console.log(`  - 中文片段: ${uniqueTexts.length} 个`);
    console.log(`  - 翻译服务: ${translator}`);
    
  } catch (error) {
    console.error('❌ 执行失败:', error.message);
    process.exit(1);
  }
}

/**
 * 使用 AST 方法提取中文文本
 * @param {string[]} files - 文件路径数组
 * @param {Object} astOptions - AST 提取选项
 * @returns {Promise<Set<string>>} 中文文本集合
 */
async function extractChineseWithAST(files, astOptions = {}) {
  console.log('🔍 使用 TypeScript AST 方法提取中文...');
  
  const extractor = new ASTChineseExtractor();
  
  // 设置 AST 提取选项
  const defaultOptions = {
    extractFromComments: false,
    extractFromConsole: false,
    extractFromJSX: true,
    extractFromEnumValues: true,
    extractFromEnumKeys: false
  };
  
  extractor.setOptions({ ...defaultOptions, ...astOptions });
  
  const chineseTexts = new Set();
  let processedCount = 0;
  
  for (const file of files) {
    try {
      const texts = await extractor.extractFromFile(file);
      texts.forEach(text => chineseTexts.add(text));
      processedCount++;
      
      // 显示进度
      if (processedCount % 10 === 0 || processedCount === files.length) {
        console.log(`  📋 已处理 ${processedCount}/${files.length} 个文件...`);
      }
    } catch (error) {
      console.warn(`⚠️  AST 解析失败: ${file} - ${error.message}`);
    }
  }
  
  console.log(`🎯 AST 方法提取完成，共提取 ${chineseTexts.size} 个中文片段`);
  return chineseTexts;
}

/**
 * 使用正则表达式方法提取中文文本
 * @param {string[]} files - 文件路径数组
 * @returns {Promise<Set<string>>} 中文文本集合
 */
async function extractChineseWithRegex(files) {
  console.log('🔍 使用正则表达式方法提取中文...');
  
  const chineseTexts = new Set();
  let processedCount = 0;
  
  for (const file of files) {
    try {
      const texts = await extractChineseFromFile(file);
      texts.forEach(text => chineseTexts.add(text));
      processedCount++;
      
      // 显示进度
      if (processedCount % 10 === 0 || processedCount === files.length) {
        console.log(`  📋 已处理 ${processedCount}/${files.length} 个文件...`);
      }
    } catch (error) {
      console.warn(`⚠️  正则解析失败: ${file} - ${error.message}`);
    }
  }
  
  console.log(`🎯 正则方法提取完成，共提取 ${chineseTexts.size} 个中文片段`);
  return chineseTexts;
}

module.exports = {
  enhancedExecute,
  extractChineseWithAST,
  extractChineseWithRegex
};
