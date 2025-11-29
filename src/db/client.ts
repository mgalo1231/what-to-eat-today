import Dexie, { type Table } from 'dexie'

import type {
  ChatLog,
  InventoryItem,
  Recipe,
  ShoppingListItem,
} from '../types/entities'
import { createId } from '../lib/createId'
import { addDays, nowIso } from '../lib/date'

let CURRENT_HOUSEHOLD_ID = 'local-family'
export const getHouseholdId = () => CURRENT_HOUSEHOLD_ID
export const setHouseholdId = (id: string) => {
  CURRENT_HOUSEHOLD_ID = id || 'local-family'
}

class KitchenDB extends Dexie {
  recipes!: Table<Recipe, string>
  inventory!: Table<InventoryItem, string>
  shoppingList!: Table<ShoppingListItem, string>
  chatLogs!: Table<ChatLog, string>

  constructor() {
    super('kitchen-hub')
    this.version(1).stores({
      recipes: '&id, householdId, title, tags, duration',
      inventory: '&id, householdId, name, location, expiryDate',
      shoppingList: '&id, householdId, isBought, sourceRecipeId',
      chatLogs: '&id, householdId, recipeId',
    })
  }
}

export const db = new KitchenDB()

const baseTimestamp = nowIso()

const sampleRecipes: Recipe[] = [
  // ========== 快手菜 ==========
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '番茄炒蛋',
    description: '最经典的家常菜，酸甜可口，5 分钟搞定。',
    duration: 10,
    difficulty: '简单',
    tags: ['快手菜', '下饭菜'],
    servings: 2,
    ingredients: [
      { id: createId(), name: '鸡蛋', amount: 3, unit: '个' },
      { id: createId(), name: '番茄', amount: 2, unit: '个' },
      { id: createId(), name: '葱花', amount: 1, unit: '勺' },
      { id: createId(), name: '盐', amount: 0.5, unit: '勺' },
      { id: createId(), name: '糖', amount: 0.5, unit: '勺' },
    ],
    steps: [
      { id: createId(), text: '番茄切块，鸡蛋打散加少许盐。' },
      { id: createId(), text: '热锅凉油，倒入蛋液炒至凝固盛出。' },
      { id: createId(), text: '锅中加少许油，放入番茄翻炒出汁。' },
      { id: createId(), text: '加入炒好的鸡蛋，调入盐和糖，撒葱花出锅。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '蒜蓉炒青菜',
    description: '清爽解腻，任何绿叶菜都适用。',
    duration: 8,
    difficulty: '简单',
    tags: ['快手菜', '素菜'],
    servings: 2,
    ingredients: [
      { id: createId(), name: '青菜', amount: 300, unit: 'g' },
      { id: createId(), name: '大蒜', amount: 4, unit: '瓣' },
      { id: createId(), name: '盐', amount: 0.5, unit: '勺' },
      { id: createId(), name: '油', amount: 1, unit: '勺' },
    ],
    steps: [
      { id: createId(), text: '青菜洗净沥干，大蒜切末。' },
      { id: createId(), text: '热锅下油，爆香蒜末。' },
      { id: createId(), text: '下青菜大火快炒，加盐调味即可。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '醋溜土豆丝',
    description: '酸脆爽口的经典下饭菜。',
    duration: 15,
    difficulty: '简单',
    tags: ['快手菜', '下饭菜', '素菜'],
    servings: 2,
    ingredients: [
      { id: createId(), name: '土豆', amount: 2, unit: '个' },
      { id: createId(), name: '干辣椒', amount: 3, unit: '个' },
      { id: createId(), name: '蒜末', amount: 1, unit: '勺' },
      { id: createId(), name: '白醋', amount: 2, unit: '勺' },
      { id: createId(), name: '盐', amount: 0.5, unit: '勺' },
    ],
    steps: [
      { id: createId(), text: '土豆去皮切丝，泡水洗去淀粉，沥干。' },
      { id: createId(), text: '热锅下油，爆香干辣椒和蒜末。' },
      { id: createId(), text: '下土豆丝大火快炒 2 分钟。' },
      { id: createId(), text: '淋入白醋，加盐翻炒均匀出锅。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },

  // ========== 下饭菜 ==========
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '红烧肉',
    description: '肥而不腻、入口即化的经典硬菜。',
    duration: 90,
    difficulty: '中等',
    tags: ['下饭菜', '宴客'],
    servings: 4,
    ingredients: [
      { id: createId(), name: '五花肉', amount: 500, unit: 'g' },
      { id: createId(), name: '冰糖', amount: 30, unit: 'g' },
      { id: createId(), name: '生抽', amount: 2, unit: '勺' },
      { id: createId(), name: '老抽', amount: 1, unit: '勺' },
      { id: createId(), name: '料酒', amount: 2, unit: '勺' },
      { id: createId(), name: '姜片', amount: 5, unit: '片' },
      { id: createId(), name: '八角', amount: 2, unit: '个' },
      { id: createId(), name: '桂皮', amount: 1, unit: '小块' },
    ],
    steps: [
      { id: createId(), text: '五花肉切块，冷水下锅焯水去血沫，捞出洗净。' },
      { id: createId(), text: '锅中放少许油，小火炒化冰糖至焦糖色。' },
      { id: createId(), text: '放入肉块翻炒上色，加入姜片、八角、桂皮。' },
      { id: createId(), text: '加生抽、老抽、料酒，倒入没过肉的热水。' },
      { id: createId(), text: '大火烧开后转小火炖 1 小时，大火收汁即可。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '鱼香肉丝',
    description: '川菜经典，酸甜微辣，超级下饭。',
    duration: 20,
    difficulty: '中等',
    tags: ['下饭菜', '快手菜'],
    servings: 2,
    ingredients: [
      { id: createId(), name: '猪里脊', amount: 200, unit: 'g' },
      { id: createId(), name: '木耳', amount: 50, unit: 'g' },
      { id: createId(), name: '胡萝卜', amount: 1, unit: '根' },
      { id: createId(), name: '青椒', amount: 1, unit: '个' },
      { id: createId(), name: '郫县豆瓣酱', amount: 1, unit: '勺' },
      { id: createId(), name: '蒜末', amount: 1, unit: '勺' },
      { id: createId(), name: '姜末', amount: 1, unit: '勺' },
      { id: createId(), name: '醋', amount: 1, unit: '勺' },
      { id: createId(), name: '糖', amount: 1, unit: '勺' },
      { id: createId(), name: '生抽', amount: 1, unit: '勺' },
    ],
    steps: [
      { id: createId(), text: '里脊切丝，加料酒、淀粉腌制 10 分钟。' },
      { id: createId(), text: '木耳泡发切丝，胡萝卜、青椒切丝。' },
      { id: createId(), text: '调鱼香汁：醋、糖、生抽、少许水淀粉混合。' },
      { id: createId(), text: '热锅下油，滑炒肉丝盛出。' },
      { id: createId(), text: '锅中爆香豆瓣酱、姜蒜末，下配菜翻炒。' },
      { id: createId(), text: '倒入肉丝和鱼香汁，快速翻炒均匀出锅。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '宫保鸡丁',
    description: '鸡肉嫩滑，花生酥脆，甜辣开胃。',
    duration: 20,
    difficulty: '中等',
    tags: ['下饭菜', '快手菜'],
    servings: 2,
    ingredients: [
      { id: createId(), name: '鸡胸肉', amount: 250, unit: 'g' },
      { id: createId(), name: '花生米', amount: 50, unit: 'g' },
      { id: createId(), name: '干辣椒', amount: 6, unit: '个' },
      { id: createId(), name: '花椒', amount: 1, unit: '勺' },
      { id: createId(), name: '葱段', amount: 2, unit: '根' },
      { id: createId(), name: '蒜末', amount: 1, unit: '勺' },
      { id: createId(), name: '生抽', amount: 1, unit: '勺' },
      { id: createId(), name: '醋', amount: 1, unit: '勺' },
      { id: createId(), name: '糖', amount: 1, unit: '勺' },
    ],
    steps: [
      { id: createId(), text: '鸡胸肉切丁，加料酒、淀粉腌制。' },
      { id: createId(), text: '花生米炸至酥脆备用。' },
      { id: createId(), text: '调宫保汁：生抽、醋、糖、少许水淀粉。' },
      { id: createId(), text: '热锅下油，爆香花椒、干辣椒（花椒可捞出）。' },
      { id: createId(), text: '下鸡丁滑炒变色，加葱蒜翻炒。' },
      { id: createId(), text: '倒入宫保汁，加花生米快速翻炒出锅。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '麻婆豆腐',
    description: '麻辣鲜香，豆腐嫩滑，米饭杀手。',
    duration: 15,
    difficulty: '简单',
    tags: ['下饭菜', '快手菜'],
    servings: 2,
    ingredients: [
      { id: createId(), name: '嫩豆腐', amount: 1, unit: '块' },
      { id: createId(), name: '猪肉末', amount: 100, unit: 'g' },
      { id: createId(), name: '郫县豆瓣酱', amount: 1, unit: '勺' },
      { id: createId(), name: '花椒粉', amount: 0.5, unit: '勺' },
      { id: createId(), name: '蒜末', amount: 1, unit: '勺' },
      { id: createId(), name: '葱花', amount: 1, unit: '勺' },
      { id: createId(), name: '生抽', amount: 0.5, unit: '勺' },
    ],
    steps: [
      { id: createId(), text: '豆腐切小块，用盐水浸泡 5 分钟。' },
      { id: createId(), text: '热锅下油，炒散肉末。' },
      { id: createId(), text: '加入豆瓣酱炒出红油，放蒜末。' },
      { id: createId(), text: '加入豆腐和少许水，小火煮 3 分钟。' },
      { id: createId(), text: '加生抽调味，水淀粉勾芡，撒花椒粉和葱花。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },

  // ========== 汤 ==========
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '番茄蛋花汤',
    description: '酸甜开胃，营养快手汤。',
    duration: 10,
    difficulty: '简单',
    tags: ['汤', '快手菜'],
    servings: 2,
    ingredients: [
      { id: createId(), name: '番茄', amount: 2, unit: '个' },
      { id: createId(), name: '鸡蛋', amount: 2, unit: '个' },
      { id: createId(), name: '葱花', amount: 1, unit: '勺' },
      { id: createId(), name: '盐', amount: 0.5, unit: '勺' },
      { id: createId(), name: '香油', amount: 0.5, unit: '勺' },
    ],
    steps: [
      { id: createId(), text: '番茄切块，鸡蛋打散。' },
      { id: createId(), text: '锅中加水烧开，放入番茄煮 3 分钟。' },
      { id: createId(), text: '淋入蛋液，轻轻搅动形成蛋花。' },
      { id: createId(), text: '加盐调味，淋香油，撒葱花出锅。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '紫菜蛋花汤',
    description: '简单快手，鲜美可口。',
    duration: 5,
    difficulty: '简单',
    tags: ['汤', '快手菜'],
    servings: 2,
    ingredients: [
      { id: createId(), name: '紫菜', amount: 1, unit: '小把' },
      { id: createId(), name: '鸡蛋', amount: 1, unit: '个' },
      { id: createId(), name: '虾皮', amount: 1, unit: '勺' },
      { id: createId(), name: '盐', amount: 0.3, unit: '勺' },
      { id: createId(), name: '香油', amount: 0.5, unit: '勺' },
    ],
    steps: [
      { id: createId(), text: '紫菜撕碎，鸡蛋打散。' },
      { id: createId(), text: '锅中水烧开，放入紫菜和虾皮。' },
      { id: createId(), text: '淋入蛋液，加盐和香油即可。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '冬瓜排骨汤',
    description: '清淡滋补，夏天消暑必备。',
    duration: 60,
    difficulty: '简单',
    tags: ['汤'],
    servings: 4,
    ingredients: [
      { id: createId(), name: '排骨', amount: 400, unit: 'g' },
      { id: createId(), name: '冬瓜', amount: 500, unit: 'g' },
      { id: createId(), name: '姜片', amount: 3, unit: '片' },
      { id: createId(), name: '枸杞', amount: 1, unit: '勺' },
      { id: createId(), name: '盐', amount: 1, unit: '勺' },
    ],
    steps: [
      { id: createId(), text: '排骨焯水去血沫，洗净备用。' },
      { id: createId(), text: '冬瓜去皮切块。' },
      { id: createId(), text: '排骨、姜片加水大火烧开，转小火炖 40 分钟。' },
      { id: createId(), text: '加入冬瓜继续炖 15 分钟，加盐和枸杞调味。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },

  // ========== 面食 ==========
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '葱油拌面',
    description: '简单却惊艳，葱香四溢。',
    duration: 15,
    difficulty: '简单',
    tags: ['面', '快手菜'],
    servings: 1,
    ingredients: [
      { id: createId(), name: '面条', amount: 150, unit: 'g' },
      { id: createId(), name: '小葱', amount: 4, unit: '根' },
      { id: createId(), name: '生抽', amount: 2, unit: '勺' },
      { id: createId(), name: '老抽', amount: 0.5, unit: '勺' },
      { id: createId(), name: '糖', amount: 0.5, unit: '勺' },
      { id: createId(), name: '油', amount: 3, unit: '勺' },
    ],
    steps: [
      { id: createId(), text: '小葱切段，分葱白和葱绿。' },
      { id: createId(), text: '锅中加油，小火慢炸葱段至焦黄捞出。' },
      { id: createId(), text: '葱油中加生抽、老抽、糖调成酱汁。' },
      { id: createId(), text: '面条煮熟捞出，淋上葱油酱汁拌匀。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '西红柿鸡蛋面',
    description: '汤鲜面滑，温暖治愈。',
    duration: 15,
    difficulty: '简单',
    tags: ['面', '快手菜'],
    servings: 1,
    ingredients: [
      { id: createId(), name: '面条', amount: 150, unit: 'g' },
      { id: createId(), name: '番茄', amount: 1, unit: '个' },
      { id: createId(), name: '鸡蛋', amount: 1, unit: '个' },
      { id: createId(), name: '葱花', amount: 1, unit: '勺' },
      { id: createId(), name: '盐', amount: 0.5, unit: '勺' },
    ],
    steps: [
      { id: createId(), text: '番茄切块，鸡蛋打散炒熟盛出。' },
      { id: createId(), text: '锅中加油炒番茄出汁，加水烧开。' },
      { id: createId(), text: '下面条煮熟，加入炒好的鸡蛋。' },
      { id: createId(), text: '加盐调味，撒葱花出锅。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },

  // ========== 一锅端 ==========
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '糯米南瓜一锅端',
    description: '15 分钟搞定的温暖甜咸一锅菜，适合忙碌的工作日夜宵。',
    duration: 20,
    difficulty: '简单',
    tags: ['一锅端', '素菜', '快手菜'],
    servings: 2,
    ingredients: [
      { id: createId(), name: '糯米', amount: 120, unit: 'g' },
      { id: createId(), name: '南瓜', amount: 200, unit: 'g' },
      { id: createId(), name: '椰奶', amount: 80, unit: 'ml' },
      { id: createId(), name: '椰糖', amount: 10, unit: 'g' },
    ],
    steps: [
      { id: createId(), text: '糯米洗净泡水 20 分钟，沥干备用。' },
      { id: createId(), text: '南瓜去皮切块，与糯米一起放入锅中。' },
      { id: createId(), text: '倒入椰奶和少量清水，加入椰糖，小火焖 15 分钟。' },
      { id: createId(), text: '焖至汤汁粘稠即可关火，撒椰片增香。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '三杯杏鲍菇',
    description: '经典台式"肉感"素菜，10 分钟就能端上桌。',
    duration: 15,
    difficulty: '简单',
    tags: ['素菜', '下饭菜', '快手菜'],
    servings: 2,
    ingredients: [
      { id: createId(), name: '杏鲍菇', amount: 2, unit: '根' },
      { id: createId(), name: '姜片', amount: 5, unit: '片' },
      { id: createId(), name: '大蒜', amount: 4, unit: '瓣' },
      { id: createId(), name: '九层塔', amount: 1, unit: '把' },
      { id: createId(), name: '生抽', amount: 1, unit: '勺' },
      { id: createId(), name: '米酒', amount: 1, unit: '勺' },
      { id: createId(), name: '冰糖', amount: 1, unit: '小块' },
    ],
    steps: [
      { id: createId(), text: '杏鲍菇切滚刀块，略煎至表面金黄。' },
      { id: createId(), text: '加入姜片、大蒜煸香。' },
      { id: createId(), text: '倒入生抽、米酒、冰糖，小火收汁至略粘。' },
      { id: createId(), text: '关火后加入九层塔拌匀即可。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '土豆炖牛肉',
    description: '软烂入味，一锅搞定主食和菜。',
    duration: 90,
    difficulty: '中等',
    tags: ['一锅端', '下饭菜'],
    servings: 4,
    ingredients: [
      { id: createId(), name: '牛腩', amount: 500, unit: 'g' },
      { id: createId(), name: '土豆', amount: 2, unit: '个' },
      { id: createId(), name: '胡萝卜', amount: 1, unit: '根' },
      { id: createId(), name: '洋葱', amount: 0.5, unit: '个' },
      { id: createId(), name: '姜片', amount: 5, unit: '片' },
      { id: createId(), name: '八角', amount: 2, unit: '个' },
      { id: createId(), name: '生抽', amount: 2, unit: '勺' },
      { id: createId(), name: '老抽', amount: 1, unit: '勺' },
    ],
    steps: [
      { id: createId(), text: '牛腩切块焯水，土豆胡萝卜切块。' },
      { id: createId(), text: '锅中加油炒香洋葱、姜片、八角。' },
      { id: createId(), text: '加入牛腩翻炒，倒入生抽、老抽上色。' },
      { id: createId(), text: '加热水没过食材，大火烧开转小火炖 1 小时。' },
      { id: createId(), text: '加入土豆胡萝卜，继续炖 20 分钟至软烂。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },

  // ========== 素菜 ==========
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '干煸四季豆',
    description: '豆角干香，蒜香浓郁。',
    duration: 15,
    difficulty: '简单',
    tags: ['素菜', '下饭菜'],
    servings: 2,
    ingredients: [
      { id: createId(), name: '四季豆', amount: 300, unit: 'g' },
      { id: createId(), name: '干辣椒', amount: 4, unit: '个' },
      { id: createId(), name: '蒜末', amount: 1, unit: '勺' },
      { id: createId(), name: '肉末', amount: 50, unit: 'g' },
      { id: createId(), name: '生抽', amount: 1, unit: '勺' },
    ],
    steps: [
      { id: createId(), text: '四季豆去筋洗净，掰成段。' },
      { id: createId(), text: '锅中多放油，炸四季豆至表皮起皱，捞出。' },
      { id: createId(), text: '锅留底油，炒香肉末、干辣椒、蒜末。' },
      { id: createId(), text: '倒入四季豆，加生抽翻炒均匀即可。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '地三鲜',
    description: '东北经典，茄子土豆青椒的完美组合。',
    duration: 25,
    difficulty: '中等',
    tags: ['素菜', '下饭菜'],
    servings: 3,
    ingredients: [
      { id: createId(), name: '茄子', amount: 2, unit: '根' },
      { id: createId(), name: '土豆', amount: 1, unit: '个' },
      { id: createId(), name: '青椒', amount: 2, unit: '个' },
      { id: createId(), name: '蒜末', amount: 1, unit: '勺' },
      { id: createId(), name: '生抽', amount: 2, unit: '勺' },
      { id: createId(), name: '蚝油', amount: 1, unit: '勺' },
    ],
    steps: [
      { id: createId(), text: '茄子、土豆切滚刀块，青椒切块。' },
      { id: createId(), text: '土豆炸至金黄捞出，茄子炸软捞出。' },
      { id: createId(), text: '青椒过油捞出。' },
      { id: createId(), text: '锅留底油，爆香蒜末，倒入所有食材。' },
      { id: createId(), text: '加生抽、蚝油翻炒均匀，勾薄芡出锅。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },

  // ========== 低脂 ==========
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '白灼虾',
    description: '原汁原味，高蛋白低脂肪。',
    duration: 10,
    difficulty: '简单',
    tags: ['低脂', '快手菜'],
    servings: 2,
    ingredients: [
      { id: createId(), name: '鲜虾', amount: 300, unit: 'g' },
      { id: createId(), name: '姜片', amount: 3, unit: '片' },
      { id: createId(), name: '葱段', amount: 2, unit: '段' },
      { id: createId(), name: '料酒', amount: 1, unit: '勺' },
    ],
    steps: [
      { id: createId(), text: '虾剪去虾须，挑出虾线。' },
      { id: createId(), text: '锅中水烧开，加姜片、葱段、料酒。' },
      { id: createId(), text: '放入虾煮至变红卷曲，约 2-3 分钟。' },
      { id: createId(), text: '捞出蘸酱油或蒜蓉酱食用。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    title: '凉拌黄瓜',
    description: '清爽解腻，夏日必备。',
    duration: 5,
    difficulty: '简单',
    tags: ['低脂', '快手菜', '素菜'],
    servings: 2,
    ingredients: [
      { id: createId(), name: '黄瓜', amount: 2, unit: '根' },
      { id: createId(), name: '蒜末', amount: 1, unit: '勺' },
      { id: createId(), name: '醋', amount: 1, unit: '勺' },
      { id: createId(), name: '生抽', amount: 1, unit: '勺' },
      { id: createId(), name: '辣椒油', amount: 0.5, unit: '勺' },
    ],
    steps: [
      { id: createId(), text: '黄瓜拍碎切段。' },
      { id: createId(), text: '加入蒜末、醋、生抽、辣椒油拌匀。' },
      { id: createId(), text: '冷藏 10 分钟更入味。' },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
]

const sampleInventory: InventoryItem[] = [
  {
    id: createId(),
    householdId: getHouseholdId(),
    name: '鸡蛋',
    quantity: 10,
    unit: '个',
    location: '冷藏',
    expiryDate: addDays(7),
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    name: '番茄',
    quantity: 4,
    unit: '个',
    location: '冷藏',
    expiryDate: addDays(5),
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    name: '土豆',
    quantity: 3,
    unit: '个',
    location: '常温',
    expiryDate: addDays(14),
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    name: '大蒜',
    quantity: 1,
    unit: '头',
    location: '常温',
    expiryDate: addDays(30),
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    name: '生抽',
    quantity: 1,
    unit: '瓶',
    location: '常温',
    expiryDate: addDays(180),
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    name: '面条',
    quantity: 500,
    unit: 'g',
    location: '常温',
    expiryDate: addDays(90),
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
]

const sampleShoppingList: ShoppingListItem[] = [
  {
    id: createId(),
    householdId: getHouseholdId(),
    name: '五花肉',
    quantity: 500,
    unit: 'g',
    isBought: false,
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  {
    id: createId(),
    householdId: getHouseholdId(),
    name: '青菜',
    quantity: 1,
    unit: '把',
    isBought: false,
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
]

const sampleChatLogs: ChatLog[] = [
  {
    id: createId(),
    householdId: getHouseholdId(),
    recipeId: sampleRecipes[0].id,
    title: '番茄炒蛋 - 口感问题',
    messages: [
      {
        id: createId(),
        role: 'user',
        content: '怎么让鸡蛋更嫩滑？',
        createdAt: baseTimestamp,
      },
      {
        id: createId(),
        role: 'assistant',
        content: '打蛋时加一点点水或牛奶，炒的时候火不要太大，蛋液刚凝固就盛出，利用余温让它完全熟透。',
        createdAt: baseTimestamp,
      },
    ],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
]

const seedDatabase = async () => {
  const seeded = (await db.recipes.count()) > 0
  if (seeded) {
    return
  }
  await db.transaction('rw', db.recipes, db.inventory, db.shoppingList, db.chatLogs, async () => {
    await db.recipes.bulkAdd(sampleRecipes)
    await db.inventory.bulkAdd(sampleInventory)
    await db.shoppingList.bulkAdd(sampleShoppingList)
    await db.chatLogs.bulkAdd(sampleChatLogs)
  })
}

void seedDatabase()
