const { PDFDocument, rgb, StandardFonts } = require("pdf-lib")
const { pool } = require("../config/postgresql")
const watermark = require("../utils/watermark")
const crypto = require("crypto")

class ReportsController {
  // Generate digital watermark reports
  async generateReport(req, res) {
    try {
      const { reportType = "marks", format = "pdf" } = req.query
      const userId = req.user.id

      let reportData
      let reportTitle

      switch (reportType) {
        case "marks":
          reportData = await this.getMarksReportData(userId)
          reportTitle = "Academic Marks Report"
          break
        case "assignments":
          reportData = await this.getAssignmentReportData(userId)
          reportTitle = "Assignment Submission Report"
          break
        case "analytics":
          reportData = await this.getAnalyticsReportData(userId)
          reportTitle = "Student Analytics Report"
          break
        default:
          return res.status(400).json({ error: "Invalid report type" })
      }

      const documentId = crypto.randomUUID()
      const timestamp = new Date().toISOString()

      // Generate PDF report
      const pdfBuffer = await this.createPDFReport(reportData, reportTitle)

      // Add digital watermark
      const watermarkData = {
        userId,
        documentType: reportType,
        documentId,
        timestamp,
        title: reportTitle,
        institutionId: "academic-hub",
      }

      const watermarkedPDF = await watermark.addInvisibleWatermark(pdfBuffer, watermarkData)
      const finalPDF = await watermark.addVisibleWatermark(watermarkedPDF, watermarkData)

      // Store report metadata in database
      await pool.query(
        `INSERT INTO generated_reports 
         (id, user_id, report_type, title, document_hash, watermark_signature, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          documentId,
          userId,
          reportType,
          reportTitle,
          watermark.createDocumentHash(finalPDF, watermarkData),
          watermark.generateSignature(watermarkData).signature,
        ],
      )

      // Set response headers for PDF download
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${reportTitle.replace(/\s+/g, "_")}_${documentId.substring(0, 8)}.pdf"`,
      )
      res.setHeader("X-Document-ID", documentId)
      res.setHeader("X-Watermark-Version", "1.0")

      res.send(Buffer.from(finalPDF))
    } catch (error) {
      console.error("Report generation error:", error)
      res.status(500).json({ error: "Failed to generate report" })
    }
  }

  // Generate marks report
  async generateMarksReport(req, res) {
    try {
      const userId = req.user.id
      const reportData = await this.getMarksReportData(userId)

      const documentId = crypto.randomUUID()
      const timestamp = new Date().toISOString()

      // Create detailed marks report
      const pdfBuffer = await this.createMarksReportPDF(reportData, req.user)

      const watermarkData = {
        userId,
        documentType: "marks_report",
        documentId,
        timestamp,
        title: "Official Academic Transcript",
        institutionId: "academic-hub",
      }

      const watermarkedPDF = await watermark.addInvisibleWatermark(pdfBuffer, watermarkData)
      const finalPDF = await watermark.addVisibleWatermark(watermarkedPDF, watermarkData)

      // Store in database
      await pool.query(
        `INSERT INTO generated_reports 
         (id, user_id, report_type, title, document_hash, watermark_signature, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          documentId,
          userId,
          "marks_report",
          "Official Academic Transcript",
          watermark.createDocumentHash(finalPDF, watermarkData),
          watermark.generateSignature(watermarkData).signature,
        ],
      )

      res.setHeader("Content-Type", "application/pdf")
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Academic_Transcript_${documentId.substring(0, 8)}.pdf"`,
      )
      res.setHeader("X-Document-ID", documentId)

      res.send(Buffer.from(finalPDF))
    } catch (error) {
      console.error("Marks report generation error:", error)
      res.status(500).json({ error: "Failed to generate marks report" })
    }
  }

