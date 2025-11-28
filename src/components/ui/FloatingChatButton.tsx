import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// Mock AI 响应
const mockAIResponse = async (question: string): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))
  
  const lowerQ = question.toLowerCase()
  
  if (lowerQ.includes('红烧肉') || lowerQ.includes('红烧')) {
    return `红烧肉的做法：

**食材**：五花肉500g、冰糖30g、生抽2勺、老抽1勺、料酒2勺、姜片、八角、桂皮

**步骤**：
1. 五花肉切块，冷水下锅焯水去血沫
2. 锅中少许油，小火炒化冰糖至焦糖色
3. 放入肉块翻炒上色，加姜片、八角、桂皮
4. 加生抽、老抽、料酒，倒入没过肉的热水
5. 大火烧开转小火炖1小时，最后大火收汁

💡 小技巧：冰糖炒至枣红色时下肉，颜色最漂亮！`
  }
  
  if (lowerQ.includes('番茄') || lowerQ.includes('西红柿')) {
    return `番茄炒蛋的做法：

**食材**：鸡蛋3个、番茄2个、葱花、盐、糖少许

**步骤**：
1. 番茄切块，鸡蛋打散加少许盐
2. 热锅凉油，倒入蛋液炒至凝固盛出
3. 锅中加少许油，放入番茄翻炒出汁
4. 加入炒好的鸡蛋，调入盐和糖
5. 撒葱花出锅

💡 小技巧：番茄先用开水烫一下更容易去皮，口感更细腻！`
  }
  
  if (lowerQ.includes('简单') || lowerQ.includes('快手') || lowerQ.includes('新手')) {
    return `推荐几道新手友好的快手菜：

1. **蒜蓉炒青菜** - 8分钟，只需蒜和青菜
2. **番茄炒蛋** - 10分钟，经典下饭
3. **葱油拌面** - 15分钟，葱香四溢
4. **紫菜蛋花汤** - 5分钟，简单营养

这些菜都是：
✅ 食材简单易买
✅ 步骤少不容易失败
✅ 时间短适合忙碌的你`
  }
  
  if (lowerQ.includes('减肥') || lowerQ.includes('低脂') || lowerQ.includes('健康')) {
    return `推荐几道低脂健康菜：

1. **白灼虾** - 高蛋白低脂肪
2. **凉拌黄瓜** - 清爽解腻
3. **蒜蓉西兰花** - 营养丰富
4. **清蒸鱼** - 保留鲜味

💡 健康烹饪小技巧：
- 少油少盐，用蒸、煮、烤代替炸
- 多用香料调味代替重油重盐
- 肉类选择鸡胸、鱼虾等白肉`
  }
  
  return `关于「${question}」，我来帮你解答：

这是一个很好的问题！作为你的厨房小助手，我建议：

1. 如果你想学做某道菜，可以问我具体的做法
2. 如果你不知道吃什么，可以告诉我你有什么食材
3. 如果你想吃得健康，我可以推荐低脂菜谱

有什么具体想做的菜吗？我可以给你详细的步骤！🍳`
}

export const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是你的厨房小助手 🍳\n\n问我任何关于做菜的问题，比如：\n• "红烧肉怎么做？"\n• "有什么简单的快手菜？"\n• "推荐几道减肥餐"',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await mockAIResponse(input)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '抱歉，我暂时无法回答，请稍后再试。',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* 悬浮按钮 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 transition-transform hover:scale-105 active:scale-95"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:bottom-24 sm:right-4 sm:h-[500px] sm:w-[380px] sm:rounded-3xl sm:shadow-2xl">
          {/* 头部 */}
          <div className="flex items-center justify-between bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 text-white sm:rounded-t-3xl">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">厨房小助手</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                  <span className="text-sm text-gray-500">思考中...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入框 */}
          <div className="border-t border-gray-100 p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="问我任何做菜的问题..."
                className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

