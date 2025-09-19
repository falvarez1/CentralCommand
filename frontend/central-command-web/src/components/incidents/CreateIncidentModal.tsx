import React, { useState } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { AlertCircle, Info, Plus, X } from 'lucide-react';
import {
  IncidentSeverity,
  IncidentType,
  IncidentStatus,
  CreateIncidentInput
} from '../../types/incident.types';
// import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateIncident?: (incident: CreateIncidentInput) => void;
  portals?: Array<{ id: string; name: string; }>;
}

// Form validation schema
const createIncidentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
  severity: z.nativeEnum(IncidentSeverity),
  type: z.nativeEnum(IncidentType),
  affectedPortals: z.array(z.string()).min(1, 'Select at least one affected portal'),
  affectedServices: z.array(z.string()),
  impactedUsers: z.number().min(0).optional(),
  tags: z.array(z.string()),
  isPublic: z.boolean()
});

export const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  isOpen,
  onClose,
  onCreateIncident,
  portals = []
}) => {
  const [formData, setFormData] = useState<Partial<CreateIncidentInput>>({
    title: '',
    description: '',
    severity: IncidentSeverity.Medium,
    type: IncidentType.Service,
    status: IncidentStatus.Open,
    affectedPortals: [],
    affectedServices: [],
    impactedUsers: 0,
    tags: [],
    isPublic: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newService, setNewService] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // Validate form data
      const validatedData = createIncidentSchema.parse(formData);

      // Create the incident
      if (onCreateIncident) {
        onCreateIncident(validatedData as CreateIncidentInput);
      }

      toast.success('Incident created successfully', {
        description: `${validatedData.title} has been reported`
      });

      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error('Failed to create incident', {
          description: 'Please try again later'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addService = () => {
    if (newService && !formData.affectedServices?.includes(newService)) {
      setFormData({
        ...formData,
        affectedServices: [...(formData.affectedServices || []), newService]
      });
      setNewService('');
    }
  };

  const removeService = (service: string) => {
    setFormData({
      ...formData,
      affectedServices: formData.affectedServices?.filter(s => s !== service) || []
    });
  };

  const addTag = () => {
    if (newTag && !formData.tags?.includes(newTag)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag]
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || []
    });
  };

  const togglePortal = (portalId: string) => {
    const currentPortals = formData.affectedPortals || [];
    if (currentPortals.includes(portalId)) {
      setFormData({
        ...formData,
        affectedPortals: currentPortals.filter(p => p !== portalId)
      });
    } else {
      setFormData({
        ...formData,
        affectedPortals: [...currentPortals, portalId]
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Incident</DialogTitle>
          <DialogDescription>
            Report a new incident to track and resolve system issues
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the incident"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the incident"
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Severity and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value as IncidentSeverity })}
              >
                <SelectTrigger id="severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={IncidentSeverity.Critical}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Critical
                    </div>
                  </SelectItem>
                  <SelectItem value={IncidentSeverity.High}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value={IncidentSeverity.Medium}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value={IncidentSeverity.Low}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Low
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as IncidentType })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={IncidentType.Outage}>Outage</SelectItem>
                  <SelectItem value={IncidentType.Performance}>Performance</SelectItem>
                  <SelectItem value={IncidentType.Security}>Security</SelectItem>
                  <SelectItem value={IncidentType.Database}>Database</SelectItem>
                  <SelectItem value={IncidentType.Service}>Service</SelectItem>
                  <SelectItem value={IncidentType.Infrastructure}>Infrastructure</SelectItem>
                  <SelectItem value={IncidentType.Network}>Network</SelectItem>
                  <SelectItem value={IncidentType.Maintenance}>Maintenance</SelectItem>
                  <SelectItem value={IncidentType.Configuration}>Configuration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Affected Portals */}
          <div className="space-y-2">
            <Label>Affected Portals *</Label>
            <div className="border rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
              {portals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No portals available</p>
              ) : (
                portals.map(portal => (
                  <div key={portal.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`portal-${portal.id}`}
                      checked={formData.affectedPortals?.includes(portal.id) || false}
                      onCheckedChange={() => togglePortal(portal.id)}
                    />
                    <label
                      htmlFor={`portal-${portal.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {portal.name}
                    </label>
                  </div>
                ))
              )}
            </div>
            {errors.affectedPortals && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.affectedPortals}
              </p>
            )}
          </div>

          {/* Affected Services */}
          <div className="space-y-2">
            <Label>Affected Services</Label>
            <div className="flex gap-2">
              <Input
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                placeholder="Add a service"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addService();
                  }
                }}
              />
              <Button type="button" onClick={addService} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.affectedServices && formData.affectedServices.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.affectedServices.map(service => (
                  <Badge key={service} variant="secondary" className="pl-2">
                    {service}
                    <button
                      type="button"
                      onClick={() => removeService(service)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Impacted Users */}
          <div className="space-y-2">
            <Label htmlFor="impactedUsers">Estimated Impacted Users</Label>
            <Input
              id="impactedUsers"
              type="number"
              value={formData.impactedUsers || 0}
              onChange={(e) => setFormData({ ...formData, impactedUsers: parseInt(e.target.value) || 0 })}
              min="0"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="pl-2">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Public Incident */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublic"
              checked={formData.isPublic || false}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked as boolean })}
            />
            <Label htmlFor="isPublic" className="flex items-center gap-2">
              Make this incident public
              <Info className="w-3 h-3 text-muted-foreground" />
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Incident'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateIncidentModal;