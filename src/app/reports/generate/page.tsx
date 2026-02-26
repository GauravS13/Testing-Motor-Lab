'use client'

import { getDistinctModelNames, getReportData } from "@/actions/tested-data"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { TestedDataRow } from "@/types/test-session"
import { useFormik } from "formik"
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  FolderOpen,
  Loader2,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import * as XLSX from "xlsx"
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
   Excel Helpers
   ═══════════════════════════════════════════════════════ */

/** Month names used for folder naming */
const MONTH_NAMES = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
]

/** Format a Date to "DD-MM-YYYY hh:mm:ss AM/PM" */
function formatDateTime(date: Date | string | null): string {
  if (!date) return "-"
  const d = new Date(date)
  if (isNaN(d.getTime())) return "-"

  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()

  let hours = d.getHours()
  const ampm = hours >= 12 ? "PM" : "AM"
  hours = hours % 12 || 12
  const mins = String(d.getMinutes()).padStart(2, "0")
  const secs = String(d.getSeconds()).padStart(2, "0")

  return `${day}-${month}-${year} ${hours}:${mins}:${secs} ${ampm}`
}

/** Convert a boolean result to readable text */
function formatResult(val: boolean | null): string {
  if (val === true) return "PASS"
  if (val === false) return "FAIL"
  return "-"
}

/** Map a raw TestedDataRow to a flat object for the Excel sheet */
function toExcelRow(row: TestedDataRow) {
  return {
    "Sr No": row.srNo ?? "-",
    "Model": row.modelName ?? "-",
    "Serial No": row.serialNo ?? "-",
    "Date & Time": formatDateTime(row.dateTime),
    "Before IR (MΩ)": row.beforeInsulationRes ?? "-",
    "Before IR Result": formatResult(row.result),
    "Voltage (V)": row.voltage ?? "-",
    "Current (A)": row.currentAmp ?? "-",
    "Power (W)": row.power ?? "-",
    "Freq (Hz)": row.frequency ?? "-",
    "No Load Result": formatResult(row.result3),
    "After IR (MΩ)": row.afterInsulationRes ?? "-",
    "After IR Result": formatResult(row.result2),
    "Final Result": formatResult(row.finalResult),
  }
}

/** Get or create a sub-directory by name */
async function getOrCreateDir(
  parent: FileSystemDirectoryHandle,
  name: string,
): Promise<FileSystemDirectoryHandle> {
  return parent.getDirectoryHandle(name, { create: true })
}

