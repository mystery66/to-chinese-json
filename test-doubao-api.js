const axios = require('axios');

/**
 * 豆包API翻译测试脚本
 * 测试豆包API是否可以用于中文到英文的翻译
 */

// 接口配置
const url = 'https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions';
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer b916a08d-d5af-4217-8d88-339343a09661'
};

/**
 * 使用豆包API翻译单个中文文本
 * @param {string} chineseText - 要翻译的中文文本
 * @returns {Promise<string>} 翻译后的英文文本
 */
async function translateWithDoubao(chineseText) {
  try {
    const response = await axios.post(url, {
      model: 'bot-20250725171411-rmwwl',
      stream: false,
      messages: [
        {
          role: 'user',
          content: `请将以下中文翻译成英文，只返回翻译结果，不要其他解释：${chineseText}`
        }
      ],
      parameters: {
        result_format: 'message',
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }
    }, { headers });

    // 提取翻译结果
    const translatedText = response.data.choices[0].message.content;
    return translatedText.trim();
    
  } catch (error) {
    console.error(`翻译失败: ${chineseText}`, error.message);
    throw error;
  }
}

/**
 * 批量翻译中文文本数组
 * @param {string[]} chineseTexts - 中文文本数组
 * @returns {Promise<Object>} 中英文映射对象
 */
async function batchTranslateWithDoubao(chineseTexts) {
  console.log(`🚀 开始使用豆包API翻译 ${chineseTexts.length} 个中文文本...`);
  
  const mapping = {};
  const batchSize = 5; // 每批处理5个，避免API限制
  const delay = 2000; // 每批之间延迟2秒
  
  for (let i = 0; i < chineseTexts.length; i += batchSize) {
    const batch = chineseTexts.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(chineseTexts.length / batchSize);
    
    console.log(`📡 正在翻译第 ${batchNumber} 批，共 ${totalBatches} 批（${batch.length} 个文本）`);
    
    // 并行处理当前批次
    const promises = batch.map(async (text) => {
      try {
        const translation = await translateWithDoubao(text);
        mapping[text] = translation;
        console.log(`✅ ${text} -> ${translation}`);
        return { success: true, text, translation };
      } catch (error) {
        console.log(`❌ ${text} -> 翻译失败: ${error.message}`);
        mapping[text] = text; // 翻译失败时保持原文
        return { success: false, text, error: error.message };
      }
    });
    
    await Promise.all(promises);
    
    // 如果不是最后一批，等待一段时间
    if (i + batchSize < chineseTexts.length) {
      console.log(`🕰️  等待 ${delay / 1000} 秒后继续下一批...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return mapping;
}

/**
 * 测试豆包API翻译功能
 */
async function testDoubaoTranslation() {
  console.log('🔬 开始测试豆包API翻译功能...\n');
  
  // 测试用的中文文本
  const testTexts = [
    '新建任务',
    '用户管理',
    '系统设置',
    '数据统计',
    '订单管理',
    '客户信息',
    '产品列表',
    '销售报表'
  ];
  
  try {
    // 单个翻译测试
    console.log('📋 测试单个文本翻译:');
    console.log('─'.repeat(50));
    const singleResult = await translateWithDoubao('新建任务');
    console.log(`✅ 单个翻译成功: "新建任务" -> "${singleResult}"\n`);
    
    // 批量翻译测试
    console.log('📋 测试批量文本翻译:');
    console.log('─'.repeat(50));
    const batchResults = await batchTranslateWithDoubao(testTexts);
    
    console.log('\n📊 翻译结果统计:');
    console.log('─'.repeat(50));
    console.log(`总文本数: ${testTexts.length}`);
    console.log(`成功翻译: ${Object.keys(batchResults).length}`);
    
    console.log('\n📝 完整映射结果:');
    console.log('─'.repeat(50));
    console.log(JSON.stringify(batchResults, null, 2));
    
    console.log('\n✅ 豆包API翻译测试完成！');
    console.log('🎯 结论: 豆包API可以用于中文翻译功能');
    
    return batchResults;
    
  } catch (error) {
    console.error('❌ 豆包API测试失败:', error.message);
    console.log('\n🔧 可能的问题:');
    console.log('1. API密钥无效或过期');
    console.log('2. 网络连接问题');
    console.log('3. API接口地址或参数错误');
    console.log('4. API调用频率限制');
    
    throw error;
  }
}

/**
 * 集成到现有翻译系统的示例
 */
function createDoubaoTranslator() {
  return {
    name: 'doubao',
    displayName: '豆包API',
    
    async translate(texts) {
      return await batchTranslateWithDoubao(texts);
    },
    
    // 检查API是否可用
    async checkAvailability() {
      try {
        await translateWithDoubao('测试');
        return true;
      } catch (error) {
        return false;
      }
    }
  };
}

// 如果直接运行此脚本，执行测试
if (require.main === module) {
  testDoubaoTranslation().catch(console.error);
}

module.exports = {
  translateWithDoubao,
  batchTranslateWithDoubao,
  testDoubaoTranslation,
  createDoubaoTranslator
};
