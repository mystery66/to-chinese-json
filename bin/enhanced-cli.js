#!/usr/bin/env node

const { Command } = require('commander');
const { enhancedExecute } = require('../src/enhanced-index');
const packageJson = require('../package.json');

const program = new Command();

program
  .name('pick-cn-enhanced')
  .description('Enhanced Chinese to English translation tool with AST support')
  .version(packageJson.version);

program
  .command('execute')
  .alias('exec')
  .description('Execute the Chinese to English translation process with enhanced features')
  .option('-s, --source <path>', 'Source directory path (default: current directory)', process.cwd())
  .option('-t, --target <path>', 'Target directory path for JSON output')
  .option('-o, --output <filename>', 'Output JSON filename', 'Chinese-To-English.json')
  .option('--translator <service>', 'Translation service to use (baidu, youdao, google)', 'baidu')
  .option('--api-config <path>', 'API configuration file path (optional, auto-lookup for api-config.json in project directory)')
  .option('--method <type>', 'Extraction method: ast or regex', 'ast')
  .option('--extract-comments', 'Extract Chinese from comments (AST only)', false)
  .option('--extract-console', 'Extract Chinese from console.log (AST only)', false)
  .option('--no-extract-jsx', 'Skip extracting Chinese from JSX text (AST only)')
  .option('--no-extract-enum-values', 'Skip extracting Chinese from enum values (AST only)')
  .option('--extract-enum-keys', 'Extract Chinese from enum keys (AST only)', false)
  .option('--extract-identifiers', 'Extract Chinese from identifiers/variable names (AST only)', false)
  .option('--extract-property-names', 'Extract Chinese from object property names (AST only)', false)
  .action(async (options) => {
    console.log('🚀 开始执行增强版中文转英文翻译...');
    
    // 构建 AST 选项
    const astOptions = {
      extractFromComments: options.extractComments,
      extractFromConsole: options.extractConsole,
      extractFromJSX: options.extractJsx,
      extractFromEnumValues: options.extractEnumValues,
      extractFromEnumKeys: options.extractEnumKeys,
      extractFromIdentifiers: options.extractIdentifiers,
      extractFromPropertyNames: options.extractPropertyNames
    };
    
    // 构建执行选项
    const executeOptions = {
      source: options.source,
      target: options.target,
      output: options.output,
      translator: options.translator,
      apiConfig: options.apiConfig,
      extractMethod: options.method,
      astOptions: astOptions
    };
    
    await enhancedExecute(executeOptions);
  });

// 添加对比命令
program
  .command('compare')
  .description('Compare AST and regex extraction methods')
  .option('-s, --source <path>', 'Source directory path (default: current directory)', process.cwd())
  .option('-f, --file <path>', 'Single file to compare (optional)')
  .action(async (options) => {
    console.log('🔬 开始对比 AST 和正则表达式提取方法...');
    
    const { ASTChineseExtractor } = require('../src/ast-chinese-extractor');
    const { extractChineseFromFile, findSourceFiles } = require('../src/index');
    
    let files;
    if (options.file) {
      files = [options.file];
    } else {
      files = await findSourceFiles(options.source);
      // 限制对比文件数量，避免输出过多
      files = files.slice(0, 5);
    }
    
    console.log(`📋 对比文件: ${files.length} 个\n`);
    
    const extractor = new ASTChineseExtractor();
    extractor.setOptions({
      extractFromComments: false,
      extractFromConsole: false,
      extractFromJSX: true,
      extractFromEnumValues: true,
      extractFromEnumKeys: false
    });
    
    for (const file of files) {
      console.log(`📝 文件: ${file}`);
      console.log('─'.repeat(60));
      
      try {
        // AST 方法
        const startAst = Date.now();
        const astResults = await extractor.extractFromFile(file);
        const astTime = Date.now() - startAst;
        
        // 正则方法
        const startRegex = Date.now();
        const regexResults = await extractChineseFromFile(file);
        const regexTime = Date.now() - startRegex;
        
        console.log(`⏱️  AST 方法: ${astTime}ms, 提取 ${astResults.length} 个`);
        console.log(`⏱️  正则方法: ${regexTime}ms, 提取 ${regexResults.length} 个`);
        
        // 分析差异
        const astOnly = astResults.filter(t => !regexResults.includes(t));
        const regexOnly = regexResults.filter(t => !astResults.includes(t));
        const common = astResults.filter(t => regexResults.includes(t));
        
        console.log(`🔍 AST 独有: ${astOnly.length} 个`);
        if (astOnly.length > 0 && astOnly.length <= 5) {
          astOnly.forEach(text => console.log(`    "${text}"`));
        }
        
        console.log(`🔍 正则独有: ${regexOnly.length} 个`);
        if (regexOnly.length > 0 && regexOnly.length <= 5) {
          regexOnly.forEach(text => console.log(`    "${text}"`));
        }
        
        console.log(`🔍 共同提取: ${common.length} 个`);
        
      } catch (error) {
        console.error(`❌ 对比失败: ${error.message}`);
      }
      
      console.log('\n');
    }
    
    console.log('✅ 对比完成！');
  });

// 添加帮助信息
program
  .command('help-methods')
  .description('Show detailed information about extraction methods')
  .action(() => {
    console.log(`
🔧 提取方法详解

📋 AST 方法 (推荐)
  ✅ 优势:
    - 更高的准确性，基于语法树解析
    - 支持复杂的 TypeScript/JavaScript 语法
    - 可配置提取规则
    - 支持 JSX 文本提取
    - 精确识别字符串类型

  ⚠️  注意:
    - 解析速度稍慢
    - 需要 TypeScript 编译器支持

📋 正则方法
  ✅ 优势:
    - 解析速度快
    - 内存占用少
    - 兼容性好

  ⚠️  注意:
    - 可能遗漏复杂语法中的中文
    - 对模板字符串支持有限

🎯 建议:
  - 新项目推荐使用 AST 方法
  - 大型项目或性能敏感场景可考虑正则方法
  - 使用 compare 命令对比两种方法的效果
`);
  });

program.parse();
