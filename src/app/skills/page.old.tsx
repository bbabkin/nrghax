import { getLevelTree, getAllLevels } from '@/lib/levels/actions'
import { ClientLevelTree } from '@/components/levels'
import { getCurrentUser } from '@/lib/auth/user'
import { Trophy, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Progression Path - NRGHax',
  description: 'Master your skills through our gamified progression system',
}

export default async function LevelsPage() {
  const user = await getCurrentUser()

  // Get level tree for authenticated users, or static data for anonymous
  let tree = null
  let levels = null
  let prerequisites: Record<string, string[]> = {}

  if (user) {
    tree = await getLevelTree(user.id)
  } else {
    // Get static level data for anonymous users
    const allLevels = await getAllLevels()
    levels = allLevels.map((l) => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      description: l.description,
      icon: l.icon,
      position: l.position,
      required_hacks_count: l.required_hacks_count || 0,
      optional_hacks_count: l.optional_hacks_count || 0,
      total_hacks_count: l.total_hacks_count || 0,
    }))

    // Get prerequisites
    const supabase = await createClient()
    const { data: prereqData } = await supabase
      .from('level_prerequisites')
      .select('level_id, prerequisite_level_id')

    if (prereqData) {
      prereqData.forEach((p) => {
        if (!prerequisites[p.level_id]) {
          prerequisites[p.level_id] = []
        }
        prerequisites[p.level_id].push(p.prerequisite_level_id)
      })
    }
  }

  // Calculate overall progress
  const dataSource = tree || levels || []
  const totalLevels = dataSource.length
  const completedLevels = tree ? tree.filter(node => node.isCompleted).length : 0
  const inProgressLevels = tree ? tree.filter(node => !node.isCompleted && !node.isLocked && node.progressPercentage > 0).length : 0
  const lockedLevels = tree ? tree.filter(node => node.isLocked).length : dataSource.length

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full">
            <Trophy className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Your Progression Path
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Master fundamental habits and unlock advanced techniques through our structured learning path
        </p>
      </div>

      {/* Progress Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Completed</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {completedLevels}/{totalLevels}
                </p>
              </div>
              <div className="p-3 bg-green-200 dark:bg-green-800 rounded-full">
                <Trophy className="h-6 w-6 text-green-700 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">In Progress</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {inProgressLevels}
                </p>
              </div>
              <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-700 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Locked</p>
                <p className="text-3xl font-bold text-gray-700 dark:text-gray-300">
                  {lockedLevels}
                </p>
              </div>
              <div className="p-3 bg-gray-200 dark:bg-gray-800 rounded-full">
                <Target className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Levels Tree View */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Choose Your Path
        </h2>
        {!user && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Guest Mode:</strong> Your progress is saved locally in your browser.{' '}
              <a href="/auth/signin" className="underline hover:text-blue-600">
                Sign in
              </a>{' '}
              to sync your progress across devices and unlock additional features.
            </p>
          </div>
        )}
        <ClientLevelTree
          serverNodes={tree || undefined}
          levels={levels || undefined}
          prerequisites={prerequisites}
          isAuthenticated={!!user}
        />
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          How It Works
        </h3>
        <ul className="space-y-2 text-blue-800 dark:text-blue-200">
          <li className="flex items-start">
            <span className="font-semibold mr-2">1.</span>
            <span>Start with the Foundation level - it&apos;s unlocked for everyone</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">2.</span>
            <span>Complete all required hacks in a level to unlock dependent levels</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">3.</span>
            <span>Optional hacks provide extra value but aren&apos;t required for progression</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">4.</span>
            <span>Work toward the Mastery level by completing Direction, Movement, and Confidence</span>
          </li>
        </ul>
      </div>
    </div>
  )
}