/** Write an XLSX workbook as a file in the given directory, appending if it exists */
async function writeExcelFile(
  dir: FileSystemDirectoryHandle,
  filename: string,
  newRows: TestedDataRow[],
) {
  let existingData: Record<string, any>[] = []

  try {
    // Try to get the existing file. If it throws, it doesn't exist.
    const fileHandle = await dir.getFileHandle(filename)
    const file = await fileHandle.getFile()
    const buffer = await file.arrayBuffer()

    // Read the existing workbook
    const existingWb = XLSX.read(buffer, { type: "array" })
    const sheetName = existingWb.SheetNames[0]
    
    // Parse existing data if a sheet exists
    if (sheetName) {
      const ws = existingWb.Sheets[sheetName]
      if (ws) {
        existingData = XLSX.utils.sheet_to_json(ws)
      }
    }
  } catch (error) {
    // File doesn't exist yet, which is fine. We start fresh.
  }

  // Combine old data and the newly formatted data
  const newDataFormatted = newRows.map(toExcelRow)
  const combinedData = [...existingData, ...newDataFormatted]

  const ws = XLSX.utils.json_to_sheet(combinedData)

  // Auto-fit column widths based on header + data
  const headers = Object.keys(combinedData[0] || {})
  ws["!cols"] = headers.map((h) => {
    const maxLen = Math.max(
      h.length,
      ...combinedData.map((r) => String((r as Record<string, unknown>)[h] ?? "").length)
    )
    return { wch: maxLen + 2 }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Test Results")
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer

  const fileHandle = await dir.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(buf)
  await writable.close()
}

/**
 * Group rows by date string (YYYY-MM-DD).
 * Returns a Map<string, TestedDataRow[]>
 */
function groupByDate(rows: TestedDataRow[]): Map<string, TestedDataRow[]> {
  const map = new Map<string, TestedDataRow[]>()
  for (const row of rows) {
    const d = row.dateTime ? new Date(row.dateTime) : null
    const key = d
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      : "unknown"
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(row)
  }
  return map
}

/**
 * Group rows by model name.
 * Returns a Map<string, TestedDataRow[]>
 */
function groupByModel(rows: TestedDataRow[]): Map<string, TestedDataRow[]> {
  const map = new Map<string, TestedDataRow[]>()
  for (const row of rows) {
    const key = row.modelName || "Unknown Model"
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(row)
  }
  return map
}

/**
 * Model-wise export:
 *   <base>/ModelName/Year/Month/Date.xlsx
 */
async function exportModelWise(
  baseDir: FileSystemDirectoryHandle,
  data: TestedDataRow[],
  modelName: string,
): Promise<number> {
  let fileCount = 0
  const modelDir = await getOrCreateDir(baseDir, modelName)
  const byDate = groupByDate(data)

  for (const [dateKey, rows] of byDate) {
    const d = new Date(dateKey)
    const yearDir = await getOrCreateDir(modelDir, String(d.getFullYear()))
    const monthDir = await getOrCreateDir(yearDir, MONTH_NAMES[d.getMonth()] ?? "Unknown Month")

    await writeExcelFile(monthDir, `${dateKey}.xlsx`, rows)
    fileCount++
  }
  return fileCount
}

/**
 * General export (all models):
 *   <base>/Year/Month/Date/ModelName.xlsx
 */
async function exportGeneral(
  baseDir: FileSystemDirectoryHandle,
  data: TestedDataRow[],
): Promise<number> {
  let fileCount = 0
  const byDate = groupByDate(data)

  for (const [dateKey, dateRows] of byDate) {
    const d = new Date(dateKey)
    const yearDir = await getOrCreateDir(baseDir, String(d.getFullYear()))
    const monthDir = await getOrCreateDir(yearDir, MONTH_NAMES[d.getMonth()] ?? "Unknown Month")
    const dateDir = await getOrCreateDir(monthDir, dateKey)

    const byModel = groupByModel(dateRows)
    for (const [model, modelRows] of byModel) {
      await writeExcelFile(dateDir, `${model}.xlsx`, modelRows)
      fileCount++
    }
  }
  return fileCount
}

/* ═══════════════════════════════════════════════════════
   Page Types
   ═══════════════════════════════════════════════════════ */

type ExportStage = "idle" | "fetching" | "pick-folder" | "writing" | "done" | "error"

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
  const [showPopup, setShowPopup] = useState(false)
  const [fetchedData, setFetchedData] = useState<TestedDataRow[]>([])

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

        // Step 1 — Fetch data in background
        setStage("fetching")
        const data = await getReportData(
          values.dateFrom,
          values.dateTo,
          values.model || undefined,
        )

        if (!data || data.length === 0) {
          setStage("error")
          setErrorMsg("No test records found for the selected filters.")
          return
        }

        setRecordCount(data.length)
        setFetchedData(data)

        // Step 2 — Show popup for folder selection
        setStage("pick-folder")
        setShowPopup(true)
      } catch {
        setStage("error")
        setErrorMsg("Failed to fetch report data. Please try again.")
      }
    },
  })

  /** Called when user clicks "Choose Folder" from the popup */
  const handlePickFolder = async () => {
    try {
      // Open native folder picker
      const dirHandle = await (window as any).showDirectoryPicker({ mode: "readwrite" }) as FileSystemDirectoryHandle

      setShowPopup(false)
      setStage("writing")

      // Step 3 — Write files
      let count = 0
      if (formik.values.model) {
        count = await exportModelWise(dirHandle, fetchedData, formik.values.model)
      } else {
        count = await exportGeneral(dirHandle, fetchedData)
      }

      setFileCount(count)
      setStage("done")
    } catch (err: unknown) {
      // User cancelled the picker
      if (err instanceof DOMException && err.name === "AbortError") {
        setShowPopup(false)
        setStage("idle")
        return
      }
      setShowPopup(false)
      setStage("error")
      setErrorMsg("Failed to save files. Please try again.")
    }
  }

  const resetState = () => {
    setStage("idle")
    setFileCount(0)
    setRecordCount(0)
    setErrorMsg("")
    setShowPopup(false)
    setFetchedData([])
  }

  return (
    <AppShell activeTab="Report">
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
                    disabled={stage === "fetching" || stage === "writing"}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 h-auto rounded-lg font-bold flex items-center space-x-3 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all text-[15px] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {stage === "fetching" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>Fetching Data...</span>
                      </>
                    ) : stage === "writing" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>Writing Files...</span>
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

          {/* Footer Info */}
          
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          Save Location Popup (Modal)
          ═══════════════════════════════════════════════════════ */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <h3 className="text-lg font-bold text-slate-900">Save Reports</h3>
              <button
                onClick={() => {
                  setShowPopup(false)
                  setStage("idle")
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{recordCount}</span> records found for
                {formik.values.model ? (
                  <> model <span className="font-semibold text-blue-600">{formik.values.model}</span></>
                ) : (
                  <span className="font-semibold text-blue-600"> all models</span>
                )}.
              </p>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Folder Structure</p>
                {formik.values.model ? (
                  <p className="text-sm text-slate-700 font-mono">
                    📁 {formik.values.model} / Year / Month / Date.xlsx
                  </p>
                ) : (
                  <p className="text-sm text-slate-700 font-mono">
                    📁 Year / Month / Date / ModelName.xlsx
                  </p>
                )}
              </div>

              <p className="text-xs text-slate-400">
                Choose a folder on your computer where the reports will be saved.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  setShowPopup(false)
                  setStage("idle")
                }}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePickFolder}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
              >
                <FolderOpen className="w-4 h-4" />
                Choose Folder
              </button>
            </div>
          </div>
        </div>
      )}

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
                Successfully exported <span className="font-semibold">{recordCount}</span> records into{" "}
                <span className="font-semibold">{fileCount}</span> Excel file{fileCount !== 1 ? "s" : ""}.
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
