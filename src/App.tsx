import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { TodayPage } from '@/features/today/TodayPage'
import { RecipeListPage } from '@/features/recipes/pages/RecipeListPage'
import { RecipeDetailPage } from '@/features/recipes/pages/RecipeDetailPage'
import { RecipeEditorPage } from '@/features/recipes/pages/RecipeEditorPage'
import { InventoryPage } from '@/features/inventory/InventoryPage'
import { ShoppingListPage } from '@/features/shopping/ShoppingListPage'
import { ChatPage } from '@/features/chat/ChatPage'
import { AuthProvider } from '@/features/auth/AuthContext'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { ToastProvider } from '@/components/ui/Toast'
import { ConfirmProvider } from '@/components/ui/ConfirmDialog'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <Routes>
              {/* 登录页面（不需要认证） */}
              <Route path="/login" element={<LoginPage />} />

              {/* 需要认证的页面 */}
              <Route
                element={
                  <RequireAuth>
                    <AppLayout />
                  </RequireAuth>
                }
              >
                <Route path="/" element={<Navigate to="/today" replace />} />
                <Route path="/today" element={<TodayPage />} />
                <Route path="/recipes" element={<RecipeListPage />} />
                <Route path="/recipes/new" element={<RecipeEditorPage />} />
                <Route path="/recipes/:id" element={<RecipeDetailPage />} />
                <Route path="/recipes/:id/edit" element={<RecipeEditorPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/shopping" element={<ShoppingListPage />} />
                <Route path="/chat/:recipeId" element={<ChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* 兜底：未匹配路由跳转登录 */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
