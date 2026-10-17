

export const dashboardModules = [
  { group: 'MAIN MENU', id: 'undangan', label: 'Dashboard', href: '/dashboard/undangan', icon: 'overview' },
  { group: 'MAIN MENU', id: 'transaksi', label: 'Transaksi', href: '/dashboard/transaksi', icon: 'payment' },
  { group: 'MAIN MENU', id: 'langganan', label: 'Langganan', href: '/dashboard/langganan', icon: 'subscription' },
  { group: 'FEATURES', id: 'template', label: 'Template', href: '/dashboard/template', icon: 'builder' },
  { group: 'FEATURES', id: 'media', label: 'Media & AI', href: '/dashboard/media', icon: 'image' },
  { group: 'FEATURES', id: 'builder', label: 'Builder', href: '/dashboard/builder', icon: 'settings' },
  { group: 'FEATURES', id: 'tamu', label: 'Tamu', href: '/dashboard/tamu', icon: 'group' },
  { group: 'FEATURES', id: 'checkin', label: 'Check-in', href: '/dashboard/checkin', icon: 'checkin' },
  { group: 'FEATURES', id: 'domain', label: 'Domain', href: '/dashboard/domain', icon: 'globe' },
  { group: 'GENERAL', id: 'report', label: 'Laporan', href: '/dashboard/report', icon: 'report' },
  { group: 'GENERAL', id: 'pengaturan', label: 'Pengaturan', href: '/dashboard/pengaturan', icon: 'settings' },
  { group: 'GENERAL', id: 'logout', label: 'Keluar', href: '#logout', icon: 'logout' },
]

export const dashboardModuleGroups = ['MAIN MENU', 'FEATURES', 'GENERAL']

export function getDashboardModule(pathname: string) {
  const module = pathname.split('/').filter(Boolean)[1]
  return dashboardModules.some((item) => item.id === module) ? module : 'undangan'
}
