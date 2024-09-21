'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FlightPlanner } from '@/lib/flightPlanGenerator';
import { createFlightPlanPDF } from '@/lib/pdfGenerator';
import ButtonLoader from './ui/button-loader';

const Planner = () => {
    const vtsbRef = useRef<HTMLInputElement>(null);
    const vtmbRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [vtsbFile, setVtsbFile] = useState<File | null>(null);
    const [vtmbFile, setVtmbFile] = useState<File | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null); // State to store the PDF URL

    // Trigger the hidden file input when the appropriate button is clicked
    const handleButtonClickOne = () => {
        if (vtsbRef.current) {
            vtsbRef.current.click();
        }
    };

    const handleButtonClickTwo = () => {
        if (vtmbRef.current) {
            vtmbRef.current.click();
        }
    };

    const handleFileChangeOne = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setVtsbFile(file);
        }
    };

    const handleFileChangeTwo = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setVtmbFile(file);
        }
    };

    const readFileContent = (file: File): Promise<ArrayBuffer> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer); // Read as ArrayBuffer
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file); // Use ArrayBuffer for binary files
        });
    };

    const handleGenerateClick = async () => {
        setIsLoading(true);
        if (vtsbFile && vtmbFile) {
            try {
                // Read both files as text
                const vtsbContent = await readFileContent(vtsbFile);
                const vtmbContent = await readFileContent(vtmbFile);

                // Pass file content to the FlightPlanner
                const planner = new FlightPlanner();
                planner.loadData(vtsbContent, vtmbContent);
                planner.generateFlightPlan();
                const flightPlan = planner.generateFlightPlan();
                const base64Pdf = await createFlightPlanPDF(flightPlan);

                // Convert base64 to Blob and create a URL
                const pdfBlob = base64ToBlob(base64Pdf, 'application/pdf');
                const pdfUrl = URL.createObjectURL(pdfBlob);
                setPdfUrl(pdfUrl); // Update the state with the PDF URL
                // setVtsbFile(null);
                // setVtmbFile(null);

                console.log('Flight plan generated successfully.');
            } catch (error) {
                console.error('Error reading files:', error);
            }
        } else {
            alert('Please select both files before generating the flight plan.');
        }
        setIsLoading(false);
    };

    // Helper function to convert base64 string to Blob
    const base64ToBlob = (base64: string, contentType: string = '', sliceSize: number = 512) => {
        const byteCharacters = atob(base64);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: contentType });
    };

    return (
        <>
            <div className="p-10 flex justify-between">
                <div className='flex flex-col h-24 w-96 justify-center items-center space-y-4'>
                    {/* Hidden file input for the first file */}
                    <input
                        type="file"
                        accept=".vts,.vtsb"
                        ref={vtsbRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChangeOne}
                    />
                    {/* Custom button to trigger file input for the first file */}
                    <Button className='text-amber-400' type="button" onClick={handleButtonClickOne}>
                        Upload VTS/B File
                    </Button>
                    <p className='text-amber-400'>{vtsbFile ? `Selected file: ${vtsbFile.name}` : 'No file selected'}</p>
                </div>
                <div className='flex flex-col h-24 w-96 justify-center items-center space-y-4'>
                    {/* Hidden file input for the second file */}
                    <input
                        type="file"
                        accept=".vtm,.vtmb"
                        ref={vtmbRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChangeTwo}
                    />
                    {/* Custom button to trigger file input for the second file */}
                    <Button className='text-amber-400' type="button" onClick={handleButtonClickTwo}>
                        Upload VTM/B File
                    </Button>
                    <p className='text-amber-400'>{vtmbFile ? `Selected file: ${vtmbFile.name}` : 'No file selected'}</p>
                </div>
            </div>
            <div className="p-10 flex justify-center">
                {/* Button to trigger the flight plan generation */}
                <ButtonLoader isLoading={isLoading}>
                    <Button
                        className="text-amber-400 shadow-lg shadow-amber-400 border border-amber-400"
                        type="button"
                        onClick={handleGenerateClick}
                    >
                        Generate Flight Plan
                    </Button>
                </ButtonLoader>
                {/* <Button
                    className="text-amber-400 shadow-lg shadow-amber-400 border border-amber-400"
                    type="button"
                    onClick={handleGenerateClick}
                >
                    Generate Flight Plan
                </Button> */}
            </div>

            {/* Display PDF in an iframe */}
            {pdfUrl != null && (
                <div className="p-10 flex justify-center">
                    <iframe src={pdfUrl} width="600" height="800" title="Flight Plan PDF"></iframe>
                </div>
            )}
        </>
    );
};

export default Planner;