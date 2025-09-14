import { useParams, useNavigate, Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout'
import { usePortalStore } from '@/stores/usePortalStore'
import { PortalStatus } from '@/types'
import { ArrowLeft, ExternalLink, Heart, RefreshCw, Settings, Shield, Activity, Cpu, HardDrive, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const PortalDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { portals, toggleFavorite } = usePortalStore()

  const portal = portals.find(p => p.id === Number(id))

  if (!portal) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-semibold mb-4">Portal not found</h2>
          <Link to="/" className="text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </AppLayout>
    )
  }

  const getStatusColor = (status: PortalStatus) => {
    switch (status) {
      case PortalStatus.OPERATIONAL: return 'bg-green-500'
      case PortalStatus.DEGRADED: return 'bg-yellow-500'
      case PortalStatus.MAINTENANCE: return 'bg-orange-500'
      case PortalStatus.OUTAGE: return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusBadge = (status: PortalStatus) => {
    const colors = {
      [PortalStatus.OPERATIONAL]: 'default',
      [PortalStatus.DEGRADED]: 'warning',
      [PortalStatus.MAINTENANCE]: 'secondary',
      [PortalStatus.OUTAGE]: 'destructive'
    }
    return <Badge variant={colors[status] as any}>{status}</Badge>
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{portal.name}</h1>
              <p className="text-muted-foreground">{portal.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(portal.id)}
            >
              <Heart className={`h-4 w-4 ${portal.favorited ? 'fill-current text-red-500' : ''}`} />
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
            <Button size="sm" onClick={() => window.open(portal.url, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Portal
            </Button>
          </div>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Portal Status</CardTitle>
            <CardDescription>Current operational status and health metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(portal.status)} animate-pulse`} />
                  {getStatusBadge(portal.status)}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Response Time</span>
                <p className="text-2xl font-bold">{portal.responseTime}ms</p>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <p className="text-2xl font-bold">{portal.uptime}%</p>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Last Checked</span>
                <p className="text-sm">{new Date(portal.lastChecked).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Tabs */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Real-time performance monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span className="font-mono">{portal.cpu}%</span>
                  </div>
                  <Progress value={portal.cpu} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span className="font-mono">{portal.memory}%</span>
                  </div>
                  <Progress value={portal.memory} className="h-2" />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Total Requests</span>
                    <p className="text-2xl font-bold">{portal.requests.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Error Rate</span>
                    <p className="text-2xl font-bold text-red-500">{portal.errors}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>Infrastructure and resource consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <Cpu className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">CPU Cores</p>
                      <p className="text-2xl font-bold">4 vCPUs</p>
                      <p className="text-xs text-muted-foreground">{portal.cpu}% utilized</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <HardDrive className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Memory</p>
                      <p className="text-2xl font-bold">16 GB</p>
                      <p className="text-xs text-muted-foreground">{portal.memory}% utilized</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Activity className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Network</p>
                      <p className="text-2xl font-bold">1.2 GB/s</p>
                      <p className="text-xs text-muted-foreground">Bandwidth usage</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Information</CardTitle>
                <CardDescription>Authentication and security configurations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Authentication Type</p>
                      <p className="text-sm text-muted-foreground">{portal.authType}</p>
                    </div>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Security Features</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">SSL/TLS Enabled</Badge>
                    <Badge variant="secondary">2FA Required</Badge>
                    <Badge variant="secondary">IP Whitelisting</Badge>
                    <Badge variant="secondary">Rate Limiting</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>User activity and access logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Active Users</p>
                        <p className="text-sm text-muted-foreground">Current session count</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold">127</p>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Recent Access Logs</p>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          User {1000 + i} accessed portal
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {i + 1} minutes ago
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Portal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Environment</span>
                <Badge variant="outline">{portal.environment}</Badge>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Priority</span>
                <Badge variant="outline">{portal.priority}</Badge>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Tags</span>
              <div className="flex flex-wrap gap-2">
                {portal.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}