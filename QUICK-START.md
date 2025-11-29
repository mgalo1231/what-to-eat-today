# 🚀 快速开始：数据库重建

## 执行步骤（按顺序）

### 1️⃣ 在 Supabase SQL Editor 执行

#### 步骤 A：清理旧表
```sql
-- 复制 drop-all-tables.sql 的全部内容
-- 粘贴到 Supabase SQL Editor
-- 点击 "Run" 执行
```

#### 步骤 B：创建新表
```sql
-- 复制 complete-setup.sql 的全部内容
-- 粘贴到 Supabase SQL Editor
-- 点击 "Run" 执行
```

#### 步骤 C：启用 Realtime
```sql
-- 复制 enable-realtime.sql 的全部内容
-- 粘贴到 Supabase SQL Editor
-- 点击 "Run" 执行
```

### 2️⃣ 在浏览器控制台执行

打开你的应用（http://localhost:5176），按 F12 打开控制台：

```javascript
// 复制 cleanup-local-data.js 的全部内容
// 粘贴到控制台
// 按回车执行
```

### 3️⃣ 刷新页面并重新登录

```
1. 按 F5 刷新页面
2. 重新登录
3. 系统会自动创建默认家庭
```

### 4️⃣ 验证

- ✅ 添加一个测试菜谱
- ✅ 在 Supabase Table Editor 查看 `recipes` 表是否有数据
- ✅ 用另一个账号加入家庭测试同步

## 完成！🎉

现在你的数据库已经完全重建，所有功能应该正常工作了。

---

**详细文档**: 查看 `DATABASE-REBUILD-GUIDE.md` 了解更多信息。

