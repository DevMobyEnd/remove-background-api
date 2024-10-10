import React, { useState } from 'react';
import { Upload, Loader, Download, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const RemoveBackgroundApp = () => {
    const [step, setStep] = useState('upload');
    const [originalImage, setOriginalImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [error, setError] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
    
        setOriginalImage(URL.createObjectURL(file));
        setStep('processing');
        setError(null);
    
        const formData = new FormData();
        formData.append('file', file);
    
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
    
        try {
            const response = await fetch('http://localhost:5000/remove_background', {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to process image');
            }
    
            const blob = await response.blob();
            const processedImageUrl = URL.createObjectURL(blob);
            setProcessedImage(processedImageUrl);
            setStep('result');
        } catch (error) {
            console.error('Error processing image:', error);
            setError(
                error.name === 'AbortError'
                    ? 'La solicitud ha excedido el tiempo de espera. Por favor, inténtalo de nuevo.'
                    : error.message === 'Failed to fetch'
                    ? 'No se pudo conectar con el servidor. Verifica tu conexión.'
                    : error.message || 'Error al procesar la imagen. Por favor, inténtalo de nuevo.'
            );
            setStep('upload');
        } finally {
            clearTimeout(timeoutId);
        }
    };

    const handleDownload = async () => {
        if (processedImage) {
            setIsDownloading(true);
            try {
                const response = await fetch(processedImage);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'removed_background.png';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error downloading image:', error);
                setError('Failed to download image. Please try again.');
            } finally {
                setIsDownloading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Removedor de Fondo de Imágenes</h1>
                {step === 'upload' && (
                    <div className="text-center">
                        <Button
                            onClick={() => document.getElementById('fileInput').click()}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full inline-flex items-center"
                        >
                            <Upload className="mr-2" />
                            Subir Imagen
                        </Button>
                        <input
                            id="fileInput"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                    </div>
                )}
                {step === 'processing' && (
                    <div className="text-center">
                        <Loader className="animate-spin h-16 w-16 text-blue-500 mx-auto mb-4" />
                        <p className="text-lg text-gray-600">Procesando tu imagen...</p>
                    </div>
                )}
                {step === 'result' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="w-full sm:w-1/2">
                                <h3 className="text-lg font-semibold mb-2 text-gray-700">Original</h3>
                                <img
                                    src={originalImage}
                                    alt="Imagen Original"
                                    className="w-full h-auto rounded-lg shadow"
                                />
                            </div>
                            <div className="w-full sm:w-1/2">
                                <h3 className="text-lg font-semibold mb-2 text-gray-700">Sin Fondo</h3>
                                <img
                                    src={processedImage}
                                    alt="Imagen Procesada"
                                    className="w-full h-auto rounded-lg shadow"
                                />
                            </div>
                        </div>
                        <div className="text-center">
                            <Button
                                onClick={handleDownload}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full inline-flex items-center"
                                disabled={isDownloading}
                            >
                                {isDownloading ? (
                                    <Loader className="animate-spin mr-2" />
                                ) : (
                                    <Download className="mr-2" />
                                )}
                                {isDownloading ? 'Descargando...' : 'Descargar Imagen'}
                            </Button>
                        </div>
                    </div>
                )}
                {error && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    );
};

export default RemoveBackgroundApp;