# 实时同步调试指南

## 问题排查步骤

### 1. 检查浏览器控制台

打开浏览器开发者工具（F12），查看 Console 标签，应该能看到：

#### 初始化日志
```
Setting up realtime sync for household: [household-id]
Recipes channel status: SUBSCRIBED
Inventory channel status: SUBSCRIBED
Shopping channel status: SUBSCRIBED
Chat channel status: SUBSCRIBED
```

**如果看到 `CHANNEL_ERROR` 或 `TIMED_OUT`：**
- 检查网络连接
- 检查 Supabase 配置是否正确
- 确认 Realtime 已在 Supabase 中启用

#### 数据写入日志
当你在设备 A 上添加/修改数据时，应该看到：
```
Failed to sync recipe to Supabase: [错误信息]  // 如果有错误
```

**如果有错误：**
- 检查 RLS 策略是否正确
- 检查数据格式是否正确
- 检查网络连接

#### 实时同步日志
当设备 B 收到更新时，应该看到：
```
🔔 Recipes Realtime event: INSERT [数据]
✅ Recipe synced to local DB: [recipe-id]
```

**如果没有看到这些日志：**
- Realtime 订阅可能没有建立
- 数据可能没有写入 Supabase
- 检查 Supabase Dashboard → Table Editor，确认数据是否真的在数据库中

### 2. 检查 Supabase 数据

1. 打开 Supabase Dashboard → Table Editor
2. 查看 `recipes`、`inventory`、`shopping_list` 表
3. 确认：
   - 数据是否真的写入了数据库
   - `household_id` 是否正确
   - 两个设备是否使用相同的 `household_id`

### 3. 检查 Realtime 状态

执行以下 SQL 查询：
```sql
SELECT 
  schemaname as schema_name,
  tablename as table_name
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;
```

应该看到：
- `public.recipes`
- `public.inventory`
- `public.shopping_list`
- `public.chat_logs`

### 4. 测试步骤

1. **准备两个设备**
   - 设备 A：登录账号 A，加入家庭
   - 设备 B：登录账号 B，加入同一个家庭

2. **打开浏览器控制台**
   - 两个设备都打开 F12 → Console

3. **在设备 A 上操作**
   - 添加一个菜谱
   - 查看控制台，应该看到：
     - `Failed to sync recipe to Supabase: ...`（如果有错误）
     - 或者没有错误（说明写入成功）

4. **在设备 B 上观察**
   - 应该立即看到（无需刷新）：
     - `🔔 Recipes Realtime event: INSERT ...`
     - `✅ Recipe synced to local DB: ...`
   - 页面应该自动更新显示新菜谱

### 5. 常见问题

#### 问题 1：没有看到 Realtime 事件日志
**可能原因：**
- Realtime 订阅没有建立（检查 channel status）
- 数据没有写入 Supabase（检查错误日志）
- 两个设备不在同一个家庭（检查 household_id）

**解决方法：**
- 检查控制台的 channel status 是否为 `SUBSCRIBED`
- 检查是否有数据写入错误
- 确认两个设备都加入了同一个家庭

#### 问题 2：看到错误日志
**可能原因：**
- RLS 策略问题
- 数据格式问题
- 网络问题

**解决方法：**
- 查看具体错误信息
- 检查 Supabase Dashboard → Authentication → Policies
- 确认数据格式正确

#### 问题 3：数据写入了但 Realtime 没触发
**可能原因：**
- Realtime 没有正确启用
- 订阅的 filter 不正确

**解决方法：**
- 确认 Realtime 已启用（执行 check-realtime-status.sql）
- 检查 filter 中的 `household_id` 是否正确

## 需要帮助？

如果以上步骤都无法解决问题，请提供：
1. 浏览器控制台的完整日志（特别是错误信息）
2. Supabase Dashboard 中 Table Editor 的截图
3. 两个设备的 household_id 是否相同

