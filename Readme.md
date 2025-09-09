```markdown
# 🛠️ Collect Code CLI

A simple **Node.js CLI tool** for collecting, merging, and analyzing all code files in a project into a single text file.  
This is especially useful for code reviews, AI-assisted code analysis, documentation, or just getting a quick overview of a project.

---

## ✨ Features

- 🔍 Recursively scans project directories for code files  
- ⚙️ Supports multiple file extensions (`.js`, `.ts`, `.html`, `.css`, etc.)  
- 🚫 Skips unwanted directories (`node_modules`, `dist`, `.git`, etc.)  
- 🗑️ Skips unwanted files (`package-lock.json`, `.DS_Store`, etc.)  
- 📏 File size limit (default: `10 MB`)  
- 📊 Collects statistics (total files, lines of code, per-extension breakdown)  
- 📄 Generates a single combined file (`all_code.txt` by default) with headers and metadata  
- 🛠️ Configurable via **CLI arguments** or a **JSON config file**

---

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/your-username/collect-code.git
cd collect-code

# Install globally
npm install -g
```

This makes the `collect-code` command available globally.

---

## 🚀 Usage

```bash
collect-code [directory] [output_file] [options]
```

### Arguments

- `directory` → Path to the project directory (default: current directory)  
- `output_file` → Name of the output file (default: `all_code.txt`)  

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--extensions ext1,ext2` | File extensions to include | `--extensions .js,.ts,.css` |
| `--exclude-dirs dir1,dir2` | Directories to exclude | `--exclude-dirs node_modules,dist` |
| `--exclude-files file1,file2` | Files to exclude | `--exclude-files package-lock.json,.DS_Store` |
| `--max-size number` | Max file size in MB (default: 10) | `--max-size 5` |
| `--config file.json` | Path to config file | `--config my-config.json` |
| `--show-config` | Show current config | `--show-config` |
| `--help`, `-h` | Show help | `collect-code -h` |

---

## 📖 Examples

```bash
# Run with defaults
collect-code

# Show current config
collect-code --show-config

# Collect code from ./my-project/ into all_code.txt
collect-code ./my-project/

# Collect code from ./src/ into result.txt
collect-code ./src/ result.txt

# Include only JS, TS, and CSS files
collect-code --extensions .js,.ts,.css

# Exclude directories
collect-code --exclude-dirs node_modules,build,temp

# Limit file size to 5MB
collect-code --max-size 5

# Use a config file
collect-code --config my-config.json
```

---

## 📊 Example Output

- `all_code.txt` contains:
  - 📄 File headers (file name, size, last modified date)  
  - ✍️ File contents  
  - 📈 Summary with total files, lines, size, and per-extension stats  

---

## ✅ Why Use This?

- Share your project’s code easily with others in one file  
- Feed your project into an **AI assistant** without missing files  
- Get quick insights into **code size and structure**  
- Useful for **audits, reviews, and backups**  

---

## 📜 License

MIT License © 2025  
Free to use, modify, and distribute.

---
```

Would you like me to also add a **demo screenshot/gif** section (showing the tool running in terminal), so the README feels more engaging?