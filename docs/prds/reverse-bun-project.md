# embedder-cli文件目录还原和bun打包验证
 当前的embedder-cli逆向出来的minified JS bundle 的字符串字面量中扫描出来的原始路径在docs/specs/reverse-engineering.md的"## 4. 原始源码目录结构 (172 个文件)"章节。
 ```
src/
├── index.tsx                          # 应用入口
├── main.ts                            # 主函数
│
├── pages/                             # 页面 (React/Ink 组件)
│   ├── Main.tsx                       # 主聊天页面
│   ├── Authentication.tsx             # 登录认证
│   ├── Welcome.tsx                    # 欢迎页
│   ├── ChipSelector.tsx               # 芯片选择器
│   ├── ModelSelector.tsx              # AI 模型选择
│   ├── PeripheralSelector.tsx         # 外设选择器
...
```
1. 请参考该目录结构进行目录级的逆向还原，确保所有172个文件逆向还原到src/目录
2. 配置src/package.json和bun的工程文件，完成bun的编译和dev指令验证
3. 根目录准备一个makefile支持make dev/make build指令，并验证指令正确性