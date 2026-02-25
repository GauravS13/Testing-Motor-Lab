'use client'

import { getDistinctModelNames } from "@/actions/tested-data"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Calendar, ChevronDown, FileEdit, Folder, FolderOpen, Loader2, Plus } from "lucide-react"
import { useEffect, useState } from "react"

export default function GenerateReportsPage() {
  const [models, setModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(true)

  useEffect(() => {
    getDistinctModelNames()
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false))
  }, [])

  return (
    <AppShell activeTab="Generate Reports">
      <div className="flex h-full flex-col items-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-4xl flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Generate Reports</h1>
            <p className="mt-2 text-slate-500">
              Select your preferred method to generate new excel reports.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="manual" className="w-full h-full flex flex-col items-stretch">
              {/* Tab Headers */}
              <div className="flex border-b border-slate-200 flex-shrink-0">
                <TabsList className="bg-transparent p-0 h-auto space-x-0 flex rounded-none w-full">
                  <TabsTrigger
                    value="folder"
                    className="px-8 py-4 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-all rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50/30 data-[state=active]:shadow-none h-auto"
                  >
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="w-[18px] h-[18px]" />
                      <span>Folder Reporting</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="manual"
                    className="px-8 py-4 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-all rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50/30 data-[state=active]:shadow-none data-[state=active]:font-bold h-auto"
                  >
                    <div className="flex items-center space-x-2">
                      <FileEdit className="w-[18px] h-[18px]" />
                      <span>Manual Reporting</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Folder Tab Content */}
                <TabsContent value="folder" className="m-0 h-full flex flex-col p-8 md:p-12">
                  <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                      <Folder className="h-8 w-8 text-blue-500" fill="currentColor" fillOpacity={0.2} />
                    </div>
                    <h2 className="mb-2 text-xl font-semibold text-slate-900">Folder-based Report Generation</h2>
                    <p className="mb-8 max-w-md text-sm text-slate-500 leading-relaxed">
                      Folder-based report generation will be available here. Select a source folder to begin processing multiple files at once.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-6 font-medium text-[15px] h-11">
                        <Plus className="w-4 h-4 mr-2" />
                        Select Folder
                      </Button>
                      <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-[15px] h-11 px-6 shadow-sm">
                        View Documentation
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Manual Tab Content */}
                <TabsContent value="manual" className="m-0 h-full flex flex-col p-8">
                  {/* Section Title with Accent */}
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                      Manual Report Configuration
                    </h2>
                  </div>

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Model Selection - Full Width */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="model">
                        Model Selection
                      </label>
                      <div className="relative">
                        <select
                          id="model"
                          disabled={loadingModels}
                          defaultValue=""
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                        >
                          <option value="" disabled>
                            {loadingModels ? "Loading models..." : "Select Model"}
                          </option>
                          {models.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                          {loadingModels ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Duration From */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="date-from">
                        Duration From
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          id="date-from"
                          type="date"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Duration To */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="date-to">
                        Duration To
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          id="date-to"
                          type="date"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-8 border-t border-slate-100 mt-8 flex justify-end">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 h-auto rounded-lg font-bold flex items-center space-x-3 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all text-[15px]">
                      <span>Generate Reports</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Footer Info */}
          
        </div>
      </div>
    </AppShell>
  )
}
