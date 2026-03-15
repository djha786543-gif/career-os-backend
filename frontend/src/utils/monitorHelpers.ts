export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  return `${diffDays} days ago`
}

export function countryFlag(country: string): string {
  const flags: Record<string, string> = {
    'USA': '🇺🇸', 'UK': '🇬🇧', 'Germany': '🇩🇪',
    'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Canada': '🇨🇦',
    'Singapore': '🇸🇬', 'Australia': '🇦🇺', 'India': '🇮🇳',
    'France': '🇫🇷', 'Netherlands': '🇳🇱'
  }
  return flags[country] || '🌍'
}

export function sourceBadgeLabel(apiType: string): string {
  const labels: Record<string, string> = {
    'websearch': 'Web Search',
    'usajobs': 'USAJobs.gov',
    'rss': 'RSS Feed',
    'adzuna': 'Adzuna',
    'natureJobs': 'Nature Jobs'
  }
  return labels[apiType] || apiType
}
