import jsPDF from "jspdf";
import { formatNepaliTime, calculateAgeInNepali } from "./formatters";

/**
 * Generate a medical analysis PDF report
 * @param {Object} result - The analysis result data
 * @returns {Promise<jsPDF>} The generated PDF document
 */
export const generateMedicalPDF = async (result) => {
  try {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredSpace = 30) => {
      if (yPosition > pageHeight - requiredSpace) {
        pdf.addPage();
        addPageHeader();
        yPosition = 45;
        return true;
      }
      return false;
    };

    // Helper function to add page header (for subsequent pages)
    const addPageHeader = () => {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(0, 0, pageWidth, 25, "F");
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      pdf.text(
        "SECOND OPINION AI - MEDICAL ANALYSIS REPORT",
        pageWidth / 2,
        15,
        { align: "center" }
      );
      pdf.setDrawColor(200, 200, 200);
      pdf.line(0, 25, pageWidth, 25);
      pdf.setTextColor(0, 0, 0);
    };

    // Helper function to add section divider
    const addSectionDivider = () => {
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
    };

    // Header - Navy blue background like the image
    pdf.setFillColor(52, 73, 121); // Navy blue color from the image
    pdf.rect(0, 0, pageWidth, 50, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont(undefined, "bold");
    pdf.text("MEDICAL IMAGING ANALYSIS REPORT", pageWidth / 2, 18, {
      align: "center",
    });

    pdf.setFontSize(11);
    pdf.setFont(undefined, "normal");
    pdf.text(
      "AI-Assisted Diagnostic Imaging • Second Opinion Medical AI Platform",
      pageWidth / 2,
      30,
      { align: "center" }
    );
    pdf.text(
      "This report should be reviewed by a qualified radiologist",
      pageWidth / 2,
      40,
      { align: "center" }
    );

    pdf.setTextColor(0, 0, 0);
    yPosition = 65;

    // I. PATIENT DEMOGRAPHICS
    pdf.setFontSize(12);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(52, 73, 121);
    pdf.text("I. PATIENT DEMOGRAPHICS", margin, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 8;

    addSectionDivider();

    // Patient info table with proper formatting
    pdf.setFontSize(10);

    // Row 1
    pdf.setFont(undefined, "bold");
    pdf.text("Patient Name:", margin + 5, yPosition);
    pdf.setFont(undefined, "normal");
    pdf.text(
      result.patientName || result.patient?.full_name || "yojal",
      margin + 50,
      yPosition
    );

    pdf.setFont(undefined, "bold");
    pdf.text("Patient ID:", margin + 110, yPosition);
    pdf.setFont(undefined, "normal");
    pdf.text(result.patientId || "PT-000013", margin + 145, yPosition);
    yPosition += 10;

    // Row 2
    pdf.setFont(undefined, "bold");
    pdf.text("Date of Birth:", margin + 5, yPosition);
    pdf.setFont(undefined, "normal");
    const dob = result.patient?.date_of_birth
      ? formatNepaliTime(result.patient.date_of_birth, {
          hour: undefined,
          minute: undefined,
          timeZoneName: undefined,
        })
      : result.dob || "5/3/2003";
    pdf.text(dob, margin + 50, yPosition);

    pdf.setFont(undefined, "bold");
    pdf.text("Age:", margin + 110, yPosition);
    pdf.setFont(undefined, "normal");
    const age =
      result.age ||
      (result.patient?.date_of_birth
        ? `${calculateAgeInNepali(result.patient.date_of_birth)} years`
        : "22 years");
    pdf.text(age, margin + 145, yPosition);
    yPosition += 10;

    // Row 3
    pdf.setFont(undefined, "bold");
    pdf.text("Gender:", margin + 5, yPosition);
    pdf.setFont(undefined, "normal");
    pdf.text(
      result.patient?.gender || result.gender || "Male",
      margin + 50,
      yPosition
    );

    pdf.setFont(undefined, "bold");
    pdf.text("Contact:", margin + 110, yPosition);
    pdf.setFont(undefined, "normal");
    const contact =
      result.patient?.phone && result.patient.phone !== "N/A"
        ? result.patient.phone
        : result.contact && result.contact !== "N/A"
        ? result.contact
        : "986-786-9502";
    pdf.text(contact, margin + 145, yPosition);

    yPosition += 20;
    checkPageBreak(50);

    // II. IMAGING FINDINGS (renamed from III to II after removing Clinical Information)
    pdf.setFontSize(12);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(52, 73, 121);
    pdf.text("II. IMAGING FINDINGS", margin, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 8;

    addSectionDivider();

    // Primary Finding Box - Blue border like in the image
    pdf.setDrawColor(52, 73, 121);
    pdf.setLineWidth(1);
    pdf.rect(margin, yPosition, contentWidth, 25, "D");

    pdf.setFontSize(11);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(52, 73, 121);
    pdf.text("PRIMARY FINDING:", margin + 10, yPosition + 8);

    pdf.setTextColor(52, 73, 121);
    pdf.text("AI Confidence:", pageWidth - margin - 50, yPosition + 8);

    // Result text
    pdf.setFontSize(14);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(0, 0, 0);
    const resultText = result.result || result.prediction || "PITUITARY TUMOR";
    pdf.text(resultText, margin + 10, yPosition + 18);

    // Confidence with colored background
    const rawConfidence = result.confidence || 0.74; // Default to 74% if not provided
    // Check if confidence is already a percentage (>1) or a decimal (0-1)
    const confidence =
      rawConfidence > 1
        ? Math.round(rawConfidence)
        : Math.round(rawConfidence * 100);
    pdf.setFontSize(12);
    pdf.setFont(undefined, "bold");

    // Green background for confidence like in the image
    pdf.setFillColor(76, 175, 80);
    pdf.rect(pageWidth - margin - 45, yPosition + 12, 35, 8, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${confidence}%`, pageWidth - margin - 42, yPosition + 18);
    pdf.setTextColor(0, 0, 0);

    pdf.setFontSize(9);
    pdf.text("(HIGH)", pageWidth - margin - 25, yPosition + 18);

    yPosition += 35;

    // DETAILED OBSERVATIONS
    pdf.setFontSize(11);
    pdf.setFont(undefined, "bold");
    pdf.text("DETAILED OBSERVATIONS:", margin, yPosition);
    yPosition += 8;

    // Generate findings based on result or use provided ones
    const findings =
      result.findings && result.findings.length > 0
        ? result.findings
        : generateDefaultFindings(resultText);

    pdf.setFontSize(10);
    pdf.setFont(undefined, "normal");
    findings.forEach((finding, index) => {
      checkPageBreak(8);
      pdf.text(`${index + 1}.`, margin + 5, yPosition);
      pdf.text(finding, margin + 15, yPosition);
      yPosition += 8;
    });

    yPosition += 10;
    checkPageBreak(50);

    // III. CLINICAL IMPRESSION & RECOMMENDATIONS
    pdf.setFontSize(12);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(52, 73, 121);
    pdf.text("III. CLINICAL IMPRESSION & RECOMMENDATIONS", margin, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 8;

    addSectionDivider();

    // Generate recommendations
    const recommendations =
      result.recommendations && result.recommendations.length > 0
        ? result.recommendations
        : generateDefaultRecommendations(resultText);

    pdf.setFontSize(10);
    pdf.setFont(undefined, "normal");
    recommendations.forEach((rec, index) => {
      checkPageBreak(8);
      pdf.text(`${index + 1}.`, margin + 5, yPosition);
      pdf.text(rec, margin + 15, yPosition);
      yPosition += 8;
    });

    yPosition += 15;
    checkPageBreak(60);

    // IMPORTANT MEDICAL DISCLAIMER - Red border box
    pdf.setDrawColor(220, 53, 69);
    pdf.setLineWidth(1);
    pdf.rect(margin, yPosition, contentWidth, 45, "D");

    pdf.setFillColor(254, 242, 242);
    pdf.rect(margin + 1, yPosition + 1, contentWidth - 2, 43, "F");

    pdf.setFontSize(11);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(220, 53, 69);
    pdf.text("⚠ IMPORTANT MEDICAL DISCLAIMER", margin + 10, yPosition + 10);

    pdf.setFontSize(9);
    pdf.setFont(undefined, "normal");
    pdf.setTextColor(0, 0, 0);
    const disclaimerText = `This AI-generated analysis is intended for use by qualified healthcare professionals only and should not be used as the sole basis for clinical decision-making. The results must be interpreted in conjunction with clinical findings, patient history, and other diagnostic information. In cases where there is uncertainty or clinical concern, additional imaging, consultation, or follow-up may be warranted. Emergency cases require immediate clinical consultation regardless of AI analysis results.`;

    const disclaimerLines = pdf.splitTextToSize(
      disclaimerText,
      contentWidth - 20
    );
    let disclaimerY = yPosition + 18;
    disclaimerLines.forEach((line) => {
      pdf.text(line, margin + 10, disclaimerY);
      disclaimerY += 5;
    });

    // Check if we need a new page for footer
    yPosition += 55;
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 40;
    }

    // Footer section - Signature area
    yPosition = pageHeight - 50;

    // Signature lines
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, margin + 70, yPosition);
    pdf.line(pageWidth - margin - 70, yPosition, pageWidth - margin, yPosition);

    pdf.setFontSize(9);
    pdf.setFont(undefined, "normal");
    pdf.text("Reviewing Radiologist", margin, yPosition + 6);
    pdf.text("Date", pageWidth - margin - 70, yPosition + 6);

    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text("(To be completed by licensed physician)", margin, yPosition + 12);

    // Page footer
    yPosition = pageHeight - 20;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);

    pdf.setFontSize(8);
    pdf.text(
      "Second Opinion AI Medical Platform | Advanced Diagnostic Imaging Analysis",
      margin,
      yPosition
    );
    pdf.text(
      `Generated: ${formatNepaliTime(new Date())}`,
      pageWidth - margin,
      yPosition,
      { align: "right" }
    );
    pdf.text(
      "This report requires review and interpretation by a licensed radiologist",
      pageWidth / 2,
      yPosition + 6,
      { align: "center" }
    );
    pdf.text("Page 1", pageWidth - margin, yPosition + 12, { align: "right" });

    return pdf;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

// Helper function to generate default findings based on result
const generateDefaultFindings = (result) => {
  const resultLower = result.toLowerCase();

  if (resultLower.includes("pituitary")) {
    return [
      "Pituitary Tumor detected",
      "Sellar/suprasellar region",
      "Endocrine evaluation needed",
      "MRI with gadolinium recommended",
    ];
  } else if (resultLower.includes("glioma")) {
    return [
      "Glioma tumor detected",
      "Irregular enhancement pattern",
      "Possible mass effect",
      "Requires further evaluation",
    ];
  } else if (resultLower.includes("meningioma")) {
    return [
      "Meningioma tumor detected",
      "Extra-axial location",
      "Well-circumscribed borders",
      "Dural enhancement present",
    ];
  } else if (resultLower.includes("normal")) {
    return [
      "No tumor detected",
      "Normal brain tissue structure",
      "Clear ventricles",
      "No mass effect observed",
    ];
  } else {
    return [
      `${result} detected`,
      "Requires clinical correlation",
      "Further evaluation recommended",
      "Follow-up imaging may be needed",
    ];
  }
};

// Helper function to generate default recommendations
const generateDefaultRecommendations = (result) => {
  const resultLower = result.toLowerCase();

  if (resultLower.includes("normal")) {
    return [
      "Continue routine monitoring",
      "No immediate intervention needed",
      "Annual follow-up recommended",
      "Consider specialist referral if symptoms persist",
    ];
  } else if (
    resultLower.includes("tumor") ||
    resultLower.includes("pituitary")
  ) {
    return [
      "Immediate medical consultation recommended",
      "Additional imaging studies may be required",
      "Multidisciplinary team review suggested",
      "Consider specialist referral",
    ];
  } else {
    return [
      "Clinical correlation recommended",
      "Follow up with healthcare provider",
      "Consider additional diagnostic tests",
      "Monitor symptoms if any",
    ];
  }
};

/**
 * Download a PDF report for a medical analysis
 * @param {Object} result - The analysis result data
 * @param {string} filename - Optional custom filename
 */
export const downloadMedicalReport = async (result, filename) => {
  try {
    const pdf = await generateMedicalPDF(result);
    const defaultFilename = `medical_report_${
      result.patientId || result.id
    }_${formatNepaliTime(new Date(), {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: undefined,
      minute: undefined,
      timeZoneName: undefined,
    }).replace(/\//g, "-")}.pdf`;

    pdf.save(filename || defaultFilename);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw error;
  }
};

/**
 * Get analysis type display name
 * @param {string} modelType - The model type
 * @returns {string} Display name for the analysis type
 */
const getAnalysisTypeDisplay = (modelType) => {
  switch (modelType) {
    case "tumor":
      return "Brain Tumor Detection";
    case "chest_xray":
      return "Pneumonia Detection";
    default:
      return "Medical Analysis";
  }
};
