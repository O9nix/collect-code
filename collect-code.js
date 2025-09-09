#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Базовая конфигурация по умолчанию
const defaultConfig = {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.json'],
    excludeDirs: ['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'coverage', '.vscode', '.idea'],
    excludeFiles: ['package-lock.json', 'yarn.lock', '.DS_Store'],
    maxFileSize: 10 * 1024 * 1024 // 10MB
};

// Загрузка конфигурации из файла
function loadConfigFromFile(configPath) {
    try {
        if (fs.existsSync(configPath)) {
            const configFile = fs.readFileSync(configPath, 'utf8');
            const userConfig = JSON.parse(configFile);
            return { ...defaultConfig, ...userConfig };
        }
    } catch (error) {
        console.error(`⚠️  Ошибка загрузки конфигурации из ${configPath}:`, error.message);
    }
    return defaultConfig;
}

// Парсинг аргументов командной строки для конфигурации
function parseConfigArgs(args) {
    const config = { ...defaultConfig };
    const positionalArgs = [];
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--extensions' && i + 1 < args.length) {
            config.extensions = args[i + 1].split(',').map(ext => {
                const trimmed = ext.trim();
                return trimmed.startsWith('.') ? trimmed.toLowerCase() : '.' + trimmed.toLowerCase();
            });
            i++;
        } else if (arg === '--exclude-dirs' && i + 1 < args.length) {
            config.excludeDirs = args[i + 1].split(',').map(dir => dir.trim());
            i++;
        } else if (arg === '--exclude-files' && i + 1 < args.length) {
            config.excludeFiles = args[i + 1].split(',').map(file => file.trim());
            i++;
        } else if (arg === '--max-size' && i + 1 < args.length) {
            const size = parseFloat(args[i + 1]);
            if (!isNaN(size)) {
                config.maxFileSize = size * 1024 * 1024; // Конвертируем из MB в bytes
            }
            i++;
        } else if (arg === '--config' && i + 1 < args.length) {
            // Пропускаем аргумент --config
            i++;
        } else if (!arg.startsWith('--')) {
            // Позиционные аргументы
            positionalArgs.push(arg);
        }
    }
    
    return { config, positionalArgs };
}

function shouldExcludeDir(dirName, excludeDirs) {
    return excludeDirs.includes(dirName);
}

function shouldIncludeFile(fileName, extensions, excludeFiles) {
    const ext = path.extname(fileName).toLowerCase();
    return extensions.includes(ext) && !excludeFiles.includes(fileName);
}

