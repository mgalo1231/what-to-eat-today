import { Link } from 'react-router-dom'
import { Clock, Edit3 } from 'lucide-react'

import type { Recipe } from '@/types/entities'
import { Card } from '@/components/ui/Card'
import { TagPill } from '@/components/ui/TagPill'

type RecipeCardProps = {
  recipe: Recipe
}

export const RecipeCard = ({ recipe }: RecipeCardProps) => (
  <Card className="card-press relative flex flex-col gap-4">
    <Link to={`/recipes/${recipe.id}`} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ios-muted">
            {recipe.difficulty}
          </p>
          <h2 className="text-xl font-semibold text-ios-text">{recipe.title}</h2>
        </div>
        <span className="rounded-pill bg-ios-primaryMuted px-3 py-1 text-sm font-semibold text-ios-primary">
          {recipe.duration}′
        </span>
      </div>
      {recipe.description && (
        <p className="line-clamp-2 text-sm text-ios-muted">{recipe.description}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {recipe.tags?.slice(0, 4).map((tag) => (
          <TagPill key={tag}>{tag}</TagPill>
        ))}
        {(recipe.tags?.length || 0) > 4 && (
          <span className="text-xs text-ios-muted">+{(recipe.tags?.length || 0) - 4}</span>
        )}
      </div>
    </Link>
    <div className="flex items-center justify-between border-t border-ios-border pt-3 text-sm text-ios-muted">
      <span className="inline-flex items-center gap-1">
        <Clock className="h-4 w-4" />
        {recipe.steps?.length || 0} 步骤 · {recipe.ingredients?.length || 0} 食材
      </span>
      <Link
        to={`/recipes/${recipe.id}/edit`}
        className="btn-press inline-flex items-center gap-1 rounded-full bg-ios-primaryMuted px-3 py-1 text-ios-primary"
      >
        <Edit3 className="h-4 w-4" />
        编辑
      </Link>
    </div>
  </Card>
)
