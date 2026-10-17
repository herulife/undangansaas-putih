import type { AuthUser } from '../../app/types'
import { DashboardIcon } from '../../components/dashboard-icons'
import { dashboardModuleGroups, dashboardModules } from './dashboardModules'

export function DashboardSidebar({
  activeModule,
  authUser,
  logout,
}: {
  activeModule: string
  authUser: AuthUser | null
  logout: () => void
}) {
  const displayName = authUser?.displayName || authUser?.email || 'User'
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U'

  return (
    <aside className="saas-sidebar">
      <a className="sidebar-brand brand-link" href="/">
        <span className="brand-image"><DashboardIcon name="wallet" /></span>
        <b>LinkUndang</b>
      </a>
      <div className="sidebar-user user-panel">
        <div className="avatar">{initials}</div>
        <div>
          <strong>{displayName}</strong>
          <p><span /> Online</p>
          <small>{authUser?.role === 'admin' ? 'SUPERADMIN' : 'USER'} - {(authUser?.tier ?? 'free').toUpperCase()}</small>
        </div>
      </div>
      <nav className="sidebar-menu">
        {dashboardModuleGroups.map((group) => (
          <div className="nav-treeview" key={group}>
            <p>{group}</p>
            {dashboardModules
              .filter((item) => item.group === group)
              .map((item) => {
                const content = (
                  <>
                    <span className="nav-icon"><DashboardIcon name={item.icon} /></span>
                    <strong>{item.label}</strong>
                  </>
                )
                return item.id === 'logout' ? (
                  <button className="sidebar-logout-link" key={item.id} onClick={logout} type="button">
                    {content}
                  </button>
                ) : (
                  <a className={activeModule === item.id ? 'active' : ''} href={item.href} key={item.id}>
                    {content}
                  </a>
                )
              })}
          </div>
        ))}
      </nav>
      <div className="sidebar-upgrade">
        <strong>Upgrade Pro!</strong>
        <p>Higher productivity with better organization.</p>
        <a href="/dashboard/langganan"><DashboardIcon name="subscription" /> Upgrade</a>
      </div>
    </aside>
  )
}