  // Generate assignment report
  async generateAssignmentReport(req, res) {
    try {
      const userId = req.user.id
      const reportData = await this.getAssignmentReportData(userId)

      const documentId = crypto.randomUUID()
      const timestamp = new Date().toISOString()

      const pdfBuffer = await this.createAssignmentReportPDF(reportData, req.user)

      const watermarkData = {
        userId,
        documentType: "assignment_report",
        documentId,
        timestamp,
        title: "Assignment Submission Log",
        institutionId: "academic-hub",
      }

      const watermarkedPDF = await watermark.addInvisibleWatermark(pdfBuffer, watermarkData)
      const finalPDF = await watermark.addVisibleWatermark(watermarkedPDF, watermarkData)

      await pool.query(
        `INSERT INTO generated_reports 
         (id, user_id, report_type, title, document_hash, watermark_signature, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          documentId,
          userId,
          "assignment_report",
          "Assignment Submission Log",
          watermark.createDocumentHash(finalPDF, watermarkData),
          watermark.generateSignature(watermarkData).signature,
        ],
      )

      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", `attachment; filename="Assignment_Report_${documentId.substring(0, 8)}.pdf"`)

      res.send(Buffer.from(finalPDF))
    } catch (error) {
      console.error("Assignment report generation error:", error)
      res.status(500).json({ error: "Failed to generate assignment report" })
    }
  }

  // Generate analytics report
  async generateAnalyticsReport(req, res) {
    try {
      const userId = req.user.id
      const reportData = await this.getAnalyticsReportData(userId)

      const documentId = crypto.randomUUID()
      const timestamp = new Date().toISOString()

      const pdfBuffer = await this.createAnalyticsReportPDF(reportData, req.user)

      const watermarkData = {
        userId,
        documentType: "analytics_report",
        documentId,
        timestamp,
        title: "Student Engagement Analytics",
        institutionId: "academic-hub",
      }

      const watermarkedPDF = await watermark.addInvisibleWatermark(pdfBuffer, watermarkData)
      const finalPDF = await watermark.addVisibleWatermark(watermarkedPDF, watermarkData)

      await pool.query(
        `INSERT INTO generated_reports 
         (id, user_id, report_type, title, document_hash, watermark_signature, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          documentId,
          userId,
          "analytics_report",
          "Student Engagement Analytics",
          watermark.createDocumentHash(finalPDF, watermarkData),
          watermark.generateSignature(watermarkData).signature,
        ],
      )

      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", `attachment; filename="Analytics_Report_${documentId.substring(0, 8)}.pdf"`)

      res.send(Buffer.from(finalPDF))
    } catch (error) {
      console.error("Analytics report generation error:", error)
      res.status(500).json({ error: "Failed to generate analytics report" })
    }
  }

  // Verify document watermark
  async verifyDocument(req, res) {
    try {
      const { documentId } = req.params
      const { signature } = req.query

      // Check if document exists in database
      const result = await pool.query("SELECT * FROM generated_reports WHERE id = $1", [documentId])

      if (result.rows.length === 0) {
        return res.status(404).json({
          valid: false,
          error: "Document not found",
        })
      }

      const document = result.rows[0]

      // Verify signature if provided
      if (signature) {
        const isValidSignature = signature === document.watermark_signature.substring(0, 16)

        if (!isValidSignature) {
          return res.status(400).json({
            valid: false,
            error: "Invalid signature",
          })
        }
      }

      res.json({
        valid: true,
        document: {
          id: document.id,
          type: document.report_type,
          title: document.title,
          createdAt: document.created_at,
          userId: document.user_id,
        },
        verification: {
          timestamp: new Date().toISOString(),
          method: "database_lookup",
        },
      })
    } catch (error) {
      console.error("Document verification error:", error)
      res.status(500).json({ error: "Verification failed" })
    }
  }

  // Get marks report data
  async getMarksReportData(userId) {
    const result = await pool.query(
      `SELECT 
         u.name as unit_name, u.code as unit_code,
         ar.score, ar.total_marks, ar.percentage,
         ar.created_at as assessment_date,
         'assessment' as type
       FROM assessment_results ar
       JOIN assessments a ON ar.assessment_id = a.id
       JOIN units u ON a.unit_id = u.id
       WHERE ar.user_id = $1
       UNION ALL
       SELECT 
         u.name as unit_name, u.code as unit_code,
         asg.grade as score, asg.total_marks, 
         (asg.grade::float / asg.total_marks * 100) as percentage,
         asg.graded_at as assessment_date,
         'assignment' as type
       FROM assignment_submissions asg
       JOIN assignments ass ON asg.assignment_id = ass.id
       JOIN units u ON ass.unit_id = u.id
       WHERE asg.user_id = $1 AND asg.grade IS NOT NULL
       ORDER BY assessment_date DESC`,
      [userId],
    )

    return result.rows
  }

