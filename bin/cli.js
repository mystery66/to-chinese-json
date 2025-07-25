#!/usr/bin/env node

const { Command } = require('commander');
const { execute } = require('../src/index');
const packageJson = require('../package.json');

const program = new Command();

program
  .name('chinese-to-english')
  .description('A command line tool to translate Chinese text to English and generate JSON mapping files')
  .version(packageJson.version);

program
  .command('execute')
  .alias('exec')
  .description('Execute the Chinese to English translation process')
  .option('-s, --source <path>', 'Source directory path (default: current directory)', process.cwd())
  .option('-t, --target <path>', 'Target directory path for JSON output')
  .option('-o, --output <filename>', 'Output JSON filename', 'Chinese-To-English.json')
  .option('--translator <service>', 'Translation service to use (baidu, youdao, google)', 'baidu')
  .option('--api-config <path>', 'API configuration file path (optional, auto-lookup for api-config.json in project directory)')
  .action(async (options) => {
    console.log('🚀 开始执行中文转英文翻译...');
    await execute(options);
  });

program.parse();
