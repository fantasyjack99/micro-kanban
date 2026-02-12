import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ReactSortable } from 'react-sortablejs'
import api from '../api'
import { format, isPast, isToday } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function Board() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCardModal, setShowCardModal] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  useEffect(() => {
    fetchBoard()
  }, [id])

  const fetchBoard = async () => {
    try {
      const { data } = await api.get(`/boards/${id}`)
      setBoard(data.board)
    } catch (err) {
      console.error('Failed to fetch board:', err)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const onCardMove = async (columnId, newCards) => {
    // 欄位對應狀態
    const columnStatusMap = {
      '待辦': 'todo',
      '進行中': 'doing',
      '已完成': 'done'
    }

    // 找出目標欄位的狀態
    const targetColumn = board.columns.find(c => c.id === columnId)
    const targetStatus = targetColumn ? columnStatusMap[targetColumn.title] : null

    // 找出來源欄位中少了哪張卡片（被移走的）
    let movedCard = null
    let sourceColumnId = null
    for (const col of board.columns) {
      if (col.id === columnId) continue
      const oldCardIds = col.cards.map(c => c.id)
      const newCardIds = newCards.map(c => c.id)
      const missingCardId = oldCardIds.find(id => !newCardIds.includes(id))
      if (missingCardId) {
        movedCard = col.cards.find(c => c.id === missingCardId)
        sourceColumnId = col.id
        break
      }
    }

    // 如果沒有找到移動的卡片，可能是同欄位內排序
    if (!movedCard) {
      const sourceColumn = board.columns.find(c => c.id === columnId)
      if (sourceColumn) {
        const oldCardIds = sourceColumn.cards.map(c => c.id)
        const newCardIds = newCards.map(c => c.id)
        // 檢查是否有順序變化
        const hasReorder = JSON.stringify(oldCardIds) !== JSON.stringify(newCardIds)
        if (hasReorder) {
          // 同欄位排序，更新本地狀態
          const newColumns = board.columns.map(col => {
            if (col.id === columnId) {
              return { ...col, cards: newCards.map((c, i) => ({ ...c, order: i })) }
            }
            return col
          })
          setBoard({ ...board, columns: newColumns })
          return
        }
      }
      return // 沒有變化
    }

    // 立即更新 UI - 從來源移除，加入目標
    const newColumns = board.columns.map(col => {
      if (col.id === columnId) {
        // 目標欄位：加入移動過來的卡片
        return { 
          ...col, 
          cards: newCards.map((card, index) => ({ 
            ...card, 
            columnId,
            order: index,
            status: targetStatus || card.status
          }))
        }
      }
      if (col.id === sourceColumnId) {
        // 來源欄位：移除被移出的卡片
        return {
          ...col,
          cards: col.cards.filter(c => c.id !== movedCard.id).map((c, i) => ({ ...c, order: i }))
        }
      }
      return col
    })
    setBoard({ ...board, columns: newColumns })

    // 發送 API 請求
    try {
      await api.post('/cards/move', {
        cardId: movedCard.id,
        targetColumnId,
        newOrder: newCards.findIndex(c => c.id === movedCard.id),
        status: targetStatus
      })
    } catch (err) {
      console.error('Failed to move card:', err)
      fetchBoard()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">載入中...</p>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">看板不存在</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-full mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-blue-600 hover:underline">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold text-gray-800">{board.title}</h1>
          </div>
        </div>
      </header>

      {/* Board Content */}
      <div className="p-6 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          {board.columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              onCardClick={(card) => {
                setEditingCard(card)
                setShowCardModal(true)
              }}
              onAddCard={() => {
                setEditingCard({ columnId: column.id })
                setShowCardModal(true)
              }}
              onCardMove={onCardMove}
            />
          ))}
        </div>
        </div>
      </div>

      {/* Card Modal */}
      {showCardModal && (
        <CardModal
          card={editingCard}
          onClose={() => {
            setShowCardModal(false)
            setEditingCard(null)
          }}
          onSave={() => {
            setShowCardModal(false)
            setEditingCard(null)
            fetchBoard()
          }}
        />
      )}
    </div>
  )
}

