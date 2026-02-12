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
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')

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

  const addColumn = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post(`/boards/${id}/columns`, {
        title: newColumnTitle
      })
      setBoard({
        ...board,
        columns: [...board.columns, data.column].sort((a, b) => a.order - b.order)
      })
      setNewColumnTitle('')
      setShowColumnModal(false)
    } catch (err) {
      console.error('Failed to add column:', err)
    }
  }

  const onCardMove = async (columnId, newCards) => {
    // Find the column
    const column = board.columns.find(c => c.id === columnId)
    if (!column) return

    // Check if order changed
    const oldOrder = column.cards.map(c => c.id)
    const newOrder = newCards.map(c => c.id)

    if (JSON.stringify(oldOrder) === JSON.stringify(newOrder)) return

    // Find the card that was moved (first card with different position)
    let movedCard = null
    for (let i = 0; i < newCards.length; i++) {
      if (!oldOrder[i] || oldOrder[i] !== newCards[i].id) {
        movedCard = newCards[i]
        break
      }
    }

    if (!movedCard) return

    try {
      await api.post('/cards/move', {
        cardId: movedCard.id,
        targetColumnId: columnId,
        newOrder: newCards.findIndex(c => c.id === movedCard.id)
      })

      // Update local state
      const newColumns = board.columns.map(col => {
        if (col.id === columnId) {
          return { ...col, cards: newCards }
        }
        return col
      })
      setBoard({ ...board, columns: newColumns })
    } catch (err) {
      console.error('Failed to move card:', err)
      fetchBoard()
    }
  }

  const onDragEnd = async (result) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    // Find the card
    let card = null
    let sourceColumn = null
    let targetColumn = null

    for (const col of board.columns) {
      if (col.id === source.droppableId) {
        sourceColumn = col
        card = col.cards.find(c => c.id === draggableId)
      }
      if (col.id === destination.droppableId) {
        targetColumn = col
      }
    }

    if (!card || !targetColumn) return

    try {
      await api.post('/cards/move', {
        cardId: card.id,
        targetColumnId: targetColumn.id,
        newOrder: destination.index
      })

      // Optimistic update
      const newColumns = board.columns.map(col => {
        if (col.id === source.droppableId) {
          return {
            ...col,
            cards: col.cards.filter(c => c.id !== draggableId)
          }
        }
        if (col.id === destination.droppableId) {
          const newCards = [...col.cards]
          newCards.splice(destination.index, 0, { ...card, columnId: col.id })
          return { ...col, cards: newCards }
        }
        return col
      })

      setBoard({ ...board, columns: newColumns })
    } catch (err) {
      console.error('Failed to move card:', err)
      fetchBoard() // Revert
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
          
          {/* Add Column Button */}
          <div className="w-80 flex-shrink-0">
            <button
              onClick={() => setShowColumnModal(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 transition"
            >
              + 新增列表
            </button>
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

      {/* Add Column Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">新增列表</h3>
            <form onSubmit={addColumn}>
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                placeholder="列表名稱"
                autoFocus
                required
              />
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowColumnModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Column({ column, onCardClick, onAddCard, onCardMove }) {
  const [showMenu, setShowMenu] = useState(false)

  const isOverdue = (card) => {
    if (!card.dueDate || card.status === 'done') return false
    return isPast(new Date(card.dueDate))
  }

  return (
    <div className="w-80 flex-shrink-0">
      <div className="bg-gray-200 rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-700">
            {column.title}
            <span className="ml-2 text-gray-500 text-sm">({column.cards.length})</span>
          </h3>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-500 hover:text-gray-700"
            >
              ⋮
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg py-1 z-10">
                <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  刪除列表
                </button>
              </div>
            )}
          </div>
        </div>

        <ReactSortable
          list={column.cards}
          setList={(newCards) => onCardMove(column.id, newCards)}
          group="cards"
          itemKey="id"
          className="space-y-3 min-h-[100px]"
          ghostClass="opacity-50"
          dragClass="shadow-xl"
          pull="clone"
          put="true"
        >
          {column.cards.map((card) => (
            <Card key={card.id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </ReactSortable>

        <button
          onClick={onAddCard}
          className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-300 rounded-lg transition text-left px-2"
        >
          + 新增卡片
        </button>
      </div>
    </div>
  )
}

function Card({ card, onClick }) {
  const isOverdue = card.dueDate && card.status !== 'done' && isPast(new Date(card.dueDate))
  const isDone = card.status === 'done'
  const cardBgColor = card.color || '#FFFFFF'

  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-3 shadow cursor-pointer hover:shadow-md transition ${
        isOverdue ? 'border-l-4 border-red-500' : ''
      } ${isDone ? 'opacity-75' : ''}`}
      style={{ backgroundColor: cardBgColor }}
    >
      {card.categoryTag && (
        <span className="inline-block px-2 py-0.5 bg-white bg-opacity-60 rounded text-xs text-gray-700 mb-2">
          {card.categoryTag}
        </span>
      )}
      
      <p className={`font-medium ${isDone ? 'line-through text-gray-500' : 'text-gray-900'}`}>
        {card.title}
      </p>
      
      {card.content && (
        <p className={`text-sm mt-1 line-clamp-2 ${isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>
          {card.content}
        </p>
      )}
      
      {/* 建立時間 */}
      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
        <span>建立:</span>
        <span>{format(new Date(card.createdAt), 'MM/dd HH:mm', { locale: zhTW })}</span>
      </div>
      
      {/* 完成時間 */}
      {isDone && card.completedAt && (
        <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
          <span>完成:</span>
          <span>{format(new Date(card.completedAt), 'MM/dd HH:mm', { locale: zhTW })}</span>
        </div>
      )}
      
      {/* 到期日 */}
      {card.dueDate && !isDone && (
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <span>📅</span>
          <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
            {format(new Date(card.dueDate), 'MM/dd', { locale: zhTW })}
          </span>
          {isOverdue && <span className="text-red-500">⚠️</span>}
        </div>
      )}
    </div>
  )
}

function CardModal({ card, onClose, onSave }) {
  const [title, setTitle] = useState(card?.title || '')
  const [content, setContent] = useState(card?.content || '')
  const [categoryTag, setCategoryTag] = useState(card?.categoryTag || '')
  const [color, setColor] = useState(card?.color || '#3B82F6')
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
          color,
          status,
          dueDate: dueDate || null
        })
      } else {
        // Create new card
        await api.post('/cards', {
          title,
          content,
          categoryTag,
          color,
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
              <label className="block text-gray-700 font-medium mb-2">顏色</label>
              <div className="flex gap-2">
                {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#FFFFFF'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''} ${c === '#FFFFFF' ? 'border border-gray-300' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
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

          {/* 狀態選擇 */}
          {card?.id && (
            <div>
              <label className="block text-gray-700 font-medium mb-2">狀態</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="todo"
                    checked={status === 'todo'}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>待辦</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="doing"
                    checked={status === 'doing'}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-4 h-4 text-yellow-600"
                  />
                  <span>進行中</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="done"
                    checked={status === 'done'}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-4 h-4 text-green-600"
                  />
                  <span>完成</span>
                </label>
              </div>
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
