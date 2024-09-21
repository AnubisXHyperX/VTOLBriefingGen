/* eslint-disable @typescript-eslint/no-explicit-any */
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

// Define TypeScript interfaces
interface Unit {
    id: string;
    name: string;
}

interface Base {
    id: string;
    name: string;
    team: string;
}

interface FlightData {
    mission_name: string;
    flight_date: string;
    aircraft: string;
    release_time: string;
    double_seater: boolean;
    armament: string;
    fuel: string;
    objectives: string[];
    briefing: string[];
    allied_units: Unit[];
    enemy_units: Unit[];
    bases: Base[];
}

// Utility function to create a separator line
function createSeparator(): any {
    return {
        canvas: [{
            type: 'line',
            x1: 0, y1: 0,
            x2: 515, y2: 0,
            lineWidth: 1
        }],
        margin: [0, 10, 0, 10]
    };
}

// Utility function to create a text block
function createTextBlock(title: string, content: string[]): any {
    const block = [{ text: title, style: 'header' }];
    content.forEach(line => {
        block.push({ text: line.replace(/\/\/\/n|\/\/n/g, '').trim(), style: 'content' });
    });
    return block;
}

// Utility function to create a unit section
function createUnitSection(title: string, units: Unit[]): any {
    const section = [{ text: title, style: 'header' }];
    units.forEach(unit => {
        section.push({ text: `${unit.name} (${unit.id})`, style: 'content' });
    });
    return section;
}

// Utility function to create a base section
function createBaseSection(title: string, bases: Base[]): any {
    const section = [{ text: title, style: 'header' }];
    bases.forEach(base => {
        section.push({ text: `${base.name} (${base.id}) - ${base.team}`, style: 'content' });
    });
    return section;
}

// Main function to create the flight plan PDF and return it as a base64 string
export function createFlightPlanPDF(flightData: FlightData): Promise<string> {
    const docDefinition = {
        content: [
            { text: '[ OFP ]', style: 'title' },
            createSeparator(),
            { text: `${flightData.mission_name.toUpperCase()} ${flightData.flight_date}`, style: 'content' },
            { text: `${flightData.aircraft} RELEASE ${flightData.release_time} ${flightData.flight_date}`, style: 'content' },
            { text: `DOUBLE SEATER A/C ${flightData.double_seater.toString().toUpperCase()}`, style: 'content' },
            { text: `ARMAMENT ${flightData.armament}`, style: 'content' },
            createSeparator(),
            ...createTextBlock("MISSION OBJECTIVES:", flightData.objectives),
            createSeparator(),
            ...createTextBlock("MISSION BRIEFING:", flightData.briefing),
            createSeparator(),
            ...createUnitSection("ALLIED UNITS:", flightData.allied_units),
            createSeparator(),
            ...createUnitSection("ENEMY UNITS:", flightData.enemy_units),
            createSeparator(),
            ...createBaseSection("BASES:", flightData.bases),
            createSeparator(),
            {
                text: `NO TANKERING RECOMMENDED (P)\nI HEREWITH CONFIRM THAT I HAVE PERFORMED A THOROUGH SELF BRIEFING\nABOUT THE DESTINATION AND ALTERNATE AIRPORTS OF THIS FLIGHT\nINCLUDING THE APPLICABLE INSTRUMENT APPROACH PROCEDURES,\nAIRPORT FACILITIES, NOTAMS AND ALL OTHER RELEVANT PARTICULAR INFORMATION.`,
                style: 'content'
            }
        ],
        styles: {
            title: {
                fontSize: 12,
                // bold: true,
                alignment: 'center' as const  // Correctly typing 'center'
            },
            header: {
                fontSize: 10,
                // bold: true,
                margin: [0, 10, 0, 5] as [number, number, number, number]
            },
            content: {
                fontSize: 9,
                margin: [0, 2, 0, 2] as [number, number, number, number],
                // font: 'Courier' // Use Courier font for content to match the previous design
            }
        },
        defaultStyle: {
            // font: 'Courier' // Set default font to Courier
        }
    };

    return new Promise((resolve) => {
        const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        
        pdfDocGenerator.getBase64((data) => {
            resolve(data);  // Return the PDF as a base64 string
        });
    });
}