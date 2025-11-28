# 今天吃什么 🍳

一款帮助家庭规划每日美食的 PWA 应用。

## 功能特点

- 📖 **菜谱管理** - 添加、编辑、搜索菜谱
- 🥬 **库存管理** - 记录家里的食材和保质期
- 🛒 **购物清单** - 根据菜谱自动生成购物清单
- 🎲 **今日推荐** - 根据时间和标签智能推荐菜品
- 💡 **发现新菜** - 探索新菜谱，一键添加到收藏
- 👨‍👩‍👧 **家庭共享** - 和家人共享菜谱、库存和购物清单
- 📱 **PWA 支持** - 可添加到主屏幕，离线使用

## 技术栈

- React 19 + TypeScript
- Vite + PWA
- Tailwind CSS
- Dexie.js (IndexedDB)
- Supabase (认证 + 云同步)

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 环境变量

创建 `.env.local` 文件：

```env
VITE_SUPABASE_URL=你的Supabase项目URL
VITE_SUPABASE_ANON_KEY=你的Supabase匿名Key
VITE_SUPABASE_SCHEMA=menuapp
```

## 部署

推荐使用 Vercel 部署，记得在 Vercel 中配置环境变量。
