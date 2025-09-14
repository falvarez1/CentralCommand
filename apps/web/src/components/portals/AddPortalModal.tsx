import React, { useState } from 'react'
import { usePortalStore } from '@/stores/usePortalStore'
import { useNotificationContext } from '@/components/notifications/NotificationProvider'
import { CreatePortalInput, PortalStatus, PortalCategory, PortalEnvironment, PortalPriority, AuthType } from '@/types/portal.types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface AddPortalModalProps {
  open: boolean
  onClose: () => void
}

export const AddPortalModal: React.FC<AddPortalModalProps> = ({ open, onClose }) => {
  const { addPortal } = usePortalStore()
  const { showSuccess, showError } = useNotificationContext()

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    category: PortalCategory.BUSINESS,
    environment: PortalEnvironment.PRODUCTION,
    priority: PortalPriority.MEDIUM,
    authType: AuthType.OAUTH,
    tags: [] as string[],
    tagInput: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.url) {
      showError('Validation Error', 'Name and URL are required fields')
      return
    }

    // Create new portal input
    const newPortalInput: CreatePortalInput = {
      name: formData.name,
      url: formData.url,
      description: formData.description,
      category: formData.category,
      status: PortalStatus.OPERATIONAL,
      environment: formData.environment,
      priority: formData.priority,
      authType: formData.authType,
      tags: formData.tags,
      isFavorite: false,
      isPublic: false,
      config: {
        healthCheckEndpoint: `${formData.url}/health`,
        healthCheckInterval: 30,
        timeout: 5000,
        retryAttempts: 3,
        retryDelay: 1000,
        enableMonitoring: true,
        enableAlerts: true,
        enableAutoRecovery: false
      }
    }

    addPortal(newPortalInput)
    showSuccess('Portal Added', `${formData.name} has been added successfully`)

    // Reset form
    setFormData({
      name: '',
      url: '',
      description: '',
      category: PortalCategory.BUSINESS,
      environment: PortalEnvironment.PRODUCTION,
      priority: PortalPriority.MEDIUM,
      authType: AuthType.OAUTH,
      tags: [],
      tagInput: ''
    })

    onClose()
  }

  const handleAddTag = () => {
    if (formData.tagInput && !formData.tags.includes(formData.tagInput)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput],
        tagInput: ''
      })
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Portal</DialogTitle>
          <DialogDescription>
            Register a new service portal for monitoring and management.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Portal Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Finance Portal"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Portal URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://portal.internal"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the portal's purpose..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as PortalCategory })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PortalCategory).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Select
                value={formData.environment}
                onValueChange={(value) => setFormData({ ...formData, environment: value as PortalEnvironment })}
              >
                <SelectTrigger id="environment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PortalEnvironment).map(env => (
                    <SelectItem key={env} value={env}>{env}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as PortalPriority })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PortalPriority).map(priority => (
                    <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="authType">Authentication Type</Label>
              <Select
                value={formData.authType}
                onValueChange={(value) => setFormData({ ...formData, authType: value as AuthType })}
              >
                <SelectTrigger id="authType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AuthType).map(auth => (
                    <SelectItem key={auth} value={auth}>{auth}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={formData.tagInput}
                onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                placeholder="Add a tag..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add Tag
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Portal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}