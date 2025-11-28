// ========================================
// 强制同步本地数据到 Supabase
// ========================================
// 在浏览器控制台执行这段代码，将本地 IndexedDB 的数据强制上传到 Supabase
// ========================================

(async () => {
  console.log('🚀 开始强制同步...');

  // 1. 获取 Supabase 客户端
  const { supabase } = await import('/src/lib/supabase.ts');
  if (!supabase) {
    console.error('❌ Supabase 未配置');
    return;
  }

  // 2. 获取当前 household_id
  const householdId = localStorage.getItem('current_household_id');
  console.log('📦 当前 household_id:', householdId);

  if (!householdId || householdId === 'local-family') {
    console.error('❌ 没有有效的 household_id，请先登录并加入/创建家庭');
    return;
  }

  // 3. 打开 IndexedDB
  const dbRequest = indexedDB.open('kitchen-hub');
  
  dbRequest.onsuccess = async (e) => {
    const db = e.target.result;
    console.log('✅ IndexedDB 已打开');

    // 4. 读取本地菜谱
    const tx = db.transaction(['recipes'], 'readonly');
    const store = tx.objectStore('recipes');
    const recipesRequest = store.getAll();

    recipesRequest.onsuccess = async () => {
      const recipes = recipesRequest.result.filter(r => r.householdId === householdId);
      console.log(`📚 找到 ${recipes.length} 条本地菜谱`);

      if (recipes.length === 0) {
        console.log('✅ 没有需要同步的菜谱');
        return;
      }

      // 5. 上传到 Supabase
      let successCount = 0;
      let failCount = 0;

      for (const recipe of recipes) {
        try {
          const { error } = await supabase
            .from('recipes')
            .upsert({
              id: recipe.id,
              household_id: recipe.householdId,
              title: recipe.title,
              description: recipe.description,
              duration: recipe.duration,
              difficulty: recipe.difficulty,
              tags: recipe.tags,
              content: {
                ingredients: recipe.ingredients,
                steps: recipe.steps,
              },
              created_at: recipe.createdAt,
              updated_at: recipe.updatedAt,
            }, {
              onConflict: 'id'
            });

          if (error) {
            console.error(`❌ 上传失败: ${recipe.title}`, error);
            failCount++;
          } else {
            console.log(`✅ 上传成功: ${recipe.title}`);
            successCount++;
          }
        } catch (err) {
          console.error(`❌ 上传异常: ${recipe.title}`, err);
          failCount++;
        }
      }

      console.log(`\n📊 同步完成！成功: ${successCount}, 失败: ${failCount}`);
      
      if (failCount > 0) {
        console.log('\n💡 如果有失败，请检查：');
        console.log('1. Supabase RLS 策略是否正确');
        console.log('2. 表结构是否匹配');
        console.log('3. household_id 是否有效');
      }
    };

    recipesRequest.onerror = (err) => {
      console.error('❌ 读取本地数据失败', err);
    };
  };

  dbRequest.onerror = (err) => {
    console.error('❌ 打开 IndexedDB 失败', err);
  };
})();

