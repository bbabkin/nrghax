'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

export default function SyncButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [syncResult, setSyncResult] = useState<any>(null)

  const checkSyncStatus = async () => {
    try {
      const response = await fetch('/api/discord/sync')
      if (response.ok) {
        const data = await response.json()
        setSyncStatus(data)
      }
    } catch (error) {
      console.error('Failed to check sync status:', error)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/discord/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()
      setSyncResult(result)

      // Refresh status after sync
      await checkSyncStatus()
    } catch (error) {
      setSyncResult({
        success: false,
        error: 'Failed to sync with Discord'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open)
    if (open) {
      await checkSyncStatus()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Zap className="h-4 w-4 mr-2" />
          Sync with Discord
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Discord Sync</DialogTitle>
          <DialogDescription>
            Synchronize your tags between the web app and Discord
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Status */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Discord Connection</span>
              {syncStatus?.discordConnected ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </div>
            {syncStatus?.discordUsername && (
              <p className="text-sm text-muted-foreground">
                Discord: {syncStatus.discordUsername}
              </p>
            )}
            {syncStatus?.lastSyncAt && (
              <p className="text-sm text-muted-foreground">
                Last sync: {new Date(syncStatus.lastSyncAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Tags Needing Sync */}
          {syncStatus?.tagsNeedingSync && syncStatus.tagsNeedingSync.length > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
              <p className="text-sm font-medium mb-2">Tags pending sync:</p>
              <div className="flex flex-wrap gap-1">
                {syncStatus.tagsNeedingSync.map((ut: any) => (
                  <Badge key={ut.tag_id} variant="outline" className="text-xs">
                    {ut.tags.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Sync Result */}
          {syncResult && (
            <div className={`p-4 rounded-lg ${
              syncResult.success ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'
            }`}>
              {syncResult.success ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Sync completed successfully</span>
                  </div>
                  {syncResult.added?.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Added: {syncResult.added.join(', ')}
                    </p>
                  )}
                  {syncResult.removed?.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Removed: {syncResult.removed.join(', ')}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">{syncResult.error || 'Sync failed'}</span>
                </div>
              )}
            </div>
          )}

          {/* Sync Button */}
          <Button
            onClick={handleSync}
            disabled={isSyncing || !syncStatus?.discordConnected}
            className="w-full"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>

          {!syncStatus?.discordConnected && (
            <p className="text-sm text-center text-muted-foreground">
              Connect your Discord account in Account Settings to enable sync
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}