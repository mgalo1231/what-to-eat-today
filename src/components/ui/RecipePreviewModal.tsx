import { X, Clock, Users, Plus, Check, Loader2 } from 'lucide-react'
import type { DiscoverRecipe } from '@/data/discoverRecipes'

type RecipePreviewModalProps = {
  recipe: DiscoverRecipe | null
  isAdded: boolean
  isAdding: boolean
  onAdd: () => void
  onClose: () => void
}

export const RecipePreviewModal = ({
  recipe,
  isAdded,
  isAdding,
  onAdd,
  onClose,
}: RecipePreviewModalProps) => {
  if (!recipe) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-hidden rounded-t-[32px] bg-white shadow-2xl animate-slide-up sm:rounded-[32px] sm:m-4">
        {/* 头部 */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ios-border bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-wider text-ios-muted">
              {recipe.tags[0]}
            </p>
            <h2 className="text-xl font-bold">{recipe.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="btn-press flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {/* 基本信息 */}
          <div className="mb-4 flex items-center gap-4 text-sm text-ios-muted">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {recipe.duration} 分钟
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {recipe.servings} 人份
            </span>
            <span className="rounded-full bg-ios-primaryMuted px-2 py-0.5 text-ios-primary">
              {recipe.difficulty}
            </span>
          </div>

          {/* 描述 */}
          <p className="mb-4 text-ios-muted">{recipe.description}</p>

          {/* 标签 */}
          <div className="mb-6 flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 食材 */}
          <section className="mb-6">
            <h3 className="mb-3 font-semibold">食材清单</h3>
            <div className="grid grid-cols-2 gap-2">
              {recipe.ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2"
                >
                  <span className="text-sm">{ing.name}</span>
                  <span className="text-sm text-ios-muted">
                    {ing.amount} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 做法 */}
          <section>
            <h3 className="mb-3 font-semibold">做法步骤</h3>
            <div className="space-y-3">
              {recipe.steps.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ios-primary text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-gray-700">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 底部按钮 */}
        <div className="sticky bottom-0 border-t border-ios-border bg-white p-4">
          <button
            onClick={onAdd}
            disabled={isAdded || isAdding}
            className={`btn-press flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-semibold transition-colors ${
              isAdded
                ? 'bg-green-100 text-green-600'
                : 'bg-ios-primary text-white shadow-lg shadow-ios-primary/30'
            }`}
          >
            {isAdding ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                添加中...
              </>
            ) : isAdded ? (
              <>
                <Check className="h-5 w-5" />
                已添加到我的菜谱
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                添加到我的菜谱
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

