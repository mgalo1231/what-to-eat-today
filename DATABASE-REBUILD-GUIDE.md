# 数据库重建指南

## 概述

本指南将帮助你完全重建 Supabase 数据库，解决所有数据同步和 RLS 问题。

## 前置条件

- 已有 Supabase 账号和项目
- 有 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`

## 步骤 1：清理旧数据库（可选）

如果你想在同一个 Supabase 项目中重建，执行 `drop-all-tables.sql`：

```bash
# 在 Supabase Dashboard > SQL Editor 中执行
# 复制 drop-all-tables.sql 的全部内容并运行
```

**或者**创建一个全新的 Supabase 项目。

## 步骤 2：创建新数据库结构

在 Supabase Dashboard > SQL Editor 中执行 `complete-setup.sql`：

```bash
# 复制 complete-setup.sql 的全部内容并运行
# 这将创建所有表、索引、触发器和 RLS 策略
```

### 包含的表

1. **menuapp_user_profiles** - 用户资料（用户名、邮箱、头像）
2. **households** - 家庭信息（名称、邀请码、设置）
3. **members** - 家庭成员关系
4. **recipes** - 菜谱（含收藏、查看次数等新字段）
5. **inventory** - 库存（含分类、购买日期等新字段）
6. **shopping_list** - 购物清单（含优先级、备注等新字段）
7. **chat_logs** - 聊天记录（含会话ID、上下文等新字段）

## 步骤 3：启用 Realtime

在 Supabase Dashboard > SQL Editor 中执行 `enable-realtime.sql`：

```bash
# 复制 enable-realtime.sql 的全部内容并运行
# 这将为所有业务表启用实时同步
```

## 步骤 4：更新环境变量

确保 `.env.local` 文件包含正确的配置：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SCHEMA=public
```

## 步骤 5：清理本地数据

在浏览器控制台（F12）执行 `cleanup-local-data.js` 的内容：

```javascript
// 复制 cleanup-local-data.js 的全部内容
// 粘贴到浏览器控制台并回车
// 这将清理 localStorage 和 IndexedDB
```

## 步骤 6：重启应用

```bash
# 重启开发服务器
npm run dev
```

## 步骤 7：测试

1. **注册/登录** - 创建新用户或使用现有用户登录
2. **自动创建家庭** - 系统会自动为你创建一个默认家庭
3. **添加菜谱** - 测试添加菜谱功能
4. **检查 Supabase** - 在 Supabase Table Editor 中查看 `recipes` 表是否有数据
5. **邀请家庭成员** - 在"我的"页面获取邀请码，用另一个账号加入
6. **测试实时同步** - 两个账号同时登录，测试数据是否实时同步

## 验证清单

- [ ] 所有表成功创建
- [ ] RLS 策略已启用
- [ ] Realtime 已启用
- [ ] 用户可以注册和登录
- [ ] 自动创建默认家庭
- [ ] `household_id` 不再是 `null`
- [ ] 可以添加/编辑/删除菜谱
- [ ] 菜谱数据出现在 Supabase 表中
- [ ] 家庭成员间数据实时同步
- [ ] 离线模式仍然可用

## 新增字段说明

### Recipes 表
- `is_favorite` - 是否收藏（未来可用于收藏功能）
- `view_count` - 查看次数（未来可用于热门菜谱）
- `servings` - 份量（已存在，现在更重要）

### Inventory 表
- `category` - 食材分类（如"蔬菜"、"肉类"等）
- `purchase_date` - 购买日期（帮助追踪新鲜度）

### Shopping List 表
- `priority` - 优先级（0-10，用于排序）
- `notes` - 备注（额外说明）
- `bought_at` - 购买时间（记录何时购买）

### Chat Logs 表
- `session_id` - 会话ID（用于区分不同对话）
- `context` - 上下文信息（JSONB，存储额外数据）

### Households 表
- `description` - 家庭描述（可选）
- `settings` - 家庭设置（JSONB，未来可用于偏好设置）

### Members 表
- `display_name` - 在该家庭的昵称（可选）
- `is_active` - 是否活跃（用于软删除）

## 常见问题

### Q: 为什么要重建数据库？
A: 旧数据库有 RLS 递归问题和字段不完整的问题，重建可以一次性解决所有问题。

### Q: 会丢失数据吗？
A: 如果执行 `drop-all-tables.sql`，会删除所有数据。如果需要保留，请先导出或创建新项目。

### Q: `household_id` 还是 `null` 怎么办？
A: 确保执行了 `cleanup-local-data.js`，然后重新登录。系统会自动创建家庭并设置 `household_id`。

### Q: 数据还是不同步怎么办？
A: 检查以下几点：
1. 确保执行了 `enable-realtime.sql`
2. 在浏览器控制台检查是否有 Realtime 连接成功的日志
3. 确保 `household_id` 已正确设置
4. 检查 Supabase Table Editor 中是否有数据

### Q: 如何验证 RLS 策略？
A: 在 Supabase Dashboard > Authentication > Policies 中查看每个表的策略，应该看到多个策略已启用。

## 技术细节

### RLS 策略设计
- 使用 `SECURITY DEFINER` 函数 `my_household_ids()` 避免递归
- Members 表使用子查询而非函数调用避免递归
- 所有业务表使用统一的 household_id 过滤

### 触发器
- 所有表都有自动更新 `updated_at` 的触发器
- Households 表有自动转换 `invite_code` 为小写的触发器

### 索引优化
- 所有 `household_id` 字段都有索引
- Tags 使用 GIN 索引支持快速搜索
- Title 使用全文搜索索引
- Expiry date 有条件索引（仅非空值）

## 下一步

数据库重建完成后，你可以：

1. **部署到 Vercel** - `git push` 后 Vercel 会自动部署
2. **添加更多预设菜谱** - 编辑 `src/db/client.ts` 中的 `sampleRecipes`
3. **实现收藏功能** - 使用新增的 `is_favorite` 字段
4. **添加菜谱分类** - 使用 `tags` 字段
5. **实现食材分类** - 使用新增的 `category` 字段

## 支持

如果遇到问题，请检查：
1. Supabase Dashboard > Logs 查看错误日志
2. 浏览器控制台查看前端错误
3. Network 标签页查看 API 请求/响应

---

**祝你使用愉快！** 🎉

