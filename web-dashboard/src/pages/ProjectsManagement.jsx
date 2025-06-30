import { useState, useEffect } from 'react'
import '../styles/ProjectsManagement.css'

const ProjectsManagement = ({ user, pocketbaseUrl }) => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true
  })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${pocketbaseUrl}/api/collections/projects/records?filter=userId="${user.id}"&sort=-created`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setProjects(data.items)
      } else {
        console.error('Error loading projects:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const projectData = {
        ...formData,
        userId: user.id,
        created: new Date().toISOString()
      }
      
      let response
      if (editingProject) {
        // Update existing project
        response = await fetch(`${pocketbaseUrl}/api/collections/projects/records/${editingProject.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`,
          },
          body: JSON.stringify(formData)
        })
      } else {
        // Create new project
        response = await fetch(`${pocketbaseUrl}/api/collections/projects/records`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`,
          },
          body: JSON.stringify(projectData)
        })
      }
      
      if (response.ok) {
        setFormData({ name: '', description: '', active: true })
        setShowCreateForm(false)
        setEditingProject(null)
        loadProjects()
      } else {
        console.error('Error saving project:', response.statusText)
      }
    } catch (error) {
      console.error('Error saving project:', error)
    }
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || '',
      active: project.active !== false
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (project) => {
    if (!confirm(`Czy na pewno chcesz usunąć projekt "${project.name}"? Ta operacja usunie również wszystkie słowa kluczowe przypisane do tego projektu.`)) {
      return
    }
    
    try {
      const response = await fetch(`${pocketbaseUrl}/api/collections/projects/records/${project.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })
      
      if (response.ok) {
        loadProjects()
      } else {
        console.error('Error deleting project:', response.statusText)
      }
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const cancelEdit = () => {
    setEditingProject(null)
    setShowCreateForm(false)
    setFormData({ name: '', description: '', active: true })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="projects-management-page">
      <div className="page-header">
        <h2>📁 Zarządzanie projektami</h2>
        <p>Twórz i zarządzaj projektami monitoringu pozycji</p>
      </div>

      <div className="projects-actions">
        <button 
          className="create-project-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '❌ Anuluj' : '➕ Nowy projekt'}
        </button>
      </div>

      {showCreateForm && (
        <div className="project-form-container">
          <h3>{editingProject ? '✏️ Edytuj projekt' : '➕ Nowy projekt'}</h3>
          <form onSubmit={handleSubmit} className="project-form">
            <div className="form-group">
              <label htmlFor="name">Nazwa projektu *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="np. Klient A - Monitorowanie felg"
                required
                maxLength={255}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Opis projektu</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Opcjonalny opis projektu, cele monitoringu, uwagi..."
                rows={3}
                maxLength={1000}
              />
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                />
                Projekt aktywny
              </label>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="save-btn">
                {editingProject ? '💾 Zapisz zmiany' : '➕ Utwórz projekt'}
              </button>
              <button type="button" onClick={cancelEdit} className="cancel-btn">
                ❌ Anuluj
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Ładowanie projektów...</div>
      ) : (
        <div className="projects-list">
          <h3>📋 Twoje projekty ({projects.length})</h3>
          
          {projects.length === 0 ? (
            <div className="no-projects">
              <p>Nie masz jeszcze żadnych projektów.</p>
              <p>Utwórz pierwszy projekt aby lepiej organizować swoje słowa kluczowe.</p>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(project => (
                <div key={project.id} className={`project-card ${!project.active ? 'inactive' : ''}`}>
                  <div className="project-header">
                    <h4>{project.name}</h4>
                    <div className="project-status">
                      {project.active ? '🟢 Aktywny' : '🔴 Nieaktywny'}
                    </div>
                  </div>
                  
                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}
                  
                  <div className="project-meta">
                    <small>Utworzony: {formatDate(project.created)}</small>
                  </div>
                  
                  <div className="project-actions">
                    <button onClick={() => handleEdit(project)} className="edit-btn">
                      ✏️ Edytuj
                    </button>
                    <button onClick={() => handleDelete(project)} className="delete-btn">
                      🗑️ Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProjectsManagement 