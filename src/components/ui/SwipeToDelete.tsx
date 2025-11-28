import { useState, useRef } from 'react'
import type { ReactNode, TouchEvent, MouseEvent } from 'react'
import { Trash2 } from 'lucide-react'

type SwipeToDeleteProps = {
  children: ReactNode
  onDelete: () => void
  deleteText?: string
}

export const SwipeToDelete = ({
  children,
  onDelete,
  deleteText = '删除',
}: SwipeToDeleteProps) => {
  const [offsetX, setOffsetX] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const startXRef = useRef(0)
  const currentXRef = useRef(0)
  const isDraggingRef = useRef(false)

  const DELETE_THRESHOLD = 80 // 删除按钮宽度

  const handleTouchStart = (e: TouchEvent) => {
    startXRef.current = e.touches[0].clientX
    currentXRef.current = isOpen ? -DELETE_THRESHOLD : 0
    isDraggingRef.current = true
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDraggingRef.current) return

    const touchX = e.touches[0].clientX
    const diff = touchX - startXRef.current
    let newOffset = currentXRef.current + diff

    // 限制滑动范围
    newOffset = Math.max(-DELETE_THRESHOLD, Math.min(0, newOffset))
    setOffsetX(newOffset)
  }

  const handleTouchEnd = () => {
    isDraggingRef.current = false

    // 判断是否超过阈值
    if (offsetX < -DELETE_THRESHOLD / 2) {
      setOffsetX(-DELETE_THRESHOLD)
      setIsOpen(true)
    } else {
      setOffsetX(0)
      setIsOpen(false)
    }
  }

  // 鼠标事件支持（桌面端）
  const handleMouseDown = (e: MouseEvent) => {
    startXRef.current = e.clientX
    currentXRef.current = isOpen ? -DELETE_THRESHOLD : 0
    isDraggingRef.current = true
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return

    const diff = e.clientX - startXRef.current
    let newOffset = currentXRef.current + diff

    newOffset = Math.max(-DELETE_THRESHOLD, Math.min(0, newOffset))
    setOffsetX(newOffset)
  }

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false

    if (offsetX < -DELETE_THRESHOLD / 2) {
      setOffsetX(-DELETE_THRESHOLD)
      setIsOpen(true)
    } else {
      setOffsetX(0)
      setIsOpen(false)
    }
  }

  const handleMouseLeave = () => {
    if (isDraggingRef.current) {
      handleMouseUp()
    }
  }

  const handleDelete = () => {
    setOffsetX(0)
    setIsOpen(false)
    onDelete()
  }

  const close = () => {
    setOffsetX(0)
    setIsOpen(false)
  }

  return (
    <div className="relative overflow-hidden rounded-[18px]">
      {/* 删除按钮背景 */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-ios-danger text-white"
        style={{ width: DELETE_THRESHOLD }}
        onClick={handleDelete}
      >
        <div className="flex flex-col items-center gap-1">
          <Trash2 className="h-5 w-5" />
          <span className="text-xs font-medium">{deleteText}</span>
        </div>
      </div>

      {/* 可滑动内容 */}
      <div
        className="relative bg-white transition-transform duration-150 ease-out select-none"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDraggingRef.current ? 'none' : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          if (isOpen) {
            e.preventDefault()
            e.stopPropagation()
            close()
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}

