const ts = require('typescript');
const fs = require('fs-extra');
const path = require('path');

/**
 * 基于 TypeScript AST 的中文文本提取器
 * 提供比正则表达式更精准的语法分析和文本提取能力
 */
class ASTChineseExtractor {
  constructor() {
    this.chineseTexts = new Set();
    this.options = {
      // 是否提取注释中的中文
      extractFromComments: false,
      // 是否提取 console.log 中的中文
      extractFromConsole: false,
      // 是否提取 JSX 文本中的中文
      extractFromJSX: true,
      // 是否提取枚举值中的中文
      extractFromEnumValues: true,
      // 是否提取枚举键中的中文
      extractFromEnumKeys: false
    };
  }

  /**
   * 设置提取选项
   * @param {Object} options - 提取选项
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
  }

  /**
   * 从文件中提取中文文本
   * @param {string} filePath - 文件路径
   * @returns {Promise<string[]>} 中文文本数组
   */
  async extractFromFile(filePath) {
    try {
      const sourceCode = await fs.readFile(filePath, 'utf-8');
      const fileExtension = path.extname(filePath);
      
      // 根据文件扩展名确定语言版本
      const scriptKind = this.getScriptKind(fileExtension);
      
      // 创建 TypeScript 源文件
      const sourceFile = ts.createSourceFile(
        filePath,
        sourceCode,
        ts.ScriptTarget.Latest,
        true,
        scriptKind
      );

      // 重置提取结果
      this.chineseTexts.clear();

      // 遍历 AST 并提取中文
      this.visitNode(sourceFile);

      return Array.from(this.chineseTexts);
    } catch (error) {
      console.warn(`⚠️  AST 解析文件失败: ${filePath}`, error.message);
      return [];
    }
  }

  /**
   * 根据文件扩展名获取脚本类型
   * @param {string} extension - 文件扩展名
   * @returns {number} TypeScript ScriptKind
   */
  getScriptKind(extension) {
    switch (extension.toLowerCase()) {
      case '.ts':
        return ts.ScriptKind.TS;
      case '.tsx':
        return ts.ScriptKind.TSX;
      case '.jsx':
        return ts.ScriptKind.JSX;
      case '.js':
      default:
        return ts.ScriptKind.JS;
    }
  }

  /**
   * 递归访问 AST 节点
   * @param {ts.Node} node - AST 节点
   */
  visitNode(node) {
    // 根据节点类型进行不同的处理
    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral:
        this.handleStringLiteral(node);
        break;
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        this.handleTemplateLiteral(node);
        break;
      case ts.SyntaxKind.TemplateExpression:
        this.handleTemplateExpression(node);
        break;
      case ts.SyntaxKind.JsxText:
        this.handleJSXText(node);
        break;
      case ts.SyntaxKind.EnumDeclaration:
        this.handleEnumDeclaration(node);
        break;
      case ts.SyntaxKind.CallExpression:
        this.handleCallExpression(node);
        break;
      case ts.SyntaxKind.SingleLineCommentTrivia:
      case ts.SyntaxKind.MultiLineCommentTrivia:
        this.handleComment(node);
        break;
    }

