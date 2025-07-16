// src/pages/CreateEditItem.tsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

interface ItemInput {
  description: string
  quantity: number
  deadline?: string
}

const CreateEditItemPage: React.FC = () => {
  const { id: requestId, itemId } = useParams<{ id: string; itemId?: string }>()
  const navigate = useNavigate()

  const isEdit = Boolean(itemId)
  const [form, setForm] = useState<ItemInput>({
    description: '',
    quantity: 1,
    deadline: '',
  })
  const [loading, setLoading] = useState(isEdit)

  // Se for edição, busca os dados atuais do item
  useEffect(() => {
    if (!isEdit) return
    api.get(`/requests/${requestId}`)
      .then(resp => {
        const item = resp.data.Items.find((i: any) => String(i.ID) === itemId)
        if (item) {
          setForm({
            description: item.Description,
            quantity: item.Quantity,
            deadline: item.Deadline ? item.Deadline.split('T')[0] : '',
          })
        } else {
          alert('Item não encontrado')
          navigate(-1)
        }
      })
      .catch(() => {
        alert('Erro ao carregar item')
        navigate(-1)
      })
      .finally(() => setLoading(false))
  }, [isEdit, itemId, requestId, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isEdit) {
        await api.patch(`/requests/${requestId}/items/${itemId}`, {
          description: form.description,
          quantity: form.quantity,
          deadline: form.deadline || null,
        })
      } else {
        await api.post(`/requests/${requestId}/items`, {
          description: form.description,
          quantity: form.quantity,
          deadline: form.deadline || null,
        })
      }
      navigate(`/requests/${requestId}`)
    } catch {
      alert(`Erro ao ${isEdit ? 'atualizar' : 'criar'} item`)
    }
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded">
      <h1 className="text-xl font-bold mb-4">
        {isEdit ? 'Editar Item' : 'Novo Item'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Descrição</label>
          <textarea
            name="description"
            rows={2}
            className="w-full p-2 border"
            value={form.description}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Quantidade</label>
          <input
            type="number"
            name="quantity"
            min={1}
            className="w-full p-2 border"
            value={form.quantity}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Prazo (opcional)</label>
          <input
            type="date"
            name="deadline"
            className="w-full p-2 border"
            value={form.deadline}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          className={`w-full p-2 text-white rounded ${
            isEdit ? 'bg-yellow-600' : 'bg-green-600'
          }`}
        >
          {isEdit ? 'Salvar Alterações' : 'Adicionar Item'}
        </button>
      </form>
    </div>
  )
}

export default CreateEditItemPage
