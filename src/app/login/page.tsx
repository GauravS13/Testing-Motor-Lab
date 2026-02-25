'use client'

import { useLogin } from '@/hooks/useLogin'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, Lock, User } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>


export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const onSubmit = (data: LoginFormValues) => {
    login.mutate(data, {
      onSuccess: (result) => {
        if (result?.success) {
          router.push('/testing')
        }
      },
    })
  }

  const errorMessage =
    login.data && !login.data.success ? login.data.error : null

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      {/* ── Animated gradient background ── */}
      <div className="absolute inset-0 bg-gradient-subtle" />

      {/* ── Decorative floating shapes ── */}
      <div className="absolute top-[10%] left-[8%] h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl animate-float" />
      <div className="absolute bottom-[15%] right-[10%] h-96 w-96 rounded-full bg-purple-200/20 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-[60%] left-[50%] h-48 w-48 rounded-full bg-blue-200/25 blur-3xl animate-float" style={{ animationDelay: '0.8s' }} />

      {/* ── Login Card ── */}
      <div className="relative z-10 w-full max-w-[440px] animate-scale-in">
        <div className="glass-panel-strong rounded-2xl shadow-elevated">
          {/* Header */}
          <div className="space-y-1 px-7 pt-10 pb-2 text-center sm:px-9">
            <div className="mb-7 flex justify-center">
              <div className="relative h-24 w-64 transition-transform duration-300 hover:scale-105">
                 <Image 
                  src="/logo-motor.png" 
                  alt="MotorLabPro Logo" 
                  fill 
                  className="object-contain drop-shadow-lg" 
                />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl animate-slide-up stagger-1">
              Motor Testing Lab
            </h1>
            <p className="text-sm text-slate-500 animate-slide-up stagger-2">
              Enter your credentials to access the dashboard
            </p>
          </div>

          {/* Form */}
          <div className="px-7 pt-7 pb-5 sm:px-9">
            {/* Error handling is now done via toast notifications */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Username */}
              <div className="space-y-1.5 animate-slide-up stagger-3">
                <label htmlFor="username" className="block text-sm font-semibold text-slate-700">
                  Username
                </label>
                <div className="group relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
                  <input
                    id="username"
                    placeholder="Enter your username"
                    autoComplete="username"
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 pl-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register('username')}
                  />
                </div>
                {errors.username && (
                  <p className="flex items-center gap-1 text-sm text-red-500 animate-slide-down">
                    <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5 animate-slide-up stagger-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  {/* <a
                    href="#"
                    className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-800 hover:underline"
                    onClick={(e) => e.preventDefault()}
                  >
                    Forgot password?
                  </a> */}
                </div>
                <div className="group relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="flex items-center gap-1 text-sm text-red-500 animate-slide-down">
                    <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="animate-slide-up stagger-5">
                <button
                  type="submit"
                  disabled={login.isPending}
                  className="group flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:from-indigo-700 hover:to-indigo-800 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md active:translate-y-0"
                >
                  {login.isPending ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center gap-1 rounded-b-2xl border-t border-slate-100 bg-slate-50/50 px-7 py-4 text-center text-xs sm:px-9">
            <p className="font-medium text-slate-600">Restricted Access · Authorized Personnel Only</p>
            <p className="text-slate-400">Version 0.0.1 (Build 0001)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
