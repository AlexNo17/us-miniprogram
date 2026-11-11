# 我们俩 · 恋爱记录微信小程序

一个零依赖、可直接用微信开发者工具打开的原生微信小程序 MVP。

## 已实现

- 设置双方昵称、恋爱日期和每年重复的纪念日
- 首页展示恋爱天数、纪念日倒计时和最近动态
- 回忆：分类、图片、筛选、详情和编辑；图片保存在本机
- 共同计划：分类、新增、编辑、筛选和完成；电影或地点计划完成后可创建关联回忆
- 关于我们：成员头像和称呼、归属记录与关系统计，本地缓存持久化

## 本地运行

1. 安装并打开微信开发者工具。
2. 选择“导入项目”，目录选择本仓库根目录。
3. 没有 AppID 时选择测试号；正式发布时在开发者工具中配置自己的 AppID。
4. 点击编译即可预览。

## 目录

```text
├── app.js / app.json / app.wxss
├── pages/
│   ├── home/       首页
│   ├── timeline/   时光
│   ├── plans/      计划
│   └── us/         我们
└── utils/store.js  本地数据层
```

## 下一步

- 配置双人身份、服务端权限验证和私有图片存储
- 使用云端数据层替换本地缓存，支持同步与并发编辑冲突提示
- 补齐图片云端上传、备份及失败重试

云端接入正在测试：资料、文字、计划及照片的云端读写已接入，但真实手机、未授权账号和照片访问尚未完成完整验证。旧记录保留在本机，可手动复制；不要清理小程序数据或依赖测试版保存唯一一份重要资料。当前仅供单人测试，不支持另一位用户访问第一人的私有图片。

## 基础校验

安装 Node.js 后，依次运行 `node tests/store.test.js`、`node tests/cloud.test.js`、`node tests/cloud-records.test.js`、`node tests/plans-cloud.test.js`、`node tests/moments-cloud.test.js`、`node tests/us-cloud.test.js`、`node tests/images-cloud.test.js` 和 `node tests/migration.test.js`。云端部署准备见 [CLOUD_SETUP.md](CLOUD_SETUP.md)。

