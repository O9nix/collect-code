const fs = require('fs');
const path = require('path');

// Функция для рекурсивного поиска файлов
function getAllJsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Рекурсивно обходим подкаталоги
            getAllJsFiles(filePath, fileList);
        } else if (path.extname(file).toLowerCase() === '.js') {
            // Добавляем только JS файлы
            fileList.push(filePath);
        }
    });
    
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
function createFileHeader(filePath, relativePath) {
    const separator = '='.repeat(80);
    return `\n\n${separator}\nФайл: ${relativePath}\n${separator}\n\n`;
}

// Основная функция
function collectJsCode(rootDir, outputFile = 'all_js_code.txt') {
    try {
        // Получаем все JS файлы
        const jsFiles = getAllJsFiles(rootDir);
        
        if (jsFiles.length === 0) {
            console.log('JS файлы не найдены');
            return;
        }
        
        // Создаем или очищаем выходной файл
        fs.writeFileSync(outputFile, '');
        
        console.log(`Найдено ${jsFiles.length} JS файлов. Начинаем объединение...`);
        
        let totalFiles = 0;
        let totalLines = 0;
        
        // Обрабатываем каждый файл
        jsFiles.forEach(filePath => {
            const relativePath = path.relative(rootDir, filePath);
            const fileContent = readFileContent(filePath);
            
            if (fileContent) {
                // Создаем заголовок для файла
                const header = createFileHeader(filePath, relativePath);
                
                // Записываем заголовок и содержимое файла
                fs.appendFileSync(outputFile, header);
                fs.appendFileSync(outputFile, fileContent);
                
                // Считаем статистику
                const lines = fileContent.split('\n').length;
                totalLines += lines;
                totalFiles++;
                
                console.log(`Обработан: ${relativePath} (${lines} строк)`);
            }
        });
        
        // Добавляем сводку в начало файла
        const summary = `Сводка:\n- Всего файлов: ${totalFiles}\n- Всего строк: ${totalLines}\n${'='.repeat(80)}\n`;
        const existingContent = fs.readFileSync(outputFile, 'utf8');
        fs.writeFileSync(outputFile, summary + existingContent);
        
        console.log(`\nГотово! Результат сохранен в: ${outputFile}`);
        console.log(`Обработано файлов: ${totalFiles}`);
        console.log(`Всего строк кода: ${totalLines}`);
        
    } catch (error) {
        console.error('Ошибка при выполнении:', error.message);
    }
}

// Использование
const targetDirectory = process.argv[2] || './'; // Текущая директория по умолчанию
const outputFile = process.argv[3] || 'all_js_code.txt'; // Имя выходного файла по умолчанию

console.log(`Поиск JS файлов в: ${path.resolve(targetDirectory)}`);
collectJsCode(targetDirectory, outputFile);