  // Get assignment report data
  async getAssignmentReportData(userId) {
    const result = await pool.query(
      `SELECT 
         a.title, a.description, a.due_date,
         u.name as unit_name, u.code as unit_code,
         asub.submitted_at, asub.grade, asub.feedback,
         asub.status
       FROM assignment_submissions asub
       JOIN assignments a ON asub.assignment_id = a.id
       JOIN units u ON a.unit_id = u.id
       WHERE asub.user_id = $1
       ORDER BY asub.submitted_at DESC`,
      [userId],
    )

    return result.rows
  }

  // Get analytics report data
  async getAnalyticsReportData(userId) {
    const [engagementResult, performanceResult, activityResult] = await Promise.all([
      pool.query(
        `SELECT 
           COUNT(DISTINCT rd.resource_id) as resources_downloaded,
           COUNT(DISTINCT m.group_id) as groups_participated,
           COUNT(DISTINCT ar.assessment_id) as assessments_taken
         FROM users u
         LEFT JOIN resource_downloads rd ON u.id = rd.user_id
         LEFT JOIN messages m ON u.id = m.sender_id
         LEFT JOIN assessment_results ar ON u.id = ar.user_id
         WHERE u.id = $1`,
        [userId],
      ),
      pool.query(
        `SELECT 
           AVG(ar.percentage) as avg_assessment_score,
           AVG(CASE WHEN asub.grade IS NOT NULL THEN (asub.grade::float / asub.total_marks * 100) END) as avg_assignment_score
         FROM users u
         LEFT JOIN assessment_results ar ON u.id = ar.user_id
         LEFT JOIN assignment_submissions asub ON u.id = asub.user_id
         WHERE u.id = $1`,
        [userId],
      ),
      pool.query(
        `SELECT 
           DATE(created_at) as activity_date,
           COUNT(*) as activity_count
         FROM (
           SELECT created_at FROM messages WHERE sender_id = $1
           UNION ALL
           SELECT submitted_at as created_at FROM assignment_submissions WHERE user_id = $1
           UNION ALL
           SELECT created_at FROM assessment_results WHERE user_id = $1
         ) activities
         GROUP BY DATE(created_at)
         ORDER BY activity_date DESC
         LIMIT 30`,
        [userId],
      ),
    ])

    return {
      engagement: engagementResult.rows[0],
      performance: performanceResult.rows[0],
      activity: activityResult.rows,
    }
  }

