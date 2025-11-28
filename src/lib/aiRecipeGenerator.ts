import type { DiscoverRecipe } from '@/data/discoverRecipes'

// 菜系和风格
const cuisines = ['川菜', '粤菜', '湘菜', '东北菜', '日式', '韩式', '西式', '江浙菜', '云南菜', '新疆菜']
const styles = ['下饭菜', '快手菜', '宴客', '低脂', '素菜', '汤', '面', '一锅端']
const difficulties = ['容易', '中等', '较难'] as const

// 食材库
const proteins = ['鸡胸肉', '猪里脊', '牛腩', '五花肉', '鸡腿', '虾仁', '鱼片', '豆腐', '鸡蛋', '排骨']
const vegetables = ['青菜', '西兰花', '胡萝卜', '土豆', '茄子', '青椒', '黄瓜', '番茄', '洋葱', '蘑菇', '豆芽', '白菜', '芹菜', '莴笋']
const seasonings = ['生抽', '老抽', '蚝油', '料酒', '醋', '糖', '盐', '鸡精', '花椒', '干辣椒', '八角', '桂皮', '姜', '蒜', '葱']

// 菜名模板
const dishTemplates = [
  { prefix: '红烧', suffix: '' },
  { prefix: '清炒', suffix: '' },
  { prefix: '蒜蓉', suffix: '' },
  { prefix: '香煎', suffix: '' },
  { prefix: '干煸', suffix: '' },
  { prefix: '酱爆', suffix: '' },
  { prefix: '糖醋', suffix: '' },
  { prefix: '麻辣', suffix: '' },
  { prefix: '葱油', suffix: '' },
  { prefix: '蚝油', suffix: '' },
  { prefix: '', suffix: '煲' },
  { prefix: '', suffix: '炖汤' },
  { prefix: '凉拌', suffix: '' },
  { prefix: '水煮', suffix: '' },
  { prefix: '爆炒', suffix: '' },
]

// 做法步骤模板
const stepTemplates = {
  prep: [
    '将{ingredient}洗净切块备用。',
    '{ingredient}切片，加少许盐和料酒腌制10分钟。',
    '将{ingredient}去皮切成均匀的块状。',
    '{ingredient}切丝，用清水浸泡去除多余淀粉。',
  ],
  cook: [
    '锅中加油烧热，放入{seasoning}爆香。',
    '下入{ingredient}大火快炒至变色。',
    '加入{seasoning}翻炒均匀，让食材充分入味。',
    '倒入适量清水，大火烧开后转小火炖煮。',
    '中火煮至汤汁浓稠，食材软烂。',
    '淋入少许{seasoning}提鲜，翻炒均匀。',
  ],
  finish: [
    '出锅前撒上葱花点缀即可。',
    '装盘，趁热享用。',
    '淋上少许香油，增加香气。',
    '撒上白芝麻装饰，完成！',
  ],
}

// 随机选择
const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const randomPicks = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// 生成菜名
const generateDishName = (): { name: string; mainIngredient: string } => {
  const template = randomPick(dishTemplates)
  const mainIngredient = randomPick([...proteins, ...vegetables])
  const name = `${template.prefix}${mainIngredient}${template.suffix}`
  return { name, mainIngredient }
}

// 生成食材列表
const generateIngredients = (mainIngredient: string) => {
  const ingredients = [
    { id: '1', name: mainIngredient, amount: Math.floor(Math.random() * 300 + 200), unit: 'g' },
  ]
  
  // 添加配菜
  const sides = randomPicks(vegetables.filter(v => v !== mainIngredient), Math.floor(Math.random() * 2 + 1))
  sides.forEach((side, idx) => {
    ingredients.push({
      id: String(idx + 2),
      name: side,
      amount: Math.floor(Math.random() * 100 + 50),
      unit: 'g',
    })
  })
  
  // 添加调料
  const usedSeasonings = randomPicks(seasonings, Math.floor(Math.random() * 4 + 3))
  usedSeasonings.forEach((s, idx) => {
    ingredients.push({
      id: String(ingredients.length + idx + 1),
      name: s,
      amount: Math.floor(Math.random() * 2 + 1),
      unit: '勺',
    })
  })
  
  return ingredients
}

// 生成步骤
const generateSteps = (ingredients: { name: string }[]) => {
  const steps = []
  const mainIngredient = ingredients[0].name
  const seasoning = ingredients.find(i => seasonings.includes(i.name))?.name || '调料'
  
  // 准备步骤
  steps.push({
    id: '1',
    text: randomPick(stepTemplates.prep).replace('{ingredient}', mainIngredient),
  })
  
  // 烹饪步骤
  const cookSteps = randomPicks(stepTemplates.cook, Math.floor(Math.random() * 2 + 2))
  cookSteps.forEach((template, idx) => {
    steps.push({
      id: String(idx + 2),
      text: template
        .replace('{ingredient}', mainIngredient)
        .replace('{seasoning}', seasoning),
    })
  })
  
  // 完成步骤
  steps.push({
    id: String(steps.length + 1),
    text: randomPick(stepTemplates.finish),
  })
  
  return steps
}

// 生成描述
const generateDescription = (name: string, cuisine: string): string => {
  const descriptions = [
    `经典${cuisine}风味，${name}鲜香可口，非常下饭。`,
    `家常版${name}，简单易做，味道不输餐厅。`,
    `${name}是一道经典的${cuisine}，色香味俱全。`,
    `这道${name}做法简单，新手也能轻松驾驭。`,
    `${cuisine}代表菜${name}，浓郁的家常味道。`,
  ]
  return randomPick(descriptions)
}

// 已生成的菜名，避免重复
const generatedNames = new Set<string>()

/**
 * 生成一道新菜谱
 */
export const generateNewRecipe = (): DiscoverRecipe => {
  let dishInfo = generateDishName()
  
  // 避免重复
  let attempts = 0
  while (generatedNames.has(dishInfo.name) && attempts < 20) {
    dishInfo = generateDishName()
    attempts++
  }
  generatedNames.add(dishInfo.name)
  
  const cuisine = randomPick(cuisines)
  const ingredients = generateIngredients(dishInfo.mainIngredient)
  const steps = generateSteps(ingredients)
  
  return {
    title: dishInfo.name,
    description: generateDescription(dishInfo.name, cuisine),
    duration: Math.floor(Math.random() * 40 + 10), // 10-50分钟
    difficulty: randomPick(difficulties),
    tags: [cuisine, ...randomPicks(styles, Math.floor(Math.random() * 2 + 1))],
    servings: Math.floor(Math.random() * 2 + 2), // 2-4人份
    ingredients,
    steps,
  }
}

/**
 * 批量生成新菜谱
 */
export const generateNewRecipes = (count: number): DiscoverRecipe[] => {
  return Array.from({ length: count }, () => generateNewRecipe())
}

/**
 * 根据标签生成菜谱
 */
export const generateRecipeByTag = (tag: string): DiscoverRecipe => {
  const recipe = generateNewRecipe()
  // 确保包含指定标签
  if (!recipe.tags.includes(tag) && tag !== '全部') {
    recipe.tags[0] = tag
  }
  return recipe
}

