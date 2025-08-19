const { PDFDocument, rgb, StandardFonts } = require("pdf-lib")
const crypto = require("crypto")
const fs = require("fs").promises

class DigitalWatermark {
  constructor() {
    this.secret = process.env.WATERMARK_SECRET || "default-watermark-secret-change-in-production"
  }

  // Generate a unique watermark signature
  generateSignature(data) {
    const payload = JSON.stringify({
      userId: data.userId,
      documentType: data.documentType,
      timestamp: data.timestamp,
      institutionId: data.institutionId || "academic-hub",
      documentId: data.documentId,
    })

    const hmac = crypto.createHmac("sha256", this.secret)
    hmac.update(payload)
    return {
      signature: hmac.digest("hex"),
      payload: Buffer.from(payload).toString("base64"),
    }
  }

  // Verify watermark signature
  verifySignature(signature, payload) {
    try {
      const decodedPayload = Buffer.from(payload, "base64").toString("utf8")
      const data = JSON.parse(decodedPayload)

      const expectedSignature = this.generateSignature(data).signature
      return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"))
    } catch (error) {
      console.error("Signature verification error:", error)
      return false
    }
  }

  // Add invisible watermark to PDF
  async addInvisibleWatermark(pdfBuffer, watermarkData) {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const { signature, payload } = this.generateSignature(watermarkData)

      // Embed watermark data in PDF metadata
      pdfDoc.setTitle(watermarkData.title || "Academic Document")
      pdfDoc.setSubject(`Watermarked document - ${watermarkData.documentType}`)
      pdfDoc.setCreator("Academic Hub Watermarking System")
      pdfDoc.setProducer("Academic Hub v1.0")

      // Add custom metadata with watermark information
      const watermarkInfo = {
        signature,
        payload,
        version: "1.0",
        timestamp: watermarkData.timestamp,
      }

      // Embed watermark as invisible text (white text on white background)
      const pages = pdfDoc.getPages()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

      for (const page of pages) {
        const { width, height } = page.getSize()

        // Add invisible watermark text in multiple locations
        const watermarkText = `WM:${signature.substring(0, 16)}`

        // Top-left corner (invisible)
        page.drawText(watermarkText, {
          x: 10,
          y: height - 20,
          size: 1,
          font,
          color: rgb(1, 1, 1), // White text (invisible on white background)
        })

        // Bottom-right corner (invisible)
        page.drawText(watermarkText, {
          x: width - 100,
          y: 10,
          size: 1,
          font,
          color: rgb(1, 1, 1),
        })

        // Center (invisible)
        page.drawText(watermarkText, {
          x: width / 2 - 50,
          y: height / 2,
          size: 1,
          font,
          color: rgb(1, 1, 1),
        })

        // Add visible but subtle watermark
        page.drawText("OFFICIAL DOCUMENT", {
          x: width / 2 - 80,
          y: height / 2 - 50,
          size: 8,
          font,
          color: rgb(0.95, 0.95, 0.95), // Very light gray
          rotate: { angle: -45, x: width / 2, y: height / 2 },
        })
      }

      // Embed watermark data in PDF structure
      const watermarkString = JSON.stringify(watermarkInfo)
      pdfDoc.setKeywords(watermarkString)

      return await pdfDoc.save()
    } catch (error) {
      console.error("Watermark embedding error:", error)
      throw new Error("Failed to add watermark to PDF")
    }
  }

  // Add visible watermark to PDF
  async addVisibleWatermark(pdfBuffer, watermarkData) {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const pages = pdfDoc.getPages()
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      for (const page of pages) {
        const { width, height } = page.getSize()

        // Add diagonal watermark
        const watermarkText = `${watermarkData.institutionId || "ACADEMIC HUB"} - ${new Date(
          watermarkData.timestamp,
        ).toLocaleDateString()}`

        page.drawText(watermarkText, {
          x: width / 2 - 100,
          y: height / 2,
          size: 24,
          font,
          color: rgb(0.8, 0.8, 0.8),
          opacity: 0.3,
          rotate: { angle: -45, x: width / 2, y: height / 2 },
        })

        // Add footer with verification info
        page.drawText(`Document ID: ${watermarkData.documentId}`, {
          x: 50,
          y: 30,
          size: 8,
          font,
          color: rgb(0.5, 0.5, 0.5),
        })

        page.drawText(`Generated: ${new Date(watermarkData.timestamp).toLocaleString()}`, {
          x: width - 200,
          y: 30,
          size: 8,
          font,
          color: rgb(0.5, 0.5, 0.5),
        })
      }

      return await pdfDoc.save()
    } catch (error) {
      console.error("Visible watermark error:", error)
      throw new Error("Failed to add visible watermark to PDF")
    }
  }

  // Extract watermark from PDF
  async extractWatermark(pdfBuffer) {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const keywords = pdfDoc.getKeywords()

      if (!keywords) {
        return { valid: false, error: "No watermark found" }
      }

      const watermarkInfo = JSON.parse(keywords)
      const isValid = this.verifySignature(watermarkInfo.signature, watermarkInfo.payload)

      if (isValid) {
        const decodedPayload = Buffer.from(watermarkInfo.payload, "base64").toString("utf8")
        const data = JSON.parse(decodedPayload)

        return {
          valid: true,
          data,
          signature: watermarkInfo.signature,
          timestamp: watermarkInfo.timestamp,
          version: watermarkInfo.version,
        }
      } else {
        return { valid: false, error: "Invalid watermark signature" }
      }
    } catch (error) {
      console.error("Watermark extraction error:", error)
      return { valid: false, error: "Failed to extract watermark" }
    }
  }

  // Generate QR code for document verification
  generateVerificationQR(documentId, signature) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${documentId}?sig=${signature.substring(0, 16)}`
    return verificationUrl
  }

  // Create tamper-proof document hash
  createDocumentHash(pdfBuffer, watermarkData) {
    const hash = crypto.createHash("sha256")
    hash.update(pdfBuffer)
    hash.update(JSON.stringify(watermarkData))
    return hash.digest("hex")
  }
}

module.exports = new DigitalWatermark()
