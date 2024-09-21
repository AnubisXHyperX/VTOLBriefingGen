/* eslint-disable @typescript-eslint/no-explicit-any */
import { PDFDocument, StandardFonts, rgb, PDFPage } from 'pdf-lib';
import { FlightData, Unit, Base } from './types';
// Utility function to draw a separator line
function drawSeparator(page: PDFPage, y: number): number {
    page.drawLine({
        start: { x: 50, y },
        end: { x: 550, y },  // Ensure the line is full width
        thickness: 1,
        color: rgb(0, 0, 0),
    });
    return y - 15;  // Move cursor down
}

// Utility function to wrap text into lines that fit within a max width
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
        const testLine = currentLine + word + ' ';
        const testLineWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testLineWidth > maxWidth) {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine = testLine;
        }
    });

    if (currentLine.length > 0) {
        lines.push(currentLine.trim());
    }

    return lines;
}

// Utility function to check if the current page height allows for more content, if not, adds a new page
function checkPageHeight(currentY: number, page: PDFPage, pdfDoc: PDFDocument, height: number): [PDFPage, number] {
    if (currentY < 50) {  // Check if near the bottom of the page
        page = pdfDoc.addPage();  // Add a new page
        currentY = height - 40;  // Reset Y position for new page
    }
    return [page, currentY];
}

// Function to draw text sections
const drawTextSection = (
    title: string,
    content: string[],
    currentY: number,
    page: PDFPage,
    pdfDoc: PDFDocument,
    courierFont: any,
    courierBoldFont: any,
    fontSize: number,
    boldFontSize: number,
    height: number
): number => {
    // Draw the title of the section
    page.drawText(title, { x: 50, y: currentY, size: boldFontSize, font: courierBoldFont });
    currentY -= 20;  // Increase the line height to avoid overlap

    // Draw the content line by line
    for (let line of content) {
        // Clean the line by removing ///n
        line = line.replace(/\/\/\/n/g, '').replace(/\/\/n/g, '').trim();

        // Split the line by newline characters
        const splitLines = line.split('\n');

        splitLines.forEach((subline) => {
            const wrappedLines = wrapText(subline, 450, courierFont, fontSize);  // Adjust width
            wrappedLines.forEach((wrappedLine) => {
                [page, currentY] = checkPageHeight(currentY, page, pdfDoc, height);  // Check if a new page is needed
                page.drawText(wrappedLine, { x: 70, y: currentY, size: fontSize, font: courierFont });
                currentY -= 10;  // Increase line spacing
            });
        });
    }

    return currentY - 10;  // Extra space between sections
};

// Main function to create the flight plan PDF
async function createFlightPlanPDF(flightData: FlightData) {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { height } = page.getSize();
    const fontSize = 9;  // Match Python's font size
    const boldFontSize = 10;
    let currentY = height - 40;

    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
    const courierBoldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);

    // Header section
    page.drawText("[ OFP ]", { x: 50, y: currentY, size: boldFontSize, font: courierBoldFont });
    currentY -= 15;

    drawSeparator(page, currentY);
    currentY -= 10;

    // Mission Name & Flight Date
    page.drawText(`${flightData.mission_name.toUpperCase()} ${flightData.flight_date}`, { x: 50, y: currentY, size: fontSize, font: courierFont });
    currentY -= 10;

    page.drawText(`${flightData.aircraft} RELEASE ${flightData.release_time} ${flightData.flight_date}`, { x: 50, y: currentY, size: fontSize, font: courierFont });
    currentY -= 10;

    page.drawText(`DOUBLE SEATER A/C ${flightData.double_seater.toString().toUpperCase()}`, { x: 50, y: currentY, size: fontSize, font: courierFont });
    currentY -= 10;

    page.drawText(`ARMAMENT ${flightData.armament}`, { x: 50, y: currentY, size: fontSize, font: courierFont });
    currentY -= 10;

    drawSeparator(page, currentY);
    currentY -= 10;

    // Draw Mission Objectives Section
    currentY = drawTextSection("MISSION OBJECTIVES:", flightData.objectives, currentY, page, pdfDoc, courierFont, courierBoldFont, fontSize, boldFontSize, height);

    drawSeparator(page, currentY);
    currentY -= 10;

    // Draw Mission Briefing Section
    currentY = drawTextSection("MISSION BRIEFING:", flightData.briefing, currentY, page, pdfDoc, courierFont, courierBoldFont, fontSize, boldFontSize, height);

    drawSeparator(page, currentY);
    currentY -= 10;

    // Function to draw unit sections
    const drawUnitSection = (title: string, units: Unit[], currentY: number): number => {
        page.drawText(title, { x: 50, y: currentY, size: boldFontSize, font: courierBoldFont });
        currentY -= 15;

        units.forEach((unit) => {
            [page, currentY] = checkPageHeight(currentY, page, pdfDoc, height);
            page.drawText(`${unit.name}`, { x: 70, y: currentY, size: fontSize, font: courierFont });
            currentY -= 10;
        });

        return currentY - 10;  // Extra space between sections
    };

    // Draw Allied Units Section
    currentY = drawUnitSection("ALLIED UNITS:", flightData.allied_units, currentY);

    drawSeparator(page, currentY);
    currentY -= 10;

    // Draw Enemy Units Section
    currentY = drawUnitSection("ENEMY UNITS:", flightData.enemy_units, currentY);

    drawSeparator(page, currentY);
    currentY -= 10;

    // Function to draw base sections
    const drawBaseSection = (title: string, bases: Base[], currentY: number): number => {
        page.drawText(title, { x: 50, y: currentY, size: boldFontSize, font: courierBoldFont });
        currentY -= 15;

        bases.forEach((base) => {
            [page, currentY] = checkPageHeight(currentY, page, pdfDoc, height);
            page.drawText(`${base.name} (${base.id}) - ${base.team}`, { x: 70, y: currentY, size: fontSize, font: courierFont });
            currentY -= 15;
        });

        return currentY - 15;  // Extra space between sections
    };

    // Draw Bases Section
    currentY = drawBaseSection("BASES:", flightData.bases, currentY);

    drawSeparator(page, currentY);
    currentY -= 10;

    // Footer Section
    const drawFooter = (currentY: number): number => {
        page.drawText("NO TANKERING RECOMMENDED (P)", { x: 50, y: currentY, size: fontSize, font: courierFont });
        currentY -= 15;

        page.drawText("I HEREWITH CONFIRM THAT I HAVE PERFORMED A THOROUGH SELF BRIEFING", { x: 50, y: currentY, size: fontSize, font: courierFont });
        currentY -= 15;

        page.drawText("ABOUT THE DESTINATION AND ALTERNATE AIRPORTS OF THIS FLIGHT", { x: 50, y: currentY, size: fontSize, font: courierFont });
        currentY -= 15;

        page.drawText("INCLUDING THE APPLICABLE INSTRUMENT APPROACH PROCEDURES,", { x: 50, y: currentY, size: fontSize, font: courierFont });
        currentY -= 15;

        page.drawText("AIRPORT FACILITIES, NOTAMS AND ALL OTHER RELEVANT PARTICULAR INFORMATION.", { x: 50, y: currentY, size: fontSize, font: courierFont });

        return currentY - 15;
    };

    // continue here


    // currentY -= 15;  // Extra space before footer

    currentY = drawFooter(currentY);

    drawSeparator(page, currentY);

    // Save PDF to file
    const pdfBytes = await pdfDoc.save();
    const base64Str = Buffer.from(pdfBytes).toString('base64');
    return base64Str;
}

// Export the function for external use
export { createFlightPlanPDF };