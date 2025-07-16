// src/pages/CreateEditItemPage.tsx
import React, { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'

interface FieldErrors {
  description?: string
  quantity?: string
  deadline?: string
}

const CreateEditItemPage: React.FC = () => {
  const { id: requestId, itemId } = useParams<{ id: string; itemId?: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(itemId)

  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState<number>(1)
  const [deadline, setDeadline] = useState<string>('') // YYYY-MM-DD
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  // Se for edição, busca os dados do item
  useEffect(() => {
    if (isEdit) {
      api.get(`/requests/${requestId}/items/${itemId}`)
        .then(resp => {
          const item = resp.data
          setDescription(item.Description)
          setQuantity(item.Quantity)
          // item.Deadline pode vir como ISO, transformamos pra YYYY-MM-DD
          if (item.Deadline) {
            setDeadline(item.Deadline.split('T')[0])
          }
        })
        .catch(() => alert('Erro ao carregar item'))
    }
  }, [isEdit, requestId, itemId])

  // Validação inline
  const validate = (): boolean => {
    const newErrors: FieldErrors = {}
    if (!description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    }
    if (quantity < 1) {
      newErrors.quantity = 'Quantidade deve ser no mínimo 1'
    }
    if (deadline) {
      // data futura ou igual hoje
      const selected = new Date(deadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selected < today) {
        newErrors.deadline = 'Prazo não pode ser anterior a hoje'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload: any = {
      description,
      quantity,
    }
    if (deadline) payload.deadline = deadline

    try {
      setSubmitting(true)
      if (isEdit) {
        await api.patch(`/requests/${requestId}/items/${itemId}`, payload)
      } else {
        await api.post(`/requests/${requestId}/items`, payload)
      }
      navigate(`/requests/${requestId}`)
    } catch {
      alert('Erro ao salvar item')
    } finally {
      setSubmitting(false)
    }
  }

  const onChangeDescription = (e: ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value)
    if (errors.description) {
      setErrors({ ...errors, description: undefined })
    }
  }
  const onChangeQuantity = (e: ChangeEvent<HTMLInputElement>) => {
    setQuantity(Number(e.target.value))
    if (errors.quantity) {
      setErrors({ ...errors, quantity: undefined })
    }
  }
  const onChangeDeadline = (e: ChangeEvent<HTMLInputElement>) => {
    setDeadline(e.target.value)
    if (errors.deadline) {
      setErrors({ ...errors, deadline: undefined })
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {isEdit ? 'Editar Item' : 'Novo Item'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Descrição */}
        <div>
          <label className="block mb-1 font-medium">Descrição</label>
          <input
            type="text"
            value={description}
            onChange={onChangeDescription}
            onBlur={validate}
            className={`w-full border rounded p-2 ${
              errors.description ? 'border-red-500' : ''
            }`}
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Quantidade */}
        <div>
          <label className="block mb-1 font-medium">Quantidade</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={onChangeQuantity}
            onBlur={validate}
            className={`w-full border rounded p-2 ${
              errors.quantity ? 'border-red-500' : ''
            }`}
          />
          {errors.quantity && (
            <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>
          )}
        </div>

        {/* Prazo */}
        <div>
          <label className="block mb-1 font-medium">Prazo</label>
          <input
            type="date"
            value={deadline}
            onChange={onChangeDeadline}
            onBlur={validate}
            className={`w-full border rounded p-2 ${
              errors.deadline ? 'border-red-500' : ''
            }`}
          />
          {errors.deadline && (
            <p className="text-red-600 text-sm mt-1">{errors.deadline}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full p-2 text-white rounded transition ${
            submitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {submitting ? 'Salvando...' : 'Salvar Item'}
        </button>
      </form>
    </div>
  )
}

export default CreateEditItemPage
