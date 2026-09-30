// import { getDefaultDashboardRoute } from "@/lib/authUtils"
// import { getNavItemsByRole } from "@/lib/navItems"
// import { getUserInfo } from "@/services/auth.services"
// import { NavSection } from "@/types/dashboard.types"

// const DashboardNavbar = async () => {
//    const userInfo = await getUserInfo()
//     const navItems : NavSection[] = getNavItemsByRole(userInfo.role)
  
//     const dashboardHome = getDefaultDashboardRoute(userInfo.role)
//   return (
//     // <Dashboard userInfo={userInfo} navItems={navItems} dashboardHome={dashboardHome}/>
//   )
// }

// export default DashboardNavbar

import React from 'react'

export default function DashboardNavbar() {
  return (
    <div>DashboardNavbar</div>
  )
}