function getAllCodeFiles(dir, config, fileList = []) {
    try {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory() && !shouldExcludeDir(path.basename(filePath), config.excludeDirs)) {
                getAllCodeFiles(filePath, config, fileList);
            } else if (stat.isFile() && shouldIncludeFile(file, config.extensions, config.excludeFiles)) {
                const fileSize = stat.size;
                if (fileSize <= config.maxFileSize) {
                    fileList.push(filePath);
                } else {
                    console.log(`⚠️  Пропущен большой файл: ${filePath} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
                }
            }
        });
    } catch (error) {
        console.error(`❌ Ошибка при чтении директории ${dir}:`, error.message);
    }
    
    return fileList;
}

function readFileContent(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`❌ Ошибка чтения файла ${filePath}:`, error.message);
        return '';
    }
}

function createFileHeader(filePath, relativePath) {
    const separator = '='.repeat(100);
    const fileStats = fs.statSync(filePath);
    const fileSizeKB = (fileStats.size / 1024).toFixed(2);
    
    return `\n\n${separator}\n` +
           `📄 Файл: ${relativePath}\n` +
           `📊 Размер: ${fileSizeKB} KB\n` +
           `📅 Дата модификации: ${fileStats.mtime.toLocaleString()}\n` +
           `${separator}\n\n`;
}

function isBinaryFile(filePath) {
    try {
        const buffer = fs.readFileSync(filePath, { encoding: null });
        for (let i = 0; i < Math.min(512, buffer.length); i++) {
            if (buffer[i] === 0) {
                return true;
            }
        }
        return false;
    } catch (error) {
        return true;
    }
}

function collectCode(rootDir, outputFile = 'all_code.txt', config) {
    try {
        console.log(`🔍 Поиск файлов в: ${path.resolve(rootDir)}`);
        console.log(`⚙️  Расширения: ${config.extensions.join(', ')}`);
        console.log(`🚫 Исключенные директории: ${config.excludeDirs.join(', ')}`);
        
        const codeFiles = getAllCodeFiles(rootDir, config);
        
        if (codeFiles.length === 0) {
            console.log('❌ Кодовые файлы не найдены');
            return;
        }
        
        console.log(`✅ Найдено ${codeFiles.length} файлов. Начинаем объединение...`);
        
        fs.writeFileSync(outputFile, '');
        
        let totalFiles = 0;
        let totalLines = 0;
        let totalSize = 0;
        const fileStats = {};
        
        config.extensions.forEach(ext => {
            fileStats[ext] = { count: 0, lines: 0 };
        });
        
        codeFiles.forEach(filePath => {
            if (isBinaryFile(filePath)) {
                const relativePath = path.relative(rootDir, filePath);
                console.log(`⚠️  Пропущен бинарный файл: ${relativePath}`);
                return;
            }
            
            const relativePath = path.relative(rootDir, filePath);
            const fileContent = readFileContent(filePath);
            
            if (fileContent) {
                const fileExt = path.extname(filePath).toLowerCase();
                const lines = fileContent.split('\n').length;
                
                const header = createFileHeader(filePath, relativePath);
                
                fs.appendFileSync(outputFile, header);
                fs.appendFileSync(outputFile, fileContent);
                
                totalLines += lines;
                totalFiles++;
                totalSize += fileContent.length;
                
                if (fileStats[fileExt]) {
                    fileStats[fileExt].count++;
                    fileStats[fileExt].lines += lines;
                }
                
                console.log(`📄 ${relativePath} (${lines} строк)`);
            }
        });
        
        let summary = `📊 СВОДКА ПРОЕКТА\n`;
        summary += `=`.repeat(50) + `\n`;
        summary += `📁 Всего файлов: ${totalFiles}\n`;
        summary += `📝 Всего строк: ${totalLines}\n`;
        summary += `💾 Общий размер: ${(totalSize / 1024).toFixed(2)} KB\n`;
        summary += `📅 Дата создания: ${new Date().toLocaleString()}\n`;
        summary += `📍 Исходная директория: ${path.resolve(rootDir)}\n`;
        summary += `=`.repeat(50) + `\n\n`;
        
        summary += `⚙️  КОНФИГУРАЦИЯ\n`;
        summary += `-`.repeat(30) + `\n`;
        summary += `Расширения: ${config.extensions.join(', ')}\n`;
        summary += `Исключенные директории: ${config.excludeDirs.join(', ')}\n`;
        summary += `Исключенные файлы: ${config.excludeFiles.join(', ')}\n`;
        summary += `Макс. размер файла: ${(config.maxFileSize / 1024 / 1024).toFixed(2)} MB\n`;
        summary += `-`.repeat(30) + `\n\n`;
        
        summary += `📈 ДЕТАЛЬНАЯ СТАТИСТИКА\n`;
        summary += `-`.repeat(30) + `\n`;
        for (const [ext, stats] of Object.entries(fileStats)) {
            if (stats.count > 0) {
                summary += `${ext}: ${stats.count} файлов, ${stats.lines} строк\n`;
            }
        }
        summary += `-`.repeat(30) + `\n`;
        
        const existingContent = fs.readFileSync(outputFile, 'utf8');
        fs.writeFileSync(outputFile, summary + existingContent);
        
        console.log(`\n✅ Готово! Результат сохранен в: ${outputFile}`);
        console.log(`📊 Обработано файлов: ${totalFiles}`);
        console.log(`📝 Всего строк кода: ${totalLines}`);
        console.log(`💾 Размер выходного файла: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);
        
    } catch (error) {
        console.error('❌ Ошибка при выполнении:', error.message);
    }
}

function showHelp() {
    console.log(`
🛠️  СБОРЩИК КОДА ПРОЕКТА

Использование: collect-code [директория] [имя_файла] [опции]

Аргументы:
  директория              Путь к директории проекта (по умолчанию: текущая директория)
  имя_файла               Имя выходного файла (по умолчанию: all_code.txt)

Опции:
  --extensions ext1,ext2  Список расширений файлов (через запятую)
  --exclude-dirs dir1,dir2  Исключенные директории (через запятую)
  --exclude-files file1,file2  Исключенные файлы (через запятую)
  --max-size number       Максимальный размер файла в MB (по умолчанию: 10)
  --config file.json      Путь к файлу конфигурации
  --help, -h              Показать эту справку

Примеры:
  collect-code
  collect-code ./my-project/
  collect-code ./src/ result.txt
  collect-code --extensions .js,.ts,.css
  collect-code --exclude-dirs node_modules,build,temp
  collect-code --max-size 5
  collect-code --config my-config.json
  collect-code ./project/ --extensions .py,.js --exclude-dirs venv
    `);
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        process.exit(0);
    }
    
    // Загрузка конфигурации
    let config = { ...defaultConfig };
    let configPath = './collect-code-config.json';
    
    // Проверяем наличие --config аргумента
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--config' && i + 1 < args.length) {
            configPath = args[i + 1];
            break;
        }
    }
    
    // Загружаем конфигурацию из файла если он существует
    const fileConfig = loadConfigFromFile(configPath);
    config = { ...config, ...fileConfig };
    
    // Переопределяем конфигурацию аргументами командной строки
    const { config: cliConfig, positionalArgs } = parseConfigArgs(args);
    config = { ...config, ...cliConfig };
    
    // Извлекаем позиционные аргументы
    let targetDirectory = './';
    let outputFile = 'all_code.txt';
    
    if (positionalArgs.length > 0) {
        targetDirectory = positionalArgs[0];
    }
    if (positionalArgs.length > 1) {
        outputFile = positionalArgs[1];
    }
    
    console.log(`📂 Целевая директория: ${targetDirectory}`);
    console.log(`📄 Выходной файл: ${outputFile}`);
    
    if (!fs.existsSync(targetDirectory)) {
        console.error(`❌ Директория не найдена: ${targetDirectory}`);
        process.exit(1);
    }
    
    if (!fs.statSync(targetDirectory).isDirectory()) {
        console.error(`❌ Указанный путь не является директорией: ${targetDirectory}`);
        process.exit(1);
    }
    
    collectCode(targetDirectory, outputFile, config);
}

main();