import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload, CloudUpload } from './Icons'; // Removed unused icons
import { LoadingSpinner } from './LoadingSpinner';

const FileShare: React.FC = () => {
    const { user, showToast, saveToDrive, isDriveApiReady } = useAuth();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !user) {
            setError("Please select a file and ensure you are logged in.");
            return;
        }
        if (!isDriveApiReady) {
            setError("Google Drive API is not ready. Please try again in a moment.");
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            // Read file as ArrayBuffer for robust handling of all file types
            const arrayBuffer = await selectedFile.arrayBuffer();
            const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

            await saveToDrive(selectedFile.name, base64Content, selectedFile.type);
            showToast("File saved to Google Drive!");
            setSelectedFile(null);
        } catch (err) {
            console.error("Error saving file to Drive:", err);
            setError(`Failed to save file: ${err instanceof Error ? err.message : String(err)}`);
            showToast("File save failed!");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-brand-primary-600 dark:text-brand-primary-400">Upload to Google Drive</h2>

            <div className="mb-6 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Select File to Upload</h3>
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500 dark:text-slate-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-brand-primary-50 file:text-brand-primary-700
                    hover:file:bg-brand-primary-100
                    dark:file:bg-brand-primary-900/30 dark:file:text-brand-primary-300
                    dark:hover:file:bg-brand-primary-900/50
                    cursor-pointer
                    "
                />
                {selectedFile && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Selected: {selectedFile.name}</p>
                )}
                {isUploading && (
                    <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 mt-4">
                        <div className="bg-brand-primary-600 h-2.5 rounded-full" style={{ width: `100%` }}></div> {/* Simplified progress bar */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-right mt-1">Saving...</p>
                    </div>
                )}
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading || !isDriveApiReady}
                    className="mt-4 inline-flex items-center gap-2 bg-brand-primary-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
                >
                    {isUploading ? <LoadingSpinner /> : <Upload className="w-5 h-5" />}
                    {isUploading ? 'Saving to Drive...' : 'Save to Google Drive'}
                </button>
            </div>

            <div className="flex-grow flex items-center justify-center text-slate-500 dark:text-slate-400 text-center">
                <p>Files uploaded here will be saved to your personal Google Drive account.</p>
            </div>
        </div>
    );
};

export default FileShare;