    // 递归访问子节点
    ts.forEachChild(node, child => this.visitNode(child));
  }

  /**
   * 处理字符串字面量
   * @param {ts.StringLiteral} node - 字符串字面量节点
   */
  handleStringLiteral(node) {
    const text = node.text;
    if (this.containsChinese(text)) {
      const cleanedSegments = this.cleanChineseText(text);
      cleanedSegments.forEach(segment => {
        if (this.isValidChineseText(segment)) {
          this.chineseTexts.add(segment);
        }
      });
    }
  }

  /**
   * 处理模板字面量（无替换）
   * @param {ts.NoSubstitutionTemplateLiteral} node - 模板字面量节点
   */
  handleTemplateLiteral(node) {
    const text = node.text;
    if (this.containsChinese(text)) {
      const cleanedSegments = this.cleanChineseText(text);
      cleanedSegments.forEach(segment => {
        if (this.isValidChineseText(segment)) {
          this.chineseTexts.add(segment);
        }
      });
    }
  }

  /**
   * 处理模板表达式（包含替换）
   * @param {ts.TemplateExpression} node - 模板表达式节点
   */
  handleTemplateExpression(node) {
    // 处理模板头部
    if (node.head && this.containsChinese(node.head.text)) {
      const cleanedSegments = this.cleanChineseText(node.head.text);
      cleanedSegments.forEach(segment => {
        if (this.isValidChineseText(segment)) {
          this.chineseTexts.add(segment);
        }
      });
    }

    // 处理模板片段
    if (node.templateSpans) {
      node.templateSpans.forEach(span => {
        if (span.literal && this.containsChinese(span.literal.text)) {
          const cleanedSegments = this.cleanChineseText(span.literal.text);
          cleanedSegments.forEach(segment => {
            if (this.isValidChineseText(segment)) {
              this.chineseTexts.add(segment);
            }
          });
        }
      });
    }
  }

  /**
   * 处理 JSX 文本
   * @param {ts.JsxText} node - JSX 文本节点
   */
  handleJSXText(node) {
    if (!this.options.extractFromJSX) return;

    const text = node.text;
    if (this.containsChinese(text)) {
      const cleanedSegments = this.cleanChineseText(text);
      cleanedSegments.forEach(segment => {
        if (this.isValidChineseText(segment)) {
          this.chineseTexts.add(segment);
        }
      });
    }
  }

  /**
   * 处理枚举声明
   * @param {ts.EnumDeclaration} node - 枚举声明节点
   */
  handleEnumDeclaration(node) {
    if (!node.members) return;

    node.members.forEach(member => {
      // 处理枚举键（如果启用）
      if (this.options.extractFromEnumKeys && member.name && ts.isIdentifier(member.name)) {
        const keyName = member.name.text;
        if (this.containsChinese(keyName)) {
          const cleanedSegments = this.cleanChineseText(keyName);
          cleanedSegments.forEach(segment => {
            if (this.isValidChineseText(segment)) {
              this.chineseTexts.add(segment);
            }
          });
        }
      }

      // 处理枚举值
      if (this.options.extractFromEnumValues && member.initializer) {
        if (ts.isStringLiteral(member.initializer)) {
          const value = member.initializer.text;
          if (this.containsChinese(value)) {
            const cleanedSegments = this.cleanChineseText(value);
            cleanedSegments.forEach(segment => {
              if (this.isValidChineseText(segment)) {
                this.chineseTexts.add(segment);
              }
            });
          }
        }
      }
    });
  }

  /**
   * 处理函数调用表达式
   * @param {ts.CallExpression} node - 函数调用表达式节点
   */
  handleCallExpression(node) {
    // 检查是否为 console 方法调用
    if (!this.options.extractFromConsole && this.isConsoleCall(node)) {
      return; // 跳过 console 调用
    }

    // 继续处理参数中的字符串
    // 这里会通过递归访问自动处理参数中的字符串字面量
  }

  /**
   * 处理注释
   * @param {ts.Node} node - 注释节点
   */
  handleComment(node) {
    if (!this.options.extractFromComments) return;

    // 注释处理逻辑（如果需要的话）
    // TypeScript AST 默认不包含注释信息，需要特殊处理
  }

  /**
   * 检查是否为 console 方法调用
   * @param {ts.CallExpression} node - 函数调用表达式节点
   * @returns {boolean} 是否为 console 调用
   */
  isConsoleCall(node) {
    if (ts.isPropertyAccessExpression(node.expression)) {
      const object = node.expression.expression;
      const property = node.expression.name;
      
      if (ts.isIdentifier(object) && object.text === 'console') {
        const consoleMethods = ['log', 'warn', 'error', 'info', 'debug', 'trace', 'table', 'dir', 'group', 'groupEnd'];
        return consoleMethods.includes(property.text);
      }
    }
    return false;
  }

  /**
   * 检查文本是否包含中文
   * @param {string} text - 待检查的文本
   * @returns {boolean} 是否包含中文
   */
  containsChinese(text) {
    return /[\u4e00-\u9fff]/.test(text);
  }

  /**
   * 清理中文文本，移除标点符号并分割
   * @param {string} text - 原始文本
   * @returns {string[]} 清理后的中文片段数组
   */
  cleanChineseText(text) {
    if (!text) return [];
    
    // 移除 emoji 和特殊符号
    let cleanedText = text
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, ' ')
      .replace(/[✅❌⏭️🔍📂📁📄🌐📡📝✨🚀⚠️💡🎯📊🛠️]/g, ' ')
      .replace(/[►▶️⭐🎉🔧📈📉💻🖥️📱⌚]/g, ' ')
      .replace(/[!@#$%^&*()_+\-=\[\]{}|;':",./<>?`~]/g, ' ');

    // 移除首尾的中文标点符号
    cleanedText = cleanedText.replace(/^[，。？！；：、·""''（）【】《》〈〉「」『』…——－〔〕〖〗｛｝［］]+/, '');
    cleanedText = cleanedText.replace(/[，。？！；：、·""''（）【】《》〈〉「」『』…——－〔〕〖〗｛｝［］]+$/, '');
    
    if (!cleanedText || !/[\u4e00-\u9fff]/.test(cleanedText)) {
      return [];
    }
    
    // 按中文标点符号分割
    const chinesePunctuationRegex = /[，。？！；：、·""''（）【】《》〈〉「」『』…——－〔〕〖〗｛｝［］]+/g;
    const segments = cleanedText.split(chinesePunctuationRegex);
    
    // 清理每个片段
    const cleanedSegments = segments
      .map(segment => segment.trim())
      .filter(segment => segment && /[\u4e00-\u9fff]/.test(segment))
      .map(segment => {
        return segment
          .replace(/[a-zA-Z0-9\s]+/g, '')
          .replace(/[\u0000-\u007F]+/g, '')
          .replace(/^[，。？！；：、·""''（）【】《》〈〉「」『』…——－〔〕〖〗｛｝［］]+/, '')
          .replace(/[，。？！；：、·""''（）【】《》〈〉「」『』…——－〔〕〖〗｛｝［］]+$/, '')
          .trim();
      })
      .filter(segment => {
        return segment && 
               segment.length > 0 && 
               /[\u4e00-\u9fff]/.test(segment) &&
               segment.length <= 20 &&
               !/^[，。？！；：、·""''（）【】《》〈〉「」『』…——－〔〕〖〗｛｝［］]/.test(segment) &&
               !/[，。？！；：、·""''（）【】《》〈〉「」『』…——－〔〕〖〗｛｝［］]$/.test(segment);
      });
    
    return cleanedSegments;
  }

  /**
   * 验证是否为有效的中文文本
   * @param {string} text - 待检查的文本
   * @returns {boolean} 是否为有效的中文文本
   */
  isValidChineseText(text) {
    if (!text || !this.containsChinese(text)) {
      return false;
    }
    
    if (!text.trim() || text.length > 20) {
      return false;
    }
    
    // 过滤代码相关内容
    const codePatterns = [
      /[{}[\]();]/,
      /\\n|\\t/,
      /^\s*\/\//,
      /interface|class|function|const|let|var|export|import/i,
      /\w+\s*:\s*\w+/,
    ];
    
    for (const pattern of codePatterns) {
      if (pattern.test(text)) {
        return false;
      }
    }
    
    if (/^[\d\s.,，。]+$/.test(text)) {
      return false;
    }
    
    if (/^[\s\p{P}]+$/u.test(text)) {
      return false;
    }
    
    const chineseCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishCount = (text.match(/[a-zA-Z]/g) || []).length;
    if (englishCount > chineseCount) {
      return false;
    }
    
    return true;
  }

  /**
   * 批量处理多个文件
   * @param {string[]} filePaths - 文件路径数组
   * @returns {Promise<string[]>} 所有中文文本数组
   */
  async extractFromFiles(filePaths) {
    const allTexts = new Set();
    
    for (const filePath of filePaths) {
      const texts = await this.extractFromFile(filePath);
      texts.forEach(text => allTexts.add(text));
    }
    
    return Array.from(allTexts);
  }
}

module.exports = {
  ASTChineseExtractor
};
