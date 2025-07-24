# 📦 pick-cn 发布到 npm 指南

## 🎯 发布前检查清单

- ✅ 包名 `pick-cn` 在 npm 上可用
- ✅ package.json 配置完整
- ✅ dist 目录构建完成
- ✅ 所有功能测试通过

## 🚀 发布步骤

### 1. 登录 npm 账户

如果还没有 npm 账户，请先到 https://www.npmjs.com/ 注册。

```bash
npm login
```

系统会提示输入：
- **Username**: 你的 npm 用户名
- **Password**: 你的 npm 密码  
- **Email**: 你的邮箱地址
- **OTP**: 如果启用了两步验证，输入验证码

### 2. 验证登录状态

```bash
npm whoami
```

应该显示你的用户名，确认已成功登录。

### 3. 最终检查

```bash
# 检查将要发布的文件
npm pack --dry-run

# 检查包信息
npm view pick-cn
```

### 4. 发布到 npm

```bash
npm publish
```

### 5. 验证发布成功

```bash
# 查看已发布的包
npm view pick-cn

# 全局安装测试
npm install -g pick-cn

# 测试命令
pick-cn --help
```

## 📋 发布后的使用方式

用户可以通过以下方式安装和使用：

```bash
# 全局安装
npm install -g pick-cn

# 使用
pick-cn execute

# 或者使用 npx（无需安装）
npx pick-cn execute
```

## 🔄 后续版本发布

如果需要发布新版本：

1. 修改 package.json 中的 version
2. 重新构建：`npm run build`
3. 发布：`npm publish`

## 📝 版本管理建议

```bash
# 补丁版本 (1.0.0 -> 1.0.1)
npm version patch

# 小版本 (1.0.0 -> 1.1.0)  
npm version minor

# 大版本 (1.0.0 -> 2.0.0)
npm version major
```

## 🎉 发布完成后

发布成功后，你的工具将在以下地址可见：
- npm 包页面: https://www.npmjs.com/package/pick-cn
- 安装统计: https://npmjs.com/package/pick-cn

恭喜！🎉 你的中英文翻译工具现在可以供全世界的开发者使用了！
