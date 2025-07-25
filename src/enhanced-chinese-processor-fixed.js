/**
 * 增强版中文文本处理器（修复版）
 * 专门处理中文标点符号的智能分割和剔除
 */

/**
 * 增强版中文文本清理函数
 * 智能处理中文标点符号，进行分割并剔除标点符号
 * @param {string} text - 原始文本
 * @returns {string[]} 清理后的纯中文片段数组
 */
function enhancedCleanChineseText(text) {
  if (!text) return [];
  
  // 第一步：移除所有 emoji 和特殊符号
  let cleanedText = text
    // 移除 emoji（各种 Unicode emoji 范围）
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, ' ')
    // 移除常见的特殊符号和图标
    .replace(/[✅❌⏭️🔍📂📁📄🌐📡📝✨🚀⚠️💡🎯📊🛠️]/g, ' ')
    // 移除其他常见符号
    .replace(/[►▶️⭐🎉🔧📈📉💻🖥️📱⌚]/g, ' ')
    // 移除英文标点符号
    .replace(/[!@#$%^&*()_+\-=\[\]{}|;':",./\<\>?`~]/g, ' ');

  // 第二步：定义中文标点符号作为分割符（修复引号问题）
  const chinesePunctuation = [
    '，', '。', '？', '！', '；', '：',  // 基本标点
    '、', '·',                        // 顿号、间隔号
    '"', '"',                         // 左右双引号
    ''', ''',                         // 左右单引号
    '（', '）', '【', '】', '《', '》', // 括号
    '〈', '〉', '「', '」', '『', '』', // 其他括号
    '…', '——', '－',                  // 省略号、破折号
    '〔', '〕', '〖', '〗',             // 方括号变体
    '｛', '｝', '［', '］'              // 全角括号
  ];
  
  // 第三步：使用中文标点符号进行分割
  // 创建分割正则表达式
  const punctuationRegex = new RegExp('[' + chinesePunctuation.map(p => escapeRegExp(p)).join('') + ']+', 'g');
  
  // 按标点符号分割文本
  const segments = cleanedText.split(punctuationRegex);
  
  // 第四步：清理每个片段并过滤
  const cleanedSegments = segments
    .map(segment => segment.trim()) // 去除首尾空格
    .filter(segment => {
      // 只保留包含中文字符的非空片段
      return segment && /[\u4e00-\u9fff]/.test(segment);
    })
    .map(segment => {
      // 进一步清理：移除剩余的英文字符、数字和符号
      return segment
        .replace(/[a-zA-Z0-9\s]+/g, '') // 移除英文字母、数字和空格
        .replace(/[\u0000-\u007F]+/g, '') // 移除所有ASCII字符
        .trim();
    })
    .filter(segment => {
      // 最终过滤：确保片段有效且包含中文
      return segment && 
             segment.length > 0 && 
             /[\u4e00-\u9fff]/.test(segment) &&
             segment.length <= 20; // 避免过长的片段
    });
  
  return cleanedSegments;
}

/**
 * 转义正则表达式特殊字符
 * @param {string} string - 需要转义的字符串
 * @returns {string} 转义后的字符串
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 增强版中文文本验证函数
 * @param {string} text - 待检查的文本
 * @returns {boolean} 是否为有效的中文文本
 */
function enhancedIsValidChineseText(text) {
  // 基本检查：必须包含中文
  if (!text || !containsChinese(text)) {
    return false;
  }
  
  // 过滤掉空字符串或只有空白字符的文本
  if (!text.trim()) {
    return false;
  }
  
  // 过滤掉过长的文本（可能包含代码）
  if (text.length > 20) {
    return false;
  }
  
  // 过滤掉包含特殊代码字符的文本
  const codePatterns = [
    /[{}[\]();]/,  // 代码括号
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
  
  // 过滤掉包含过多英文字符的文本
  const chineseCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishCount = (text.match(/[a-zA-Z]/g) || []).length;
  if (englishCount > chineseCount) {
    return false;
  }
  
  return true;
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
 * 智能去重增强版
 * 处理标点符号分割后可能产生的重复片段
 * @param {string[]} texts - 中文文本数组
 * @returns {string[]} 去重后的中文文本数组
 */
function enhancedDeduplicateTexts(texts) {
  const seen = new Set();
  const result = [];
  
  for (const text of texts) {
    // 规范化文本：去除首尾空格、统一格式
    const normalized = text
      .trim()
      .replace(/\s+/g, '') // 移除所有空格进行比较
      .toLowerCase(); // 转小写比较（虽然中文没有大小写，但保持一致性）
    
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(text); // 保留原始文本格式
    }
  }
  
  return result;
}

/**
 * 测试函数：展示优化效果
 * @param {string} testText - 测试文本
 */
function testEnhancedProcessor(testText) {
  console.log('=== 增强版中文处理器测试 ===');
  console.log('原始文本:', testText);
  
  const segments = enhancedCleanChineseText(testText);
  console.log('提取的中文片段:');
  segments.forEach((segment, index) => {
    console.log(`  ${index + 1}. "${segment}"`);
  });
  
  const validSegments = segments.filter(enhancedIsValidChineseText);
  console.log('有效的中文片段:');
  validSegments.forEach((segment, index) => {
    console.log(`  ${index + 1}. "${segment}"`);
  });
  
  const deduplicated = enhancedDeduplicateTexts(validSegments);
  console.log('去重后的中文片段:');
  deduplicated.forEach((segment, index) => {
    console.log(`  ${index + 1}. "${segment}"`);
  });
  
  return deduplicated;
}

module.exports = {
  enhancedCleanChineseText,
  enhancedIsValidChineseText,
  enhancedDeduplicateTexts,
  testEnhancedProcessor
};
