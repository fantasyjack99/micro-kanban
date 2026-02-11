import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [boards, setBoards] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchBoards()
  }, [])

  const fetchBoards = async () => {
    try {
      const { data } = await api.get('/boards')
      setBoards(data.boards)
    } catch (err) {
      console.error('Failed to fetch boards:', err)
    } finally {
      setLoading(false)
    }
  }

  const createBoard = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/boards', { title: newBoardTitle })
      setBoards([data.board, ...boards])
      setNewBoardTitle('')
      setShowModal(false)
      navigate(`/board/${data.board.id}`)
    } catch (err) {
      console.error('Failed to create board:', err)
    }
  }

  const deleteBoard = async (e, boardId) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('確定要刪除這個看板嗎？')) return
    
    try {
      await api.delete(`/boards/${boardId}`)
      setBoards(boards.filter(b => b.id !== boardId))
    } catch (err) {
      console.error('Failed to delete board:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">📋 微看板</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">👋 {user?.name || user?.email}</span>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-gray-800"
            >
              登出
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">我的看板</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + 新增看板
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">載入中...</p>
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">還沒有任何看板</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              建立第一個看板
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <Link
                key={board.id}
                to={`/board/${board.id}`}
                className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 group relative"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {board.title}
                </h3>
                <p className="text-gray-500 text-sm">
                  {board.columns.reduce((acc, col) => acc + col.cards.length, 0)} 個任務
                </p>
                <div className="flex gap-2 mt-4">
                  {board.columns.slice(0, 3).map((col) => (
                    <span
                      key={col.id}
                      className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                    >
                      {col.cards.length}
                    </span>
                  ))}
                </div>
                <button
                  onClick={(e) => deleteBoard(e, board.id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                >
                  🗑️
                </button>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Board Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">建立新看板</h3>
            <form onSubmit={createBoard}>
              <input
                type="text"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="看板名稱"
                autoFocus
                required
              />
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
