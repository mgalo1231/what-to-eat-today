// ========================================
// 浏览器本地数据清理脚本
// ========================================
// 在浏览器控制台（F12）执行此脚本
// 用于清理本地 localStorage 和 IndexedDB
// 在重建数据库后，需要清理本地数据以避免冲突
// ========================================

(async () => {
  console.log('🧹 开始清理本地数据...');
  
  try {
    // 1. 清理 localStorage
    const keysToRemove = [
      'current_household_id',
      'offlineMode',
      'pending_username',
      'pending_user_id'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ 已删除 localStorage.${key}`);
    });
    
    // 2. 清理 IndexedDB
    const dbName = 'kitchen-hub';
    
    // 关闭所有打开的连接
    indexedDB.databases().then(dbs => {
      dbs.forEach(db => {
        if (db.name === dbName) {
          console.log(`🔒 关闭 IndexedDB: ${db.name}`);
        }
      });
    });
    
    // 删除数据库
    const deleteRequest = indexedDB.deleteDatabase(dbName);
    
    deleteRequest.onsuccess = () => {
      console.log(`✅ 已删除 IndexedDB: ${dbName}`);
      console.log('\n🎉 清理完成！');
      console.log('📋 下一步：');
      console.log('  1. 刷新页面（F5 或 Cmd+R）');
      console.log('  2. 重新登录');
      console.log('  3. 系统会自动创建新的家庭');
    };
    
    deleteRequest.onerror = (err) => {
      console.error('❌ 删除 IndexedDB 失败:', err);
    };
    
    deleteRequest.onblocked = () => {
      console.warn('⚠️  IndexedDB 被其他标签页阻止，请关闭所有其他标签页后重试');
    };
    
  } catch (err) {
    console.error('❌ 清理过程出错:', err);
  }
})();

