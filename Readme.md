# Collect-Code 

#### Использование: npx collect-code [директория] [имя_файла] [опции]

Аргументы:
  директория              Путь к директории проекта (по умолчанию: текущая директория)
  имя_файла               Имя выходного файла (по умолчанию: all_code.txt)

Опции:
  --extensions .js,.ts    Список расширений файлов (через запятую)
  --exclude-dirs node_modules,dist  Исключенные директории (через запятую)
  --exclude-files package-lock.json  Исключенные файлы (через запятую)
  --max-size 5            Максимальный размер файла в MB (по умолчанию: 10)
  --config config.json    Путь к файлу конфигурации
  --help, -h              Показать эту справку

Примеры:
npx  collect-code
npx  collect-code ./my-project/
npx collect-code ./src/ result.txt
npx  collect-code --extensions .js,.ts,.css
npx  collect-code --exclude-dirs node_modules,build,temp
npx  collect-code --max-size 5
npx collect-code --config my-config.json
npx  collect-code ./project/ --extensions .py,.js --exclude-dirs venv