function Column({ column, onCardClick, onAddCard, onCardMove }) {
  // 固定欄位名稱
  const isFixedColumn = ['待辦', '進行中', '已完成'].includes(column.title)

  return (
    <div className="w-80 flex-shrink-0">
      <div className="bg-gray-200 rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-700">
            {column.title}
            <span className="ml-2 text-gray-500 text-sm">({column.cards.length})</span>
          </h3>
        </div>

        <ReactSortable
          list={column.cards}
          setList={(newCards) => onCardMove(column.id, newCards)}
          group="cards"
          itemKey="id"
          className="space-y-3 min-h-[100px]"
          ghostClass="opacity-50"
          dragClass="shadow-xl"
        >
          {column.cards.map((card) => (
            <Card key={card.id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </ReactSortable>

        {!isFixedColumn && (
          <button
            onClick={onAddCard}
            className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-300 rounded-lg transition text-left px-2"
          >
            + 新增卡片
          </button>
        )}
      </div>
    </div>
  )
}

function Card({ card, onClick }) {
  const isOverdue = card.dueDate && card.status !== 'done' && isPast(new Date(card.dueDate))
  const isDone = card.status === 'done'

  // 分類標籤對應底色
  const labelColors = {
    '一般': '#10B981',  // 綠色
    '重要': '#F59E0B',  // 橘色
    '緊急': '#EF4444'   // 紅色
  }
  const cardBgColor = card.categoryTag && labelColors[card.categoryTag] 
    ? labelColors[card.categoryTag] 
    : '#FFFFFF'

  // 根據背景色亮度調整文字顏色
  const getTextColor = (bgColor) => {
    const hex = bgColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128 ? '#1F2937' : '#F3F4F6'
  }

  const textColor = getTextColor(cardBgColor)
  const labelBg = textColor === '#1F2937' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)'
  const metaTextColor = textColor === '#1F2937' ? '#6B7280' : '#D1D5DB'
  const statusColor = isDone ? '#10B981' : (isOverdue ? '#EF4444' : metaTextColor)

  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-3 shadow cursor-pointer hover:shadow-md transition ${
        isOverdue ? 'border-l-4 border-red-500' : ''
      } ${isDone ? 'opacity-75' : ''}`}
      style={{ backgroundColor: cardBgColor }}
    >
      {card.categoryTag && (
        <span
          className="inline-block px-2 py-0.5 rounded text-xs mb-2 font-medium"
          style={{ backgroundColor: labelBg, color: textColor }}
        >
          {card.categoryTag}
        </span>
      )}
      
      <p className={`font-medium ${isDone ? 'line-through opacity-70' : ''}`} style={{ color: textColor }}>
        {card.title}
      </p>
      
      {card.content && (
        <p className={`text-sm mt-1 line-clamp-2 ${isDone ? 'line-through opacity-60' : ''}`} style={{ color: metaTextColor }}>
          {card.content}
        </p>
      )}

      {/* 狀態標籤 */}
      <div className="flex items-center gap-2 mt-2">
        <span 
          className="text-xs px-2 py-0.5 rounded font-medium"
          style={{ 
            backgroundColor: labelBg, 
            color: textColor,
            textDecoration: isDone ? 'line-through' : 'none'
          }}
        >
          {isDone ? '已完成' : (card.status === 'doing' ? '進行中' : '待辦')}
        </span>
      </div>
      
      {/* 建立時間 */}
      <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: metaTextColor }}>
        <span>{format(new Date(card.createdAt), 'MM/dd HH:mm')}</span>
      </div>
      
      {/* 到期日 */}
      {card.dueDate && !isDone && (
        <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: isOverdue ? '#EF4444' : metaTextColor }}>
          <span>📅</span>
          <span className={isOverdue ? 'font-medium' : ''}>
            {format(new Date(card.dueDate), 'MM/dd')}
          </span>
          {isOverdue && <span>⚠️</span>}
        </div>
      )}
    </div>
  )
}

function CardModal({ card, onClose, onSave }) {
  const [title, setTitle] = useState(card?.title || '')
  const [content, setContent] = useState(card?.content || '')
  const [categoryTag, setCategoryTag] = useState(card?.categoryTag || '')
  const [dueDate, setDueDate] = useState(card?.dueDate ? card.dueDate.split('T')[0] : '')
  const [status, setStatus] = useState(card?.status || 'todo')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (card?.id) {
        // Update existing card
        await api.put(`/cards/${card.id}`, {
          title,
          content,
          categoryTag,
          status,
          dueDate: dueDate || null
        })
      } else {
        // Create new card
        await api.post('/cards', {
          title,
          content,
          categoryTag,
          columnId: card.columnId,
          dueDate: dueDate || null
        })
      }
      onSave()
    } catch (err) {
      console.error('Failed to save card:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!card?.id) return
    if (!confirm('確定要刪除這張卡片嗎？')) return

    try {
      await api.delete(`/cards/${card.id}`)
      onClose()
    } catch (err) {
      console.error('Failed to delete card:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {card?.id ? '編輯卡片' : '新增卡片'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">標題 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="卡片標題"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">描述</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="詳細內容..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">分類標籤</label>
              <select
                value={categoryTag}
                onChange={(e) => setCategoryTag(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">無</option>
                <option value="一般">一般</option>
                <option value="重要">重要</option>
                <option value="緊急">緊急</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">到期日</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 狀態選擇 */}
          {card?.id && (
            <div>
              <label className="block text-gray-700 font-medium mb-2">狀態</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="todo">待辦</option>
                <option value="doing">進行中</option>
                <option value="done">完成</option>
              </select>
            </div>
          )}

          <div className="flex gap-4 justify-between pt-4">
            {card?.id && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-red-500 hover:text-red-700"
              >
                刪除
              </button>
            )}
            <div className="flex gap-4 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
