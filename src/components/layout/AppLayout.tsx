import { Outlet, useLocation } from 'react-router-dom'
import { TabBar } from './TabBar'
import { FloatingChatButton } from '@/components/ui/FloatingChatButton'

export const AppLayout = () => {
  const location = useLocation()
  
  // 在聊天页面不显示悬浮按钮
  const showFloatingChat = !location.pathname.startsWith('/chat/')
  
  return (
    <div className="flex min-h-screen justify-center bg-ios-background px-2">
      <div className="flex w-full max-w-md flex-col">
        <main className="flex-1 px-4 pb-[104px] pt-[calc(16px+env(safe-area-inset-top))]">
          <Outlet key={location.pathname} />
        </main>
        <TabBar />
        {showFloatingChat && <FloatingChatButton />}
      </div>
    </div>
  )
}
