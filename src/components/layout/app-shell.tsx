'use client'

import { Button } from "@/components/ui/button"
import { useLogout, useSessionUser } from "@/hooks/useLogin"
import { LogOut, Menu, User, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface AppShellProps {
  children: React.ReactNode
  activeTab?: string
}

export function AppShell({ children, activeTab }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>('')
  const userData = useSessionUser()
  const logout = useLogout()
  const router = useRouter()

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = '/login'
      }
    })
  }

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      )
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  const navTabs = [
    { name: "Testing", href: "/testing", role: "all" as const },
    { name: "Results", href: "/results", role: "admin" as const },
    { name: "Upload Excel", href: "/upload-excel", role: "admin" as const },
    { name: "Report", href: "/reports/generate", role: "admin" as const },
  ]

  const userType = userData?.user?.userType
  const visibleTabs = navTabs.filter(
    tab => tab.role === 'all' || userType === 1
  )

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-sm">
      {/* ───────── HEADER ───────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-xl px-4 py-2.5 shadow-sm sm:px-5">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Brand */}
          <Link href="/testing" className="group flex items-center gap-2.5">
            <div className="relative h-12 w-32 overflow-hidden transition-transform duration-200 group-hover:scale-105">
              <Image 
                src="/logo-motor.png" 
                alt="MotorLabPro Logo" 
                fill 
                className="object-contain object-left" 
              />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">
              Motor<span className="text-indigo-600">LabPro</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden gap-1 md:flex">
            {visibleTabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.name
                    ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* User */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden items-center gap-2.5 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-slate-700">
              {userData?.user?.userName || 'User'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={logout.isPending}
            className="h-8 w-8 rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ───────── MOBILE NAV ───────── */}
      {mobileMenuOpen && (
        <nav className="flex flex-col border-b border-slate-200 bg-white px-4 py-2 shadow-sm md:hidden animate-slide-down">
          {visibleTabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.name
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              {tab.name}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-2.5 border-t border-slate-100 px-3 pt-3 pb-1 text-sm text-slate-600 sm:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <User className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium">Engineer J. Doe</span>
          </div>
        </nav>
      )}

      {/* ───────── BODY ───────── */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>

      {/* ───────── FOOTER ───────── */}
      <footer className="shrink-0 flex items-center justify-between border-t border-slate-200 bg-slate-800 px-4 py-2 text-xs text-slate-400 sm:px-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <span className="text-slate-300">System Online</span>
          </div>
          <span className="hidden text-slate-600 sm:inline">|</span>
          <span className="hidden sm:inline">
            {currentTime && (
              <>🕒 <span className="font-medium text-slate-300">{currentTime}</span></>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden text-slate-500 sm:inline">MotorLabPro</span>
          <span className="hidden text-slate-600 sm:inline">·</span>
          <span className="text-slate-500">v0.0.1</span>
        </div>
      </footer>
    </div>
  )
}
