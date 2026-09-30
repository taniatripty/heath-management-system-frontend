
import DashboardNavbar from "@/components/module/Dashboard/DashboardNavbar"
import DashboardSiderbar from "@/components/module/Dashboard/DashboardSiderbar"
import React from "react"

const RootDashboardLayout = async ({children} : {children: React.ReactNode}) => {
  return (
    <div className="flex h-screen overflow-hidden">
        {/* Dashboard Sidebar */}
        <DashboardSiderbar></DashboardSiderbar>

        <div className="flex flex-1 flex-col overflow-hidden">
            {/* DashboardNavbar */}
           <DashboardNavbar></DashboardNavbar>
            {/* Dashboard Content */}
            <main className="flex-1 overflow-y-auto bg-muted/10 p-4 md:p-6">
                <div>
                    {children}
                </div>
            </main>
        </div>
    </div>
  )
}

export default RootDashboardLayout