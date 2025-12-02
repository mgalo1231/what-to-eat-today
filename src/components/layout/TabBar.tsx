import { NavLink } from 'react-router-dom'
import {
  Home,
  BookOpenCheck,
  ShoppingBasket,
  Refrigerator,
  User,
} from 'lucide-react'
import clsx from 'clsx'

const tabs = [
  { to: '/today', label: '今天', icon: Home },
  { to: '/recipes', label: '菜谱', icon: BookOpenCheck },
  { to: '/inventory', label: '库存', icon: Refrigerator },
  { to: '/shopping', label: '购物', icon: ShoppingBasket },
  { to: '/profile', label: '我的', icon: User },
]

export const TabBar = () => (
  <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/40 bg-white/90 shadow-[0_-10px_30px_rgba(28,28,30,0.08)] backdrop-blur-lg">
    <div className="mx-auto flex max-w-md items-center justify-between gap-1 px-2 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            clsx(
              'flex flex-1 flex-col items-center justify-center rounded-[18px] px-1 py-2 text-xs font-semibold text-ios-muted transition-all',
              isActive && 'bg-ios-primary text-white shadow-soft',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={clsx('h-5 w-5', isActive && 'text-white')} />
              <span className={clsx('mt-1', isActive && 'text-white')}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
)
