# qncjtheme

- 文档目录: <https://github.com/qncj/qncjtheme/tree/master/doc>
- github使用文档: <https://github.com/qncj/qncjtheme/blob/master/doc/github.md>
- 项目说明文档: <https://github.com/qncj/qncjtheme/blob/master/doc/project.md>
- javascript基础库及规范文档: <https://github.com/qncj/qncjtheme/blob/master/doc/javascript.md>
- css基础库及规范文档: <https://github.com/qncj/qncjtheme/blob/master/doc/style.md>
- less基础库及规范文档: <https://github.com/qncj/qncjtheme/blob/master/doc/less.md>
- 页面列表文档: <https://github.com/qncj/qncjtheme/blob/master/doc/pages.md>

# 基础库说明
```bash
--css
 |
 +--common.css # 公共样式库, 禁止修改, 请直接修改less库, 不会写less就按css的写法写不会有错
 |
 +--common.less # 公共样式库less版本, 禁止添加方法, 可以添加类
 |
 +--base.less # 基础less库, 只提供颜色定义及一些实用mixin, 可增加方法, 禁止添加类
```
```bash
--js
 |
 +--common.js # 公共js库, 可按需修改, 规范见javascript规范文档
 |
 +--jquery/.*.js # 第三方jquery相关库(v3.5开始使用)
  |
 +--zepto/.*.js # 第三方zepto相关库(v3.5以后已经废弃)
```