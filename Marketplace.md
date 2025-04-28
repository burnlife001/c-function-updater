# VSCode 扩展发布指南

## 发布准备

1. 更新版本
   - 在 `package.json` 中更新 `version` 字段
   - 更新 CHANGELOG.md（如果有）记录变更内容

2. 本地测试
   - 确保所有功能正常运行
   - 使用 `F5` 在开发主机中测试扩展

## 打包步骤

1. 打包工具使用

   方法一：使用 npx（推荐）
   ```bash
   npx @vscode/vsce package
   ```

   方法二：全局安装
   ```bash
   npm install -g --force @vscode/vsce
   vsce package  # 仅在 Windows CMD/PowerShell 中有效
   ```

   注意：在 Windows Git Bash 中始终使用 npx 方式：
   ```bash
   npx @vscode/vsce package
   ```

2. 打包结果
   将生成 `.vsix` 文件，如：`c-function-updater-1.0.1.vsix`

## 发布步骤

1. 获取访问令牌
   - 访问 https://dev.azure.com
   - 创建 Personal Access Token (PAT)
   - 确保有 "Marketplace (Publish)" 权限

2. 登录发布
   ```bash
   # Windows Git Bash
   npx @vscode/vsce login Beyond2025
   npx @vscode/vsce publish
   ```
   或指定版本类型：
   ```bash
   npx @vscode/vsce publish patch/minor/major
   ```

## 验证发布

1. 检查 Marketplace
   - 访问 https://marketplace.visualstudio.com/
   - 搜索 "c-function-updater"
   - 确认版本号已更新

2. 验证安装
   - 在其他机器的 VSCode 中搜索安装
   - 测试核心功能是否正常

## 注意事项

- 发布前确保所有改动已提交到 Git
- 确保 `README.md` 文档清晰完整
- 确保扩展图标和截图等资源文件存在
- 保存好 PAT 令牌以便后续更新使用
- 推荐使用 npx 方式运行 vsce 命令，这样不需要全局安装且更可靠