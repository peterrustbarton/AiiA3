
// Audit Logger v1.0.0
// Task Implementation Audit System for AiiA 3.0

export interface TaskAudit {
  taskId: string
  taskName: string
  category: 'Bug' | 'Enhancement'
  scope: string
  version: string
  timestamp: string
  affectedFiles: string[]
  changes: {
    file: string
    type: 'created' | 'modified' | 'deleted'
    linesChanged?: number
    description: string
  }[]
  rollbackInstructions: string[]
  testStatus?: 'pending' | 'passed' | 'failed'
  dependencies?: string[]
}

export interface ApiEfficiencyLog {
  timestamp: string
  apiName: string
  endpoint: string
  cacheStatus: 'hit' | 'miss' | 'error'
  responseTime: number
  rateLimitStatus: boolean
  errorDetails?: string
}

class AuditLogger {
  private static instance: AuditLogger
  private logs: Map<string, TaskAudit> = new Map()
  private apiLogs: ApiEfficiencyLog[] = []

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  createTaskAudit(taskId: string, taskName: string, category: 'Bug' | 'Enhancement', scope: string): TaskAudit {
    const version = this.generateVersion()
    const audit: TaskAudit = {
      taskId,
      taskName,
      category,
      scope,
      version,
      timestamp: new Date().toISOString(),
      affectedFiles: [],
      changes: [],
      rollbackInstructions: [],
      testStatus: 'pending'
    }
    
    this.logs.set(taskId, audit)
    return audit
  }

  addChange(taskId: string, file: string, type: 'created' | 'modified' | 'deleted', description: string, linesChanged?: number) {
    const audit = this.logs.get(taskId)
    if (audit) {
      if (!audit.affectedFiles.includes(file)) {
        audit.affectedFiles.push(file)
      }
      audit.changes.push({
        file,
        type,
        linesChanged,
        description
      })
    }
  }

  addRollbackInstruction(taskId: string, instruction: string) {
    const audit = this.logs.get(taskId)
    if (audit) {
      audit.rollbackInstructions.push(instruction)
    }
  }

  logApiCall(apiName: string, endpoint: string, cacheStatus: 'hit' | 'miss' | 'error', responseTime: number, rateLimitStatus: boolean, errorDetails?: string) {
    this.apiLogs.push({
      timestamp: new Date().toISOString(),
      apiName,
      endpoint,
      cacheStatus,
      responseTime,
      rateLimitStatus,
      errorDetails
    })
  }

  async saveTaskAudit(taskId: string): Promise<void> {
    const audit = this.logs.get(taskId)
    if (!audit) return

    const filename = `task_${taskId}_audit_v${audit.version}.json`
    const fs = require('fs').promises
    const path = require('path')
    
    try {
      const auditPath = path.join(process.cwd(), 'audits', filename)
      await fs.mkdir(path.dirname(auditPath), { recursive: true })
      await fs.writeFile(auditPath, JSON.stringify(audit, null, 2))
      console.log(`Audit saved: ${filename}`)
    } catch (error) {
      console.error(`Failed to save audit for ${taskId}:`, error)
    }
  }

  async saveApiEfficiencyLog(): Promise<void> {
    if (this.apiLogs.length === 0) return

    const timestamp = Date.now()
    const filename = `api_efficiency_log_v${timestamp}.json`
    const fs = require('fs').promises
    const path = require('path')
    
    try {
      const logPath = path.join(process.cwd(), 'audits', filename)
      await fs.mkdir(path.dirname(logPath), { recursive: true })
      await fs.writeFile(logPath, JSON.stringify({
        generatedAt: new Date().toISOString(),
        totalLogs: this.apiLogs.length,
        logs: this.apiLogs
      }, null, 2))
      console.log(`API efficiency log saved: ${filename}`)
      this.apiLogs = [] // Clear logs after saving
    } catch (error) {
      console.error('Failed to save API efficiency log:', error)
    }
  }

  private generateVersion(): string {
    return new Date().toISOString().replace(/[:.]/g, '_')
  }

  updateTestStatus(taskId: string, status: 'passed' | 'failed') {
    const audit = this.logs.get(taskId)
    if (audit) {
      audit.testStatus = status
    }
  }

  generateSummaryReport(): string {
    const tasks = Array.from(this.logs.values())
    const summary = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.testStatus === 'passed').length,
      failedTasks: tasks.filter(t => t.testStatus === 'failed').length,
      pendingTasks: tasks.filter(t => t.testStatus === 'pending').length,
      totalFilesModified: new Set(tasks.flatMap(t => t.affectedFiles)).size,
      tasksByCategory: {
        Bug: tasks.filter(t => t.category === 'Bug').length,
        Enhancement: tasks.filter(t => t.category === 'Enhancement').length
      }
    }
    
    return JSON.stringify(summary, null, 2)
  }
}

export const auditLogger = AuditLogger.getInstance()
