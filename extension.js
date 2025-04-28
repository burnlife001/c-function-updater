const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

// 改进后的正则表达式模式
const GLOBAL_FUNC_PATTERN = /^(?!\s*static\s)(?!\s*(?:if|while|switch)\s*)(?!.*\bmain\s*\()(void|int|char|float|double|long|short|unsigned|signed|bool|[\w\s\*]+)\s+(\w+)\s*\(([^\)]*)\)\s*\{(?![^{]*;)/gm;
const STATIC_FUNC_PATTERN = /^\s*static\s+([\w\s\*]+)\s+(\w+)\s*\(([^\)]*)\)\s*\{/gm;

// 检查是否为静态函数
function isStaticFunction(line) {
    return line.trim().startsWith('static');
}

function activate(context) {
    // 注册C2H_Functions_Update命令
    let c2hUpdate = vscode.commands.registerCommand('c2h.updateFunctions', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const filePath = editor.document.fileName;
        let cFilePath, hFilePath;
        
        if (filePath.endsWith('.c')) {
            cFilePath = filePath;
            hFilePath = filePath.replace(/\.c$/, '.h');
        } else if (filePath.endsWith('.h')) {
            hFilePath = filePath;
            cFilePath = filePath.replace(/\.h$/, '.c');
            if (!fs.existsSync(cFilePath)) {
                vscode.window.showErrorMessage('未找到对应的C文件');
                return;
            }
        } else {
            vscode.window.showErrorMessage('请在C或H文件中执行此操作');
            return;
        }

        try {
            const cContent = fs.readFileSync(cFilePath, 'utf8');
            
            // 获取全局函数信息
            const functions = [];
            let match;
            const lines = cContent.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (isStaticFunction(line)) continue;
                
                const match = GLOBAL_FUNC_PATTERN.exec(line);
                if (match) {
                    functions.push({
                        returnType: match[1].trim(),
                        name: match[2],
                        params: match[3]
                    });
                }
            }

            // 生成头文件内容
            const headerContent = generateHeaderContent(functions, path.basename(hFilePath));

            // 写入头文件
            fs.writeFileSync(hFilePath, headerContent);
            vscode.window.showInformationMessage(`成功更新头文件: ${path.basename(hFilePath)}`);
        } catch (error) {
            vscode.window.showErrorMessage(`更新失败: ${error.message}`);
        }
    });

    // 注册C2C_Static_Update命令
    let c2cUpdate = vscode.commands.registerCommand('c2c.updateStatic', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const filePath = editor.document.fileName;
        if (!filePath.endsWith('.c')) {
            vscode.window.showErrorMessage('请在C文件中执行此操作');
            return;
        }

        try {
            const cContent = fs.readFileSync(filePath, 'utf8');
            
            // 获取静态函数信息
            const staticFuncs = [];
            let match;
            while ((match = STATIC_FUNC_PATTERN.exec(cContent)) !== null) {
                staticFuncs.push({
                    returnType: match[1].trim(),
                    name: match[2],
                    params: match[3]
                });
            }

            // 生成静态函数声明
            const declarations = generateStaticDeclarations(staticFuncs);

            // 查找第一个函数体位置
            const firstFuncPos = cContent.indexOf('{');
            if (firstFuncPos === -1) {
                vscode.window.showErrorMessage('未找到函数定义');
                return;
            }
            
            // 确保在函数体之前插入声明
            const insertPos = cContent.lastIndexOf('\n', firstFuncPos) + 1;

            // 插入声明
            const newContent = insertDeclarations(cContent, insertPos, declarations);
            fs.writeFileSync(filePath, newContent);
            vscode.window.showInformationMessage('成功更新静态函数声明');
        } catch (error) {
            vscode.window.showErrorMessage(`更新失败: ${error.message}`);
        }
    });

    context.subscriptions.push(c2hUpdate, c2cUpdate);
}

// 生成头文件内容
function generateHeaderContent(functions, fileName) {
    const guard = `__${fileName.replace(/\./g, '_').toUpperCase()}__`;
    let content = `#ifndef ${guard}\n#define ${guard}\n\n`;

    functions.forEach(func => {
        content += `${func.returnType} ${func.name}(${func.params});\n`;
    });

    content += `\n#endif // ${guard}\n`;
    return content;
}

// 生成静态函数声明
function generateStaticDeclarations(functions) {
    const config = vscode.workspace.getConfiguration();
    const separatorBefore = config.get('c2c.declarationSeparatorBefore', '// *****************************************');
    const separatorAfter = config.get('c2c.declarationSeparatorAfter', '// *****************************************');
    
    let declarations = `\n${separatorBefore}\n`;
    functions.forEach(func => {
        declarations += `static ${func.returnType} ${func.name}(${func.params});\n`;
    });
    declarations += `${separatorAfter}\n`;
    return declarations;
}

// 插入声明到指定位置
function insertDeclarations(content, position, declarations) {
    return content.slice(0, position) + declarations + content.slice(position);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
