const fs = require('fs-extra');
const path = require('path');

async function build() {
  console.log('🚀 开始构建 pick-cn 项目...');
  
  // 清理 dist 目录
  const distDir = path.join(__dirname, 'dist');
  await fs.remove(distDir);
  await fs.ensureDir(distDir);
  
  // 复制源代码到 dist
  console.log('📁 复制源代码...');
  await fs.copy(path.join(__dirname, 'src'), path.join(distDir, 'src'));
  await fs.copy(path.join(__dirname, 'bin'), path.join(distDir, 'bin'));
  
  // 复制配置文件
  console.log('📄 复制配置文件...');
  await fs.copy(path.join(__dirname, 'package.json'), path.join(distDir, 'package.json'));
  await fs.copy(path.join(__dirname, 'README.md'), path.join(distDir, 'README.md'));
  
  // 复制 API 配置文件
  if (await fs.pathExists(path.join(__dirname, 'api-config.json'))) {
    await fs.copy(path.join(__dirname, 'api-config.json'), path.join(distDir, 'api-config.json'));
    console.log('📄 已复制 api-config.json');
  }
  
  // 复制 API 配置示例
  if (await fs.pathExists(path.join(__dirname, 'api-config.example.json'))) {
    await fs.copy(path.join(__dirname, 'api-config.example.json'), path.join(distDir, 'api-config.example.json'));
    console.log('📄 已复制 api-config.example.json');
  }
  
  console.log('✅ 构建完成！');
  console.log(`📦 构建产物位于: ${distDir}`);
}

build().catch(console.error);
