# Chinese to English Translation Tool

一个命令行工具，用于从代码中提取中文文本并生成中英文映射的 JSON 文件，支持多种第三方翻译 API。

## 功能特点

- 🔍 **智能提取**：自动扫描 TypeScript/JavaScript 文件中的中文文本
- 🎯 **精准过滤**：支持 TypeScript 枚举定义中的中文提取，排除枚举使用处
- 🌐 **多种翻译服务**：支持百度翻译、有道翻译、Google 翻译 API
- 📦 **批量处理**：高效的批量翻译处理
- 🔄 **智能回退**：API 不可用时自动使用内置词典或占位符

## 安装

```bash
# 克隆项目
git clone <repository-url>
cd to-chinese-json

# 安装依赖
npm install

# 全局链接
yarn link
```

## 使用方法

### 基本用法

```bash
# 在当前目录执行
chinese-to-english execute

# 指定源目录
chinese-to-english execute -s /path/to/your/project

# 指定输出目录和文件名
chinese-to-english execute -s /path/to/source -t /path/to/output -o MyTranslation.json
```

### 使用第三方翻译 API

#### 1. 创建 API 配置文件

复制示例配置文件并填入你的 API 密钥：

```bash
cp api-config.example.json api-config.json
```

编辑 `api-config.json`：

```json
{
  "baidu": {
    "appId": "your_baidu_app_id",
    "secretKey": "your_baidu_secret_key"
  },
  "youdao": {
    "appKey": "your_youdao_app_key",
    "appSecret": "your_youdao_app_secret"
  },
  "google": {
    "apiKey": "your_google_api_key"
  }
}
```

#### 2. 使用指定的翻译服务

```bash
# 使用百度翻译（默认）
chinese-to-english execute --translator baidu --api-config api-config.json

# 使用有道翻译
chinese-to-english execute --translator youdao --api-config api-config.json

# 使用 Google 翻译
chinese-to-english execute --translator google --api-config api-config.json
```

## 翻译 API 申请指南

### 百度翻译 API

1. 访问 [百度翻译开放平台](https://fanyi-api.baidu.com/)
2. 注册账号并创建应用
3. 获取 `APP ID` 和 `密钥`
4. 每月免费额度：200万字符

### 有道翻译 API

1. 访问 [有道智云](https://ai.youdao.com/)
2. 注册账号并创建应用
3. 获取 `应用ID` 和 `应用密钥`
4. 每月免费额度：100万字符

### Google 翻译 API

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目并启用 Translation API
3. 创建 API 密钥
4. 按使用量付费

## 命令行参数

| 参数 | 简写 | 描述 | 默认值 |
|------|------|------|--------|
| `--source` | `-s` | 源代码目录路径 | 当前目录 |
| `--target` | `-t` | 输出目录路径 | 源目录 |
| `--output` | `-o` | 输出文件名 | `Chinese-To-English.json` |
| `--translator` | - | 翻译服务 (baidu/youdao/google) | `baidu` |
| `--api-config` | - | API 配置文件路径 | - |

## 输出格式

生成的 JSON 文件格式如下：

```json
{
  "总次数": "Total Count",
  "平均值": "Average",
  "订单数量": "Order Count",
  "用户名称": "User Name"
}
```

## 支持的文件类型

- `.js` - JavaScript 文件
- `.jsx` - React JSX 文件
- `.ts` - TypeScript 文件
- `.tsx` - TypeScript JSX 文件
- `.vue` - Vue 单文件组件

## 提取规则

1. **TypeScript 枚举定义**：提取枚举中的中文 key
   ```typescript
   enum Status {
     '已完成' = 'COMPLETED',
     '进行中' = 'IN_PROGRESS'
   }
   ```

2. **字符串字面量**：提取引号中的中文文本
   ```javascript
   const message = '操作成功';
   const title = "用户管理";
   ```

3. **排除枚举使用**：跳过枚举使用处
   ```javascript
   // 这些不会被提取
   key: Status.已完成
   value: AggregatorType.总次数
   ```

## 注意事项

- 请妥善保管 API 密钥，不要提交到版本控制系统
- 注意各翻译服务的使用限制和费用
- 建议在配置文件中只填写你需要使用的翻译服务
- 工具会自动过滤无效文本和代码片段

## 许可证

MIT