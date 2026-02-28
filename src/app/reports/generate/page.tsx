'use client'

import { generateExportFiles } from "@/actions/export"
import { getDistinctModelNames } from "@/actions/tested-data"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { useFormik } from "formik"
import {
    ArrowRight,
    Calendar,
    CheckCircle2,
    ChevronDown,
    Loader2,
    X,
} from "lucide-react"
import { useEffect, useState } from "react"
import * as Yup from "yup"

/* ═══════════════════════════════════════════════════════
   Validation
   ═══════════════════════════════════════════════════════ */

const reportValidationSchema = Yup.object({
  model: Yup.string().optional(),
  dateFrom: Yup.string().required("Please select a start date"),
  dateTo: Yup.string()
    .required("Please select an end date")
    .test(
      "is-after-dateFrom",
      "End date must be on or after start date",
      function (value) {
        const { dateFrom } = this.parent
        if (!dateFrom || !value) return true
        return new Date(value) >= new Date(dateFrom)
      }
    ),
})

/* ═══════════════════════════════════════════════════════
   Page Types
   ═══════════════════════════════════════════════════════ */

type ExportStage = "idle" | "generating" | "done" | "error"

/* ═══════════════════════════════════════════════════════
   Page Component
   ═══════════════════════════════════════════════════════ */

export default function GenerateReportsPage() {
  const [models, setModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(true)

  // Export state
  const [stage, setStage] = useState<ExportStage>("idle")
  const [fileCount, setFileCount] = useState(0)
  const [recordCount, setRecordCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    getDistinctModelNames()
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false))
  }, [])

  const formik = useFormik({
    initialValues: {
      model: "",
      dateFrom: "",
      dateTo: "",
    },
    validationSchema: reportValidationSchema,
    onSubmit: async (values) => {
      try {
        setErrorMsg("")
        setStage("generating")
        
        const res = await generateExportFiles(
          values.dateFrom,
          values.dateTo,
          values.model || undefined
        )

        if (!res.success) {
          setStage("error")
          setErrorMsg(res.message || "Export failed")
          return
        }

        setRecordCount(res.recordCount)
        setFileCount(res.fileCount)
        setStage("done")
      } catch (err: any) {
        setStage("error")
        setErrorMsg(err.message || "Failed to generate report data. Please try again.")
      }
    },
  })

  const resetState = () => {
    setStage("idle")
    setFileCount(0)
    setRecordCount(0)
    setErrorMsg("")
  }

  return (
    <AppShell activeTab="Report">
      <div className="flex h-full flex-col items-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-4xl flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Generate Reports</h1>
            <p className="mt-2 text-slate-500">
              Select your preferred method to generate new excel reports. Files are automatically saved to D:/Reports.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8">
              <form onSubmit={formik.handleSubmit} className="flex flex-col flex-1 h-full">
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
                        name="model"
                        disabled={loadingModels}
                        value={formik.values.model}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full bg-slate-50 border rounded-lg py-3 px-4 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
                          formik.touched.model && formik.errors.model
                            ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                            : "border-slate-200"
                        }`}
                      >
                        <option value="">
                          {loadingModels ? "Loading models..." : "All Models"}
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
                    {formik.touched.model && formik.errors.model && (
                      <p className="text-xs text-red-500 font-medium mt-1">{formik.errors.model}</p>
                    )}
                  </div>

                  {/* Duration From */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="dateFrom">
                      Duration From
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        id="dateFrom"
                        name="dateFrom"
                        type="date"
                        value={formik.values.dateFrom}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full bg-slate-50 border rounded-lg py-3 pl-10 pr-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                          formik.touched.dateFrom && formik.errors.dateFrom
                            ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                            : "border-slate-200"
                        }`}
                      />
                    </div>
                    {formik.touched.dateFrom && formik.errors.dateFrom && (
                      <p className="text-xs text-red-500 font-medium mt-1">{formik.errors.dateFrom}</p>
                    )}
                  </div>

                  {/* Duration To */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="dateTo">
                      Duration To
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        id="dateTo"
                        name="dateTo"
                        type="date"
                        value={formik.values.dateTo}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full bg-slate-50 border rounded-lg py-3 pl-10 pr-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                          formik.touched.dateTo && formik.errors.dateTo
                            ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                            : "border-slate-200"
                        }`}
                      />
                    </div>
                    {formik.touched.dateTo && formik.errors.dateTo && (
                      <p className="text-xs text-red-500 font-medium mt-1">{formik.errors.dateTo}</p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-8 border-t border-slate-100 mt-auto flex justify-end">
                  <Button
                    type="submit"
                    disabled={stage === "generating"}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 h-auto rounded-lg font-bold flex items-center space-x-3 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all text-[15px] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {stage === "generating" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>Generating Reports...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Reports</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          Success Toast
          ═══════════════════════════════════════════════════════ */}
      {stage === "done" && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-green-200 rounded-xl shadow-2xl p-5 max-w-sm animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-slate-900">Reports Generated!</p>
              <p className="text-sm text-slate-600 mt-1">
                Successfully saved <span className="font-semibold">{recordCount}</span> records into{" "}
                <span className="font-semibold">{fileCount}</span> Excel file{fileCount !== 1 ? "s" : ""} at D:/Reports.
              </p>
            </div>
            <button
              onClick={resetState}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          Error Toast
          ═══════════════════════════════════════════════════════ */}
      {stage === "error" && errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-red-200 rounded-xl shadow-2xl p-5 max-w-sm animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3">
            <X className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-slate-900">Export Failed</p>
              <p className="text-sm text-slate-600 mt-1">{errorMsg}</p>
            </div>
            <button
              onClick={resetState}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}

