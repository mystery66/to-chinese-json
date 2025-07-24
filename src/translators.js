const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');

/**
 * 翻译服务管理器
 */
class TranslationManager {
  constructor() {
    this.translators = {
      baidu: new BaiduTranslator(),
      youdao: new YoudaoTranslator(),
      google: new GoogleTranslator()
    };
    this.currentTranslator = 'baidu'; // 默认使用百度翻译
  }

  /**
   * 设置当前使用的翻译服务
   * @param {string} service - 翻译服务名称 (baidu, youdao, google)
   */
  setTranslator(service) {
    if (this.translators[service]) {
      this.currentTranslator = service;
    } else {
      throw new Error(`不支持的翻译服务: ${service}`);
    }
  }

  /**
   * 翻译文本
   * @param {string} text - 要翻译的中文文本
   * @returns {Promise<string>} 翻译结果
   */
  async translate(text) {
    const translator = this.translators[this.currentTranslator];
    return await translator.translate(text);
  }

  /**
   * 批量翻译文本
   * @param {string[]} texts - 要翻译的中文文本数组
   * @returns {Promise<Object>} 翻译结果映射
   */
  async batchTranslate(texts) {
    const results = {};
    const translator = this.translators[this.currentTranslator];
    
    // 如果是百度翻译，使用其原生批量翻译能力
    if (this.currentTranslator === 'baidu' && translator.batchTranslate) {
      const batchSize = 20; // 百度API支持一次翻译20个文本
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        console.log(`📡 正在翻译第 ${Math.floor(i/batchSize) + 1} 批，共 ${Math.ceil(texts.length/batchSize)} 批（${batch.length} 个文本）`);
        
        try {
          const translations = await translator.batchTranslate(batch);
          
          // 合并结果
          for (let j = 0; j < batch.length; j++) {
            const text = batch[j];
            const translation = translations[j];
            results[text] = translation;
            console.log(`✅ ${text} -> ${translation}`);
          }
          
        } catch (error) {
          console.warn(`⚠️  批量翻译失败: ${error.message}`);
          
          // 批量翻译失败，回退到单个翻译
          for (const text of batch) {
            try {
              const translation = await translator.translate(text);
              results[text] = translation;
              console.log(`✅ 单个翻译: ${text} -> ${translation}`);
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (singleError) {
              console.warn(`⚠️  单个翻译失败: ${text} - ${singleError.message}`);
              results[text] = null;
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        // 批次之间的延迟
        if (i + batchSize < texts.length) {
          console.log('🕰️  等待 5 秒后继续下一批...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    } else {
      // 其他翻译服务使用原有的串行处理逻辑
      const batchSize = 3;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        console.log(`📡 正在翻译第 ${Math.floor(i/batchSize) + 1} 批，共 ${Math.ceil(texts.length/batchSize)} 批（${batch.length} 个文本）`);
        
        for (const text of batch) {
          try {
            const translation = await this.translate(text);
            results[text] = translation;
            console.log(`✅ ${text} -> ${translation}`);
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.warn(`⚠️  翻译失败: ${text} - ${error.message}`);
            results[text] = null;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (i + batchSize < texts.length) {
          console.log('🕰️  等待 3 秒后继续下一批...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    return results;
  }
}

/**
 * 百度翻译 API
 */
class BaiduTranslator {
  constructor() {
    this.appId = process.env.BAIDU_TRANSLATE_APP_ID;
    this.secretKey = process.env.BAIDU_TRANSLATE_SECRET_KEY;
    this.apiUrl = 'https://fanyi-api.baidu.com/api/trans/vip/translate';
  }

  /**
   * 翻译单个文本
   * @param {string} text - 中文文本
   * @returns {Promise<string>} 英文翻译
   */
  async translate(text) {
    const results = await this.batchTranslate([text]);
    return results[0];
  }

  /**
   * 批量翻译文本（百度 API 原生支持）
   * @param {string[]} texts - 中文文本数组（最多20个）
   * @param {number} retryCount - 重试次数
   * @returns {Promise<string[]>} 英文翻译数组
   */
  async batchTranslate(texts, retryCount = 0) {
    if (!this.appId || !this.secretKey) {
      throw new Error('百度翻译API配置缺失，请设置 BAIDU_TRANSLATE_APP_ID 和 BAIDU_TRANSLATE_SECRET_KEY 环境变量');
    }

    if (texts.length > 20) {
      throw new Error('百度翻译API单次最多支持 20 个文本');
    }

    // 使用换行符分隔多个文本
    const query = texts.join('\n');
    const salt = Date.now();
    const sign = this.generateSign(query, salt);

    const params = {
      q: query,
      from: 'zh',
      to: 'en',
      appid: this.appId,
      salt: salt,
      sign: sign
    };

    try {
      const response = await axios.get(this.apiUrl, { params });
      
      if (response.data.error_code) {
        const errorMsg = response.data.error_msg;
        
        // 如果是限流错误且还有重试次数，则重试
        if (errorMsg.includes('Invalid Access Limit') && retryCount < 3) {
          const waitTime = (retryCount + 1) * 5000; // 递增等待时间：5s, 10s, 15s
          console.log(`⏳ API限流，${waitTime/1000}秒后重试第${retryCount + 1}次...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return await this.batchTranslate(texts, retryCount + 1);
        }
        
        throw new Error(`百度翻译API错误: ${errorMsg}`);
      }

      if (response.data.trans_result && response.data.trans_result.length > 0) {
        // 返回的结果数量应该与输入文本数量一致
        return response.data.trans_result.map(result => result.dst);
      }

      throw new Error('百度翻译API返回结果为空');
    } catch (error) {
      // 网络错误也可以重试
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        if (retryCount < 2) {
          const waitTime = (retryCount + 1) * 3000;
          console.log(`🔄 网络错误，${waitTime/1000}秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return await this.batchTranslate(texts, retryCount + 1);
        }
      }
      
      throw new Error(`百度翻译请求失败: ${error.message}`);
    }
  }

  /**
   * 生成百度翻译API签名
   * @param {string} query - 查询文本
   * @param {number} salt - 随机数
   * @returns {string} 签名
   */
  generateSign(query, salt) {
    const str = this.appId + query + salt + this.secretKey;
    return crypto.createHash('md5').update(str).digest('hex');
  }
}

/**
 * 有道翻译 API
 */
class YoudaoTranslator {
  constructor() {
    this.appKey = process.env.YOUDAO_TRANSLATE_APP_KEY;
    this.appSecret = process.env.YOUDAO_TRANSLATE_APP_SECRET;
    this.apiUrl = 'https://openapi.youdao.com/api';
  }

  /**
   * 翻译文本
   * @param {string} text - 中文文本
   * @returns {Promise<string>} 英文翻译
   */
  async translate(text) {
    if (!this.appKey || !this.appSecret) {
      throw new Error('有道翻译API配置缺失，请设置 YOUDAO_TRANSLATE_APP_KEY 和 YOUDAO_TRANSLATE_APP_SECRET 环境变量');
    }

    const salt = Date.now();
    const curtime = Math.round(Date.now() / 1000);
    const sign = this.generateSign(text, salt, curtime);

    const params = {
      q: text,
      from: 'zh-CHS',
      to: 'en',
      appKey: this.appKey,
      salt: salt,
      sign: sign,
      signType: 'v3',
      curtime: curtime
    };

    try {
      const response = await axios.post(this.apiUrl, querystring.stringify(params), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.errorCode !== '0') {
        throw new Error(`有道翻译API错误: ${response.data.errorCode}`);
      }

      if (response.data.translation && response.data.translation.length > 0) {
        return response.data.translation[0];
      }

      throw new Error('有道翻译API返回结果为空');
    } catch (error) {
      throw new Error(`有道翻译请求失败: ${error.message}`);
    }
  }

  /**
   * 生成有道翻译API签名
   * @param {string} query - 查询文本
   * @param {number} salt - 随机数
   * @param {number} curtime - 当前时间戳
   * @returns {string} 签名
   */
  generateSign(query, salt, curtime) {
    const input = query.length <= 20 ? query : query.substring(0, 10) + query.length + query.substring(query.length - 10);
    const str = this.appKey + input + salt + curtime + this.appSecret;
    return crypto.createHash('sha256').update(str).digest('hex');
  }
}

/**
 * Google 翻译 API
 */
class GoogleTranslator {
  constructor() {
    this.apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    this.apiUrl = 'https://translation.googleapis.com/language/translate/v2';
  }

  /**
   * 翻译文本
   * @param {string} text - 中文文本
   * @returns {Promise<string>} 英文翻译
   */
  async translate(text) {
    if (!this.apiKey) {
      throw new Error('Google翻译API配置缺失，请设置 GOOGLE_TRANSLATE_API_KEY 环境变量');
    }

    const params = {
      key: this.apiKey,
      q: text,
      source: 'zh',
      target: 'en',
      format: 'text'
    };

    try {
      const response = await axios.post(this.apiUrl, querystring.stringify(params), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.error) {
        throw new Error(`Google翻译API错误: ${response.data.error.message}`);
      }

      if (response.data.data && response.data.data.translations && response.data.data.translations.length > 0) {
        return response.data.data.translations[0].translatedText;
      }

      throw new Error('Google翻译API返回结果为空');
    } catch (error) {
      throw new Error(`Google翻译请求失败: ${error.message}`);
    }
  }
}

module.exports = {
  TranslationManager,
  BaiduTranslator,
  YoudaoTranslator,
  GoogleTranslator
};