  // Create PDF report
  async createPDFReport(data, title) {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const { width, height } = page.getSize()

    // Header
    page.drawText(title, {
      x: 50,
      y: height - 50,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    // Content
    let yPosition = height - 100
    page.drawText("Generated on: " + new Date().toLocaleString(), {
      x: 50,
      y: yPosition,
      size: 12,
      font,
      color: rgb(0.5, 0.5, 0.5),
    })

    yPosition -= 40
    page.drawText("This is a sample report with digital watermarking.", {
      x: 50,
      y: yPosition,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    })

    return await pdfDoc.save()
  }

  // Create detailed marks report PDF
  async createMarksReportPDF(data, user) {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const { width, height } = page.getSize()

    // Header
    page.drawText("OFFICIAL ACADEMIC TRANSCRIPT", {
      x: width / 2 - 120,
      y: height - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    // Student info
    let yPos = height - 100
    page.drawText(`Student: ${user.first_name} ${user.last_name}`, {
      x: 50,
      y: yPos,
      size: 12,
      font: boldFont,
    })

    yPos -= 20
    page.drawText(`Student ID: ${user.student_id || "N/A"}`, {
      x: 50,
      y: yPos,
      size: 12,
      font,
    })

    yPos -= 20
    page.drawText(`Email: ${user.email}`, {
      x: 50,
      y: yPos,
      size: 12,
      font,
    })

    // Marks table
    yPos -= 50
    page.drawText("ACADEMIC RESULTS", {
      x: 50,
      y: yPos,
      size: 14,
      font: boldFont,
    })

    yPos -= 30
    // Table headers
    page.drawText("Unit", { x: 50, y: yPos, size: 10, font: boldFont })
    page.drawText("Type", { x: 200, y: yPos, size: 10, font: boldFont })
    page.drawText("Score", { x: 300, y: yPos, size: 10, font: boldFont })
    page.drawText("Percentage", { x: 400, y: yPos, size: 10, font: boldFont })
    page.drawText("Date", { x: 480, y: yPos, size: 10, font: boldFont })

    yPos -= 20
    // Table data
    data.forEach((item, index) => {
      if (yPos < 100) return // Prevent overflow

      page.drawText(item.unit_code, { x: 50, y: yPos, size: 9, font })
      page.drawText(item.type, { x: 200, y: yPos, size: 9, font })
      page.drawText(`${item.score}/${item.total_marks}`, { x: 300, y: yPos, size: 9, font })
      page.drawText(`${item.percentage.toFixed(1)}%`, { x: 400, y: yPos, size: 9, font })
      page.drawText(new Date(item.assessment_date).toLocaleDateString(), { x: 480, y: yPos, size: 9, font })

      yPos -= 15
    })

    return await pdfDoc.save()
  }

  // Create assignment report PDF
  async createAssignmentReportPDF(data, user) {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const { width, height } = page.getSize()

    // Header
    page.drawText("ASSIGNMENT SUBMISSION REPORT", {
      x: width / 2 - 130,
      y: height - 50,
      size: 16,
      font: boldFont,
    })

    // Student info
    let yPos = height - 100
    page.drawText(`Student: ${user.first_name} ${user.last_name}`, {
      x: 50,
      y: yPos,
      size: 12,
      font: boldFont,
    })

    yPos -= 40
    page.drawText("ASSIGNMENT HISTORY", {
      x: 50,
      y: yPos,
      size: 14,
      font: boldFont,
    })

    yPos -= 30
    data.forEach((assignment, index) => {
      if (yPos < 100) return

      page.drawText(`${index + 1}. ${assignment.title}`, {
        x: 50,
        y: yPos,
        size: 11,
        font: boldFont,
      })

      yPos -= 15
      page.drawText(`Unit: ${assignment.unit_name} (${assignment.unit_code})`, {
        x: 70,
        y: yPos,
        size: 10,
        font,
      })

      yPos -= 15
      page.drawText(`Submitted: ${new Date(assignment.submitted_at).toLocaleString()}`, {
        x: 70,
        y: yPos,
        size: 10,
        font,
      })

      if (assignment.grade) {
        yPos -= 15
        page.drawText(`Grade: ${assignment.grade} - ${assignment.feedback || "No feedback"}`, {
          x: 70,
          y: yPos,
          size: 10,
          font,
        })
      }

      yPos -= 25
    })

    return await pdfDoc.save()
  }

  // Create analytics report PDF
  async createAnalyticsReportPDF(data, user) {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const { width, height } = page.getSize()

    // Header
    page.drawText("STUDENT ENGAGEMENT ANALYTICS", {
      x: width / 2 - 140,
      y: height - 50,
      size: 16,
      font: boldFont,
    })

    // Student info
    let yPos = height - 100
    page.drawText(`Student: ${user.first_name} ${user.last_name}`, {
      x: 50,
      y: yPos,
      size: 12,
      font: boldFont,
    })

    yPos -= 40
    page.drawText("ENGAGEMENT METRICS", {
      x: 50,
      y: yPos,
      size: 14,
      font: boldFont,
    })

    yPos -= 30
    page.drawText(`Resources Downloaded: ${data.engagement.resources_downloaded || 0}`, {
      x: 50,
      y: yPos,
      size: 12,
      font,
    })

    yPos -= 20
    page.drawText(`Groups Participated: ${data.engagement.groups_participated || 0}`, {
      x: 50,
      y: yPos,
      size: 12,
      font,
    })

    yPos -= 20
    page.drawText(`Assessments Taken: ${data.engagement.assessments_taken || 0}`, {
      x: 50,
      y: yPos,
      size: 12,
      font,
    })

    yPos -= 40
    page.drawText("PERFORMANCE METRICS", {
      x: 50,
      y: yPos,
      size: 14,
      font: boldFont,
    })

    yPos -= 30
    page.drawText(
      `Average Assessment Score: ${data.performance.avg_assessment_score ? data.performance.avg_assessment_score.toFixed(1) + "%" : "N/A"}`,
      {
        x: 50,
        y: yPos,
        size: 12,
        font,
      },
    )

    yPos -= 20
    page.drawText(
      `Average Assignment Score: ${data.performance.avg_assignment_score ? data.performance.avg_assignment_score.toFixed(1) + "%" : "N/A"}`,
      {
        x: 50,
        y: yPos,
        size: 12,
        font,
      },
    )

    return await pdfDoc.save()
  }
}

module.exports = new ReportsController()
