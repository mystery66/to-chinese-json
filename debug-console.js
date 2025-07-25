#!/usr/bin/env node

/**
 * 调试 console 过滤功能
 */

const { Project, SyntaxKind } = require('ts-morph');

// 创建简单的测试代码
const testCode = `
console.log("这是调试信息");
const message = "这是业务消息";
console.warn("这是警告信息");
`;

console.log('🔍 调试 console 过滤功能...\n');
console.log('测试代码:');
console.log(testCode);

// 创建 TypeScript 项目
const project = new Project({
  useInMemoryFileSystem: true,
  compilerOptions: {
    allowJs: true,
    jsx: 'preserve',
    target: 'ES2020',
    module: 'ESNext'
  }
});

const sourceFile = project.createSourceFile('test.ts', testCode);

console.log('\n📄 AST 节点分析:');

// 遍历所有字符串字面量节点
sourceFile.forEachDescendant((node) => {
  if (node.getKind() === SyntaxKind.StringLiteral) {
    const text = node.getLiteralValue();
    console.log(`\n找到字符串: "${text}"`);
    
    // 检查父节点链
    let current = node;
    let depth = 0;
    while (current && depth < 5) {
      const kind = current.getKind();
      const kindName = SyntaxKind[kind];
      const nodeText = current.getText();
      
      console.log(`  ${depth}: ${kindName} - "${nodeText.substring(0, 50)}${nodeText.length > 50 ? '...' : ''}"`);
      
      // 检查是否包含 console
      if (/\bconsole\s*\./.test(nodeText)) {
        console.log(`    ✅ 发现 console 调用!`);
      }
      
      current = current.getParent();
      depth++;
    }
  }
});
