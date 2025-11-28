import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

import { useChatLogs, useRecipe } from '@/db/hooks'
import { chatRepository } from '@/db/repositories'

const mockReply = (question: string, recipeTitle?: string) => {
  if (question.includes('简单')) {
    return '可以同时处理两步，例如先腌料再准备配菜，或把所有调味料提前混合成酱汁。'
  }
  if (question.includes('减脂')) {
    return '减少油量，炒菜时用不粘锅，糖量减半，汤汁可以换成清水或无糖豆浆。'
  }
  if (question.includes('替代')) {
    return '可以用口感相近的蔬菜代替，譬如胡萝卜替代南瓜，或白蘑菇替代杏鲍菇。'
  }
  return `${recipeTitle ?? '这道菜'}可以先备齐材料。尽量控制火候，遵循“先大火锁水、后小火入味”的节奏，会更省力。`
}

export const ChatPage = () => {
  const { recipeId } = useParams()
  const recipe = useRecipe(recipeId)
  const chatLogs = useChatLogs(recipeId)
  const [message, setMessage] = useState('')

  const activeChat = chatLogs?.[0]

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!message.trim()) return
    let targetChat = activeChat
    if (!targetChat) {
      targetChat = await chatRepository.create({
        recipeId,
        title: recipe?.title ?? '临时聊天',
        messages: [],
      })
    }
    await chatRepository.addMessage(targetChat.id, {
      role: 'user',
      content: message,
    })
    await chatRepository.addMessage(targetChat.id, {
      role: 'assistant',
      content: mockReply(message, recipe?.title),
    })
    setMessage('')
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="space-y-1">
        <p className="text-sm text-ios-muted">厨房助手</p>
        <h1 className="text-3xl font-semibold">
          {recipe?.title ?? '菜谱助手'}
        </h1>
        <p className="text-ios-muted">
          根据菜谱信息快速给出变通方案，当前使用 Mock 数据，后续可接入 LLM。
        </p>
      </header>
      <div className="flex flex-1 flex-col gap-3 rounded-[24px] border border-ios-border bg-white p-4 shadow-card">
        {activeChat?.messages.length ? (
          activeChat.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-3xl px-4 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-ios-primary text-white'
                    : 'bg-ios-primaryMuted/60 text-ios-text'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-ios-muted">
            <Sparkles className="h-10 w-10 text-ios-primary" />
            <p>随便问问，比如“没有杏鲍菇可以换什么？”</p>
          </div>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex items-center rounded-full border border-ios-border bg-white px-4 py-2"
      >
        <input
          className="flex-1 border-none bg-transparent outline-none"
          placeholder="输入想问的问题..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <button
          type="submit"
          className="rounded-full bg-ios-primary px-4 py-2 text-sm font-semibold text-white"
        >
          发送
        </button>
      </form>
    </div>
  )
}

