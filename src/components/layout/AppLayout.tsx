import { Outlet, useLocation } from 'react-router-dom'
import { TabBar } from './TabBar'

export const AppLayout = () => {
  const location = useLocation()
  return (
    <div className="flex min-h-screen justify-center bg-ios-background px-2">
      <div className="flex w-full max-w-md flex-col">
        <main className="flex-1 px-4 pb-[104px] pt-[calc(16px+env(safe-area-inset-top))]">
          <Outlet key={location.pathname} />
        </main>
        <TabBar />
      </div>
    </div>
  )
}

