// src/components/AttachmentsSection.tsx
import React, { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import api from '../api/client'

interface Attachment {
  id: number
  fileName: string
  fileURL: string
  createdAt: string
}

interface Props {
  requestId: string
}

const AttachmentsSection: React.FC<Props> = ({ requestId }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [file, setFile] = useState<File>()
  const [uploading, setUploading] = useState(false)

  // carrega lista de anexos
  const load = () => {
    api.get<Attachment[]>(`/requests/${requestId}/attachments`)
      .then(r => setAttachments(r.data))
      .catch(() => alert('Erro ao carregar anexos'))
  }

  useEffect(load, [requestId])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) {
      alert('Selecione um arquivo antes')
      return
    }
    const form = new FormData()
    form.append('file', file)
    try {
      setUploading(true)
      await api.post(`/requests/${requestId}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setFile(undefined)
      load()
    } catch {
      alert('Falha no upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Anexos</h2>

      {/* lista */}
      <ul className="space-y-2 mb-6">
        {attachments.map(att => (
          <li key={att.id} className="flex items-center justify-between bg-white p-3 rounded shadow-sm">
            <span>{att.fileName}</span>
            <a
              href={att.fileURL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Download
            </a>
          </li>
        ))}
        {attachments.length === 0 && (
          <li className="text-gray-500">Nenhum anexo.</li>
        )}
      </ul>

      {/* upload */}
      <form onSubmit={handleUpload} className="flex items-center space-x-2">
        <input
          type="file"
          onChange={handleFileChange}
          className="border rounded p-1"
        />
        <button
          type="submit"
          disabled={uploading}
          className={`px-4 py-2 text-white rounded ${
            uploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {uploading ? 'Enviando...' : 'Enviar Anexo'}
        </button>
      </form>
    </section>
  )
}

export default AttachmentsSection
