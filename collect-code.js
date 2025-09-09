#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Конфигурация
const config = {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.json'], // Поддерживаемые расширения
    excludeDirs: ['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'coverage', '.vscode', '.idea'], // Исключенные директории
    excludeFiles: ['package-lock.json', 'yarn.lock', '.DS_Store'], // Исключенные файлы
    maxFileSize: 10 * 1024 * 1024 // Максимальный размер файла (10MB)
};

function shouldExcludeDir(dirName) {
    return config.excludeDirs.includes(dirName);
}

function shouldIncludeFile(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    return config.extensions.includes(ext) && 
           !config.excludeFiles.includes(fileName);
}

function getAllCodeFiles(dir, fileList = []) {
    try {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory() && !shouldExcludeDir(path.basename(filePath))) {
                getAllCodeFiles(filePath, fileList);
            } else if (stat.isFile() && shouldIncludeFile(file)) {
                const fileSize = stat.size;
                if (fileSize <= config.maxFileSize) {
                    fileList.push(filePath);
                } else {
                    console.log(`Пропущен большой файл: ${filePath} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
                }
            }
        });
    } catch (error) {
        console.error(`Ошибка при чтении директории ${dir}:`, error.message);
    }
    
    return fileList;
}

// Функция для чтения содержимого файла с обработкой ошибок
function readFileContent(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Ошибка чтения файла ${filePath}:`, error.message);
        return '';
    }
}

// Функция для создания заголовка файла
function createFileHeader(filePath, relativePath, fileSize) {
    const separator = '='.repeat(100);
    const fileStats = fs.statSync(filePath);
    const fileSizeKB = (fileStats.size / 1024).toFixed(2);
    
    return `\n\n${separator}\n` +
           `Файл: ${relativePath}\n` +
           `Размер: ${fileSizeKB} KB\n` +
           `Дата модификации: ${fileStats.mtime.toLocaleString()}\n` +
           `${separator}\n\n`;
}

// Функция для проверки бинарного файла
function isBinaryFile(filePath) {
    try {
        const buffer = fs.readFileSync(filePath, { encoding: null });
        for (let i = 0; i < Math.min(512, buffer.length); i++) {
            if (buffer[i] === 0) {
                return true; // Найден нулевой байт - скорее всего бинарный файл
            }
        }
        return false;
    } catch (error) {
        return true; // Если не можем прочитать - считаем бинарным
    }
}

// Основная функция
function collectCode(rootDir, outputFile = 'all_code.txt') {
    try {
        console.log(`🔍 Поиск файлов в: ${path.resolve(rootDir)}`);
        
        // Получаем все кодовые файлы
        const codeFiles = getAllCodeFiles(rootDir);
        
        if (codeFiles.length === 0) {
            console.log('❌ Кодовые файлы не найдены');
            return;
        }
        
        console.log(`✅ Найдено ${codeFiles.length} файлов. Начинаем объединение...`);
        
        // Создаем или очищаем выходной файл
        fs.writeFileSync(outputFile, '');
        
        let totalFiles = 0;
        let totalLines = 0;
        let totalSize = 0;
        const fileStats = {};
        
        // Инициализируем статистику по расширениям
        config.extensions.forEach(ext => {
            fileStats[ext] = { count: 0, lines: 0 };
        });
        
        // Обрабатываем каждый файл
        codeFiles.forEach(filePath => {
            // Проверяем, не бинарный ли файл
            if (isBinaryFile(filePath)) {
                console.log(`⚠️  Пропущен бинарный файл: ${path.relative(rootDir, filePath)}`);
                return;
            }
            
            const relativePath = path.relative(rootDir, filePath);
            const fileContent = readFileContent(filePath);
            
            if (fileContent) {
                const fileExt = path.extname(filePath).toLowerCase();
                const lines = fileContent.split('\n').length;
                
                // Создаем заголовок для файла
                const header = createFileHeader(filePath, relativePath, fileContent.length);
                
                // Записываем заголовок и содержимое файла
                fs.appendFileSync(outputFile, header);
                fs.appendFileSync(outputFile, fileContent);
                
                // Считаем статистику
                totalLines += lines;
                totalFiles++;
                totalSize += fileContent.length;
                
                // Обновляем статистику по расширениям
                if (fileStats[fileExt]) {
                    fileStats[fileExt].count++;
                    fileStats[fileExt].lines += lines;
                }
                
                console.log(`📄 Обработан: ${relativePath} (${lines} строк)`);
            }
        });
        
        // Создаем сводку
        let summary = `📊 СВОДКА ПРОЕКТА\n`;
        summary += `=`.repeat(50) + `\n`;
        summary += `📁 Всего файлов: ${totalFiles}\n`;
        summary += `📝 Всего строк: ${totalLines}\n`;
        summary += `💾 Общий размер: ${(totalSize / 1024).toFixed(2)} KB\n`;
        summary += `📅 Дата создания: ${new Date().toLocaleString()}\n`;
        summary += `📍 Исходная директория: ${path.resolve(rootDir)}\n`;
        summary += `=`.repeat(50) + `\n\n`;
        
        // Детальная статистика по расширениям
        summary += `📈 ДЕТАЛЬНАЯ СТАТИСТИКА\n`;
        summary += `-`.repeat(30) + `\n`;
        for (const [ext, stats] of Object.entries(fileStats)) {
            if (stats.count > 0) {
                summary += `${ext}: ${stats.count} файлов, ${stats.lines} строк\n`;
            }
        }
        summary += `-`.repeat(30) + `\n`;
        
        // Добавляем сводку в начало файла
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

// Функция для показа справки
function showHelp() {
    console.log(`
Использование: node collect-code.js [директория] [имя_файла]

Параметры:
  директория    - Путь к директории проекта (по умолчанию: текущая директория)
  имя_файла     - Имя выходного файла (по умолчанию: all_code.txt)

Примеры:
  node collect-code.js
  node collect-code.js ./my-project/
  node collect-code.js ./src/ result.txt
  node collect-code.js ../project/ project_code.txt
    `);
}

// Обработка аргументов командной строки
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    process.exit(0);
}

const targetDirectory = process.argv[2] || './';
const outputFile = process.argv[3] || 'all_code.txt';

// Проверяем существование директории
if (!fs.existsSync(targetDirectory)) {
    console.error(`❌ Директория не найдена: ${targetDirectory}`);
    process.exit(1);
}

if (!fs.statSync(targetDirectory).isDirectory()) {
    console.error(`❌ Указанный путь не является директорией: ${targetDirectory}`);
    process.exit(1);
}

collectCode(targetDirectory, outputFile);