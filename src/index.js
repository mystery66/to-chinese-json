const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { TranslationManager } = require('./translators');

/**
 * 执行中文转英文翻译的主函数
 * @param {Object} options - 配置选项
 * @param {string} options.source - 源目录路径
 * @param {string} options.target - 目标目录路径
 * @param {string} options.output - 输出文件名
 * @param {string} options.translator - 翻译服务
 * @param {string} options.apiConfig - API 配置文件路径
 */
async function execute(options) {
  try {
    const { source, target, output, translator, apiConfig } = options;
    
    console.log(`📂 源目录: ${source}`);
    console.log(`📁 目标目录: ${target || source}`);
    console.log(`📄 输出文件: ${output}`);
    console.log(`🌐 翻译服务: ${translator}`);
    
    // 加载 API 配置（自动查找并合并配置文件）
    await loadApiConfig(source, apiConfig);
    
    // 查找所有需要处理的文件
    const files = await findSourceFiles(source);
    console.log(`🔍 找到 ${files.length} 个文件需要处理`);
    
    // 提取中文文本
    const chineseTexts = new Set();
    for (const file of files) {
      const texts = await extractChineseFromFile(file);
      texts.forEach(text => chineseTexts.add(text));
    }
    
    console.log(`📝 初步提取到 ${chineseTexts.size} 个中文文本`);
    
    // 进一步去重和清理（处理空格、标点符等差异）
    const uniqueTexts = deduplicateTexts(Array.from(chineseTexts));
    console.log(`✨ 去重后剩余 ${uniqueTexts.length} 个唯一中文文本（减少 ${chineseTexts.size - uniqueTexts.length} 个重复项）`);
    
    // 生成中英文映射 JSON
    const mapping = await generateMapping(uniqueTexts, translator);
    
    // 保存 JSON 文件
    const outputPath = path.join(target || source, output);
    await fs.writeJson(outputPath, mapping, { spaces: 2 });
    
    console.log(`✅ 翻译完成！JSON 文件已保存到: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ 执行失败:', error.message);
    process.exit(1);
  }
}

/**
 * 查找源文件
 * @param {string} sourcePath - 源目录路径
 * @returns {Promise<string[]>} 文件路径数组
 */
async function findSourceFiles(sourcePath) {
  const patterns = [
    '**/*.js',
    '**/*.jsx',
    '**/*.ts',
    '**/*.tsx',
    '**/*.vue'
  ];
  
  const files = [];
  for (const pattern of patterns) {
    // 首先扫描 src 目录（主要代码目录）
    const srcMatches = glob.sync(path.join(sourcePath, 'src', pattern), {
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.min.js']
    });
    files.push(...srcMatches);
    
    // 如果没有 src 目录或者需要扫描整个目录，则扫描整个指定目录
    const allMatches = glob.sync(path.join(sourcePath, pattern), {
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.min.js', '**/src/**'] // 排除 src 目录避免重复
    });
    files.push(...allMatches);
  }
  
  return files;
}

/**
 * 从文件中提取中文文本
 * @param {string} filePath - 文件路径
 * @returns {Promise<string[]>} 中文文本数组
 */
async function extractChineseFromFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const chineseTexts = [];
    
    // 1. 提取 TypeScript 枚举定义中的中文 key
    const enumKeyRegex = /enum\s+\w+\s*\{[^}]*?'([^']*[\u4e00-\u9fff][^']*)'\s*[=,}]/g;
    let match;
    while ((match = enumKeyRegex.exec(content)) !== null) {
      const text = match[1].trim();
      if (isValidChineseText(text)) {
        chineseTexts.push(text);
      }
    }
    
    // 2. 提取普通字符串字面量中的中文（排除枚举使用处）
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 跳过枚举使用的行（如 key: EnumType.中文key）
      if (isEnumUsageLine(line)) {
        continue;
      }
      
      // 提取该行中的中文字符串
      const lineTexts = extractChineseFromLine(line);
      chineseTexts.push(...lineTexts);
    }
    
    return [...new Set(chineseTexts)]; // 去重
  } catch (error) {
    console.warn(`⚠️  读取文件失败: ${filePath}`, error.message);
    return [];
  }
}

/**
 * 检查是否为枚举使用的行
 * @param {string} line - 代码行
 * @returns {boolean} 是否为枚举使用行
 */
function isEnumUsageLine(line) {
  // 匹配 key: EnumType.中文 或 EnumType.中文 这样的模式
  const enumUsagePatterns = [
    /\w+\.[\u4e00-\u9fff]/,  // EnumType.中文
    /key:\s*\w+\.[\u4e00-\u9fff]/, // key: EnumType.中文
  ];
  
  return enumUsagePatterns.some(pattern => pattern.test(line));
}

/**
 * 从单行代码中提取中文文本
 * @param {string} line - 代码行
 * @returns {string[]} 中文文本数组
 */
function extractChineseFromLine(line) {
  const texts = [];
  
  // 匹配单引号字符串中的中文
  const singleQuoteRegex = /'([^']*[\u4e00-\u9fff][^']*)'/g;
  // 匹配双引号字符串中的中文
  const doubleQuoteRegex = /"([^"]*[\u4e00-\u9fff][^"]*)"/g;
  // 匹配模板字符串中的中文
  const templateRegex = /`([^`]*[\u4e00-\u9fff][^`]*)`/g;
  
  let match;
  
  // 提取单引号中的中文
  while ((match = singleQuoteRegex.exec(line)) !== null) {
    const text = match[1].trim();
    if (isValidChineseText(text)) {
      texts.push(text);
    }
  }
  
  // 提取双引号中的中文
  while ((match = doubleQuoteRegex.exec(line)) !== null) {
    const text = match[1].trim();
    if (isValidChineseText(text)) {
      texts.push(text);
    }
  }
  
  // 提取模板字符串中的中文
  while ((match = templateRegex.exec(line)) !== null) {
    const templateContent = match[1];
    
    // 如果模板字符串不包含表达式，直接处理
    if (!templateContent.includes('${')) {
      const text = templateContent.trim();
      if (isValidChineseText(text)) {
        texts.push(text);
      }
    } else {
      // 如果包含表达式，提取被${}分割的中文片段
      const segments = templateContent.split(/\$\{[^}]*\}/);
      for (const segment of segments) {
        const text = segment.trim();
        if (text && isValidChineseText(text)) {
          texts.push(text);
        }
      }
    }
  }
  
  return texts;
}

/**
 * 检查文本是否包含中文
 * @param {string} text - 待检查的文本
 * @returns {boolean} 是否包含中文
 */
function containsChinese(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

/**
 * 智能去重中文文本（处理空格、标点符等细微差异）
 * @param {string[]} texts - 中文文本数组
 * @returns {string[]} 去重后的中文文本数组
 */
function deduplicateTexts(texts) {
  const seen = new Map(); // 使用 Map 来存储规范化后的文本和原始文本的映射
  const result = [];
  
  for (const text of texts) {
    // 规范化文本：去除首尾空格、统一多个空格为一个、去除部分标点符
    const normalized = text
      .trim() // 去除首尾空格
      .replace(/\s+/g, ' ') // 多个空格合并为一个
      .replace(/[。，；：“”‘’（）、《》]/g, '') // 去除常见中文标点符
      .toLowerCase(); // 转为小写（对于英文字母）
    
    if (!seen.has(normalized)) {
      seen.set(normalized, text);
      result.push(text); // 保留原始文本格式
    } else {
      // 如果发现重复，选择更好的版本（更完整或更常见的格式）
      const existingText = seen.get(normalized);
      if (text.length > existingText.length || 
          (文本质量评分(text) > 文本质量评分(existingText))) {
        // 更新为更好的版本
        const index = result.indexOf(existingText);
        if (index !== -1) {
          result[index] = text;
          seen.set(normalized, text);
        }
      }
    }
  }
  
  return result;
}

/**
 * 评估文本质量分数（用于选择更好的重复文本版本）
 * @param {string} text - 文本
 * @returns {number} 质量分数（越高越好）
 */
function 文本质量评分(text) {
  let score = 0;
  
  // 长度加分（但不过度偏向长文本）
  score += Math.min(text.length, 20);
  
  // 完整性加分（包含标点符说明更完整）
  if (/[。？！]$/.test(text)) score += 5; // 以句号结尾
  if (/[，、]/.test(text)) score += 2; // 包含逗号
  
  // 减分项（不完整的文本）
  if (text.startsWith('，') || text.startsWith('、')) score -= 3; // 以逗号开头
  if (text.endsWith('，') || text.endsWith('、')) score -= 1; // 以逗号结尾
  
  return score;
}

/**
 * 验证是否为有效的中文文本（用于翻译）
 * @param {string} text - 待检查的文本
 * @returns {boolean} 是否为有效的中文文本
 */
function isValidChineseText(text) {
  // 基本检查：必须包含中文
  if (!containsChinese(text)) {
    return false;
  }
  
  // 过滤掉空字符串或只有空白字符的文本
  if (!text.trim()) {
    return false;
  }
  
  // 过滤掉过长的文本（可能包含代码）
  if (text.length > 50) {
    return false;
  }
  
  // 过滤掉包含特殊代码字符的文本
  const codePatterns = [
    /[{}\[\]();]/,  // 代码括号
    /\\n|\\t/,      // 转义字符
    /^\s*\/\//,     // 注释
    /interface|class|function|const|let|var|export|import/i, // 关键字
    /\w+\s*:\s*\w+/, // 对象属性定义
  ];
  
  for (const pattern of codePatterns) {
    if (pattern.test(text)) {
      return false;
    }
  }
  
  // 过滤掉纯数字或主要是数字的文本
  if (/^[\d\s.,，。]+$/.test(text)) {
    return false;
  }
  
  // 过滤掉只包含标点符号的文本
  if (/^[\s\p{P}]+$/u.test(text)) {
    return false;
  }
  
  return true;
}

/**
 * 加载 API 配置文件
 * @param {string} sourcePath - 项目源目录路径
 * @param {string} customConfigPath - 自定义配置文件路径（可选）
 */
async function loadApiConfig(sourcePath, customConfigPath) {
  const configs = [];
  
  try {
    // 1. 如果指定了自定义配置路径，优先加载
    if (customConfigPath && await fs.pathExists(customConfigPath)) {
      const customConfig = await fs.readJson(customConfigPath);
      configs.push(customConfig);
      console.log(`📄 加载自定义配置: ${customConfigPath}`);
    }
    
    // 2. 查找项目目录下的 api-config.json
    const projectConfigPath = path.join(sourcePath, 'api-config.json');
    if (await fs.pathExists(projectConfigPath)) {
      const projectConfig = await fs.readJson(projectConfigPath);
      configs.push(projectConfig);
      console.log(`📄 加载项目配置: ${projectConfigPath}`);
    }
    
    // 3. 查找工具目录下的 api-config.json
    const toolConfigPath = path.join(__dirname, '..', 'api-config.json');
    if (await fs.pathExists(toolConfigPath)) {
      const toolConfig = await fs.readJson(toolConfigPath);
      configs.push(toolConfig);
      console.log(`📄 加载工具配置: ${toolConfigPath}`);
    }
    
    if (configs.length === 0) {
      console.warn('⚠️  未找到任何 API 配置文件');
      return;
    }
    
    // 4. 合并所有配置（后面的配置会覆盖前面的）
    const mergedConfig = Object.assign({}, ...configs);
    
    // 5. 设置环境变量
    if (mergedConfig.baidu) {
      process.env.BAIDU_TRANSLATE_APP_ID = mergedConfig.baidu.appId;
      process.env.BAIDU_TRANSLATE_SECRET_KEY = mergedConfig.baidu.secretKey;
    }
    
    if (mergedConfig.youdao) {
      process.env.YOUDAO_TRANSLATE_APP_KEY = mergedConfig.youdao.appKey;
      process.env.YOUDAO_TRANSLATE_APP_SECRET = mergedConfig.youdao.appSecret;
    }
    
    if (mergedConfig.google) {
      process.env.GOOGLE_TRANSLATE_API_KEY = mergedConfig.google.apiKey;
    }
    
    console.log('✅ API 配置加载成功，已合并 ' + configs.length + ' 个配置文件');
    
  } catch (error) {
    console.warn('⚠️  API 配置加载失败:', error.message);
  }
}

/**
 * 生成中英文映射
 * @param {string[]} chineseTexts - 中文文本数组
 * @param {string} translatorService - 翻译服务名称
 * @returns {Promise<Object>} 中英文映射对象
 */
async function generateMapping(chineseTexts, translatorService = 'baidu') {
  console.log('🌐 初始化翻译服务...');
  
  const translationManager = new TranslationManager();
  
  // 设置翻译服务
  try {
    translationManager.setTranslator(translatorService);
    console.log(`📡 使用翻译服务: ${translatorService}`);
  } catch (error) {
    console.warn(`⚠️  翻译服务设置失败: ${error.message}，使用默认服务`);
  }
  
  // 尝试使用第三方翻译 API 进行批量翻译
  try {
    console.log('📡 使用第三方翻译 API 进行批量翻译...');
    const apiTranslations = await translationManager.batchTranslate(chineseTexts);
    
    const mapping = {};
    for (const chineseText of chineseTexts) {
      const apiTranslation = apiTranslations[chineseText];
      
      if (apiTranslation) {
        mapping[chineseText] = apiTranslation;
        console.log(`✅ API翻译: ${chineseText} -> ${apiTranslation}`);
      } else {
        // API 翻译失败，使用内置词典或占位符
        const fallbackTranslation = await translateText(chineseText);
        mapping[chineseText] = fallbackTranslation;
      }
    }
    
    return mapping;
  } catch (error) {
    console.warn('⚠️  第三方翻译 API 不可用，使用内置翻译方案:', error.message);
    
    // 如果第三方 API 不可用，回退到原有的翻译逻辑
    const mapping = {};
    for (const chineseText of chineseTexts) {
      const englishText = await translateText(chineseText);
      mapping[chineseText] = englishText;
    }
    
    return mapping;
  }
}

/**
 * 翻译文本 - 将中文翻译为英文
 * @param {string} chineseText - 中文文本
 * @returns {Promise<string>} 英文文本
 */
async function translateText(chineseText) {
  // 首先尝试从内置词典翻译
  const translation = getBuiltinTranslation(chineseText);
  if (translation) {
    return translation;
  }
  
  // 如果内置词典没有，尝试使用在线翻译 API
  try {
    const onlineTranslation = await translateWithAPI(chineseText);
    if (onlineTranslation) {
      return onlineTranslation;
    }
  } catch (error) {
    console.warn(`⚠️  在线翻译失败: ${chineseText}`, error.message);
  }
  
  // 如果都失败了，返回格式化的占位符
  const placeholder = generatePlaceholder(chineseText);
  console.log(`📝 使用占位符: ${chineseText} -> ${placeholder}`);
  return placeholder;
}

/**
 * 内置中英文词典
 * @param {string} chineseText - 中文文本
 * @returns {string|null} 英文翻译或 null
 */
function getBuiltinTranslation(chineseText) {
  const dictionary = {
    // 数据统计相关
    '总次数': 'Total Count',
    '总和': 'Sum',
    '平均值': 'Average',
    '最大值': 'Maximum',
    '最小值': 'Minimum',
    
    // 订单相关
    '订单数量': 'Order Count',
    '订单总商品数量': 'Total Product Count',
    '订单实付金额': 'Order Paid Amount',
    '订单总商品价格': 'Total Product Price',
    '订单商品数量': 'Order Product Count',
    '提交订单': 'Submit Order',
    '订单详情': 'Order Details',
    
    // 操作符相关
    '等于': 'Equal',
    '不等于': 'Not Equal',
    '包含': 'Contains',
    '不包含': 'Not Contains',
    '有值': 'Has Value',
    '没值': 'No Value',
    '小于': 'Less Than',
    '大于': 'Greater Than',
    '小于等于': 'Less Than or Equal',
    '大于等于': 'Greater Than or Equal',
    '区间': 'Range',
    
    // 布尔值
    '为真': 'True',
    '为假': 'False',
    
    // 商品相关
    '优惠金额': 'Discount Amount',
    '商品价格': 'Product Price',
    '商品数量': 'Product Count',
    '实付金额': 'Paid Amount',
    
    // 性别相关
    '性别': 'Gender',
    '男性': 'Male',
    '女性': 'Female',
    
    // 平台相关
    '有赞': 'Youzan',
    '淘宝': 'Taobao',
    
    // 渠道相关
    '注册渠道': 'Registration Channel',
    '好友类别': 'Friend Category',
    '用户行为事件': 'User Behavior Event',
    
    // 行为相关
    '做过': 'Done',
    '未做过': 'Not Done',
    '已做过': 'Already Done',
    
    // 通用
    '上传失败': 'Upload Failed',
    '删除': 'Delete',
    '编辑': 'Edit',
    '保存': 'Save',
    '取消': 'Cancel',
    '确认': 'Confirm',
    '提交': 'Submit',
    '重置': 'Reset',
    '搜索': 'Search',
    '查询': 'Query',
    '添加': 'Add',
    '新增': 'Add',
    '修改': 'Modify',
    '更新': 'Update',
    '刷新': 'Refresh',
    '加载': 'Load',
    '导入': 'Import',
    '导出': 'Export',
    '下载': 'Download',
    '上传': 'Upload',
    '复制': 'Copy',
    '粘贴': 'Paste',
    '剪切': 'Cut',
    '全选': 'Select All',
    '清空': 'Clear',
    '返回': 'Back',
    '下一步': 'Next',
    '上一步': 'Previous',
    '完成': 'Complete',
    '开始': 'Start',
    '结束': 'End',
    '暂停': 'Pause',
    '继续': 'Continue',
    '停止': 'Stop',
    '重新开始': 'Restart',
    '重试': 'Retry',
    '跳过': 'Skip',
    '忽略': 'Ignore',
    '关闭': 'Close',
    '打开': 'Open',
    '展开': 'Expand',
    '收起': 'Collapse',
    '显示': 'Show',
    '隐藏': 'Hide',
    '启用': 'Enable',
    '禁用': 'Disable',
    '激活': 'Activate',
    '停用': 'Deactivate',
  };
  
  return dictionary[chineseText] || null;
}

/**
 * 使用在线翻译 API 翻译文本
 * @param {string} chineseText - 中文文本
 * @returns {Promise<string|null>} 英文翻译或 null
 */
async function translateWithAPI(chineseText) {
  // TODO: 这里可以集成各种翻译 API
  // 例如：Google Translate API, 百度翻译 API, 有道翻译 API 等
  // 目前返回 null，表示不使用在线翻译
  return null;
}

/**
 * 生成占位符
 * @param {string} chineseText - 中文文本
 * @returns {string} 占位符
 */
function generatePlaceholder(chineseText) {
  // 将中文转换为拼音风格的占位符
  const placeholder = chineseText
    .replace(/[\u4e00-\u9fff]/g, 'X')
    .replace(/\s+/g, '_')
    .toLowerCase();
  
  return `translate_${placeholder}`;
}

module.exports = {
  execute
};
