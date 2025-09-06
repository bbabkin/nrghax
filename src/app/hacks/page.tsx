import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HacksPage() {
  const hacks = [
    {
      id: 1,
      title: 'Authentication Flow',
      description: 'Secure user authentication with email/password and OAuth providers',
      category: 'Security',
    },
    {
      id: 2,
      title: 'Database Patterns',
      description: 'Best practices for database schema design and RLS policies',
      category: 'Backend',
    },
    {
      id: 3,
      title: 'UI Components',
      description: 'Reusable components with shadcn/ui and Tailwind CSS',
      category: 'Frontend',
    },
  ]

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Hacks & Tips</h1>
        <p className="text-muted-foreground mb-8">
          Collection of useful patterns and best practices
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hacks.map((hack) => (
            <Card key={hack.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {hack.category}
                  </span>
                </div>
                <CardTitle className="text-xl">{hack.title}</CardTitle>
                <CardDescription>{hack.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <button className="text-sm text-primary hover:underline">
                  Learn more →
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}