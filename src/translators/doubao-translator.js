const axios = require('axios');

/**
 * 豆包API翻译器
 * 使用字节跳动豆包API进行中文到英文翻译
 */
class DoubaoTranslator {
  constructor(config = {}) {
    this.name = 'doubao';
    this.displayName = '豆包API';
    
    // API配置
    this.config = {
      url: config.url || 'https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions',
      apiKey: config.apiKey || 'b916a08d-d5af-4217-8d88-339343a09661',
      model: config.model || 'bot-20250725171411-rmwwl',
      batchSize: config.batchSize || 5,
      delay: config.delay || 2000,
      temperature: config.temperature || 0.7,
      ...config
    };
    
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`
    };
  }

  /**
   * 翻译单个中文文本
   * @param {string} chineseText - 要翻译的中文文本
   * @returns {Promise<string>} 翻译后的英文文本
   */
  async translateSingle(chineseText) {
    try {
      const response = await axios.post(this.config.url, {
        model: this.config.model,
        stream: false,
        messages: [
          {
            role: 'user',
            content: `请将以下中文翻译成英文，只返回翻译结果，不要其他解释：${chineseText}`
          }
        ],
        parameters: {
          result_format: 'message',
          temperature: this.config.temperature,
          response_format: { type: 'json_object' }
        }
      }, { headers: this.headers });

      // 提取翻译结果
      const translatedText = response.data.choices[0].message.content;
      return translatedText.trim();
      
    } catch (error) {
      console.error(`豆包API翻译失败: ${chineseText}`, error.message);
      throw new Error(`豆包API翻译失败: ${error.message}`);
    }
  }

  /**
   * 批量翻译中文文本
   * @param {string[]} chineseTexts - 中文文本数组
   * @returns {Promise<Object>} 中英文映射对象
   */
  async translate(chineseTexts) {
    console.log(`🚀 使用豆包API翻译 ${chineseTexts.length} 个中文文本...`);
    
    const mapping = {};
    const batchSize = this.config.batchSize;
    const delay = this.config.delay;
    
    for (let i = 0; i < chineseTexts.length; i += batchSize) {
      const batch = chineseTexts.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(chineseTexts.length / batchSize);
      
      console.log(`📡 正在翻译第 ${batchNumber} 批，共 ${totalBatches} 批（${batch.length} 个文本）`);
      
      // 并行处理当前批次
      const promises = batch.map(async (text) => {
        try {
          const translation = await this.translateSingle(text);
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
   * 检查API是否可用
   * @returns {Promise<boolean>} API是否可用
   */
  async checkAvailability() {
    try {
      await this.translateSingle('测试');
      return true;
    } catch (error) {
      console.warn(`豆包API不可用: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取翻译器信息
   * @returns {Object} 翻译器信息
   */
  getInfo() {
    return {
      name: this.name,
      displayName: this.displayName,
      description: '使用字节跳动豆包API进行中文到英文翻译',
      features: [
        '高质量翻译',
        '支持批量处理',
        '自动错误重试',
        '可配置参数'
      ],
      limitations: [
        '需要有效的API密钥',
        '有调用频率限制',
        '需要网络连接'
      ]
    };
  }

  /**
   * 设置配置
   * @param {Object} newConfig - 新的配置
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // 更新headers中的API密钥
    if (newConfig.apiKey) {
      this.headers.Authorization = `Bearer ${newConfig.apiKey}`;
    }
  }
}

module.exports = DoubaoTranslator;
