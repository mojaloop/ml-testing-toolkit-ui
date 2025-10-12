/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * ModusBox
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Typography, Alert, Spin } from 'antd';
import { ScanOutlined, CameraOutlined, ReloadOutlined } from '@ant-design/icons';
import { Scanner } from '@yudiel/react-qr-scanner';

const { Text } = Typography;

const QRCameraScanner = ({ 
    visible, 
    onCancel, 
    onScanSuccess, 
    onScanError,
    title = "QR Code Scanner"
}) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (visible) {
            setError(null);
            setIsScanning(false);
            setCameraReady(false);
            setHasPermission(null);
        }
    }, [visible]);
    
    // Set camera as ready when scanner starts (simplified for this library)
    useEffect(() => {
        if (visible && !error) {
            const timer = setTimeout(() => {
                setCameraReady(true);
                setHasPermission(true);
            }, 1000); // Give time for camera to initialize
            
            return () => clearTimeout(timer);
        }
    }, [visible, error]);

    const handleScan = (result) => {
        if (result && result.length > 0) {
            const scannedText = result[0]?.rawValue;
            if (scannedText) {
                try {
                    // Try to parse as JSON first (our merchant format)
                    let parsedData;
                    try {
                        parsedData = JSON.parse(scannedText);
                    } catch {
                        // If not JSON, treat as plain text
                        parsedData = {
                            type: 'UNKNOWN',
                            data: scannedText,
                            timestamp: new Date().toISOString()
                        };
                    }

                    // Validate merchant payment format
                    if (parsedData.type === 'MERCHANT_PAYMENT' && parsedData.merchantId) {
                        onScanSuccess && onScanSuccess(parsedData);
                    } else if (parsedData.merchantId) {
                        // Handle different QR code formats that might contain merchant_id
                        const normalizedData = {
                            type: 'MERCHANT_PAYMENT',
                            merchantId: parsedData.merchantId,
                            merchantName: parsedData.merchantName || parsedData.name || 'Unknown Merchant',
                            timestamp: new Date().toISOString(),
                            originalData: parsedData
                        };
                        onScanSuccess && onScanSuccess(normalizedData);
                    } else {
                        // Unknown format
                        setError('QR code does not contain valid merchant information');
                        onScanError && onScanError(new Error('Invalid QR code format'));
                    }
                } catch (err) {
                    console.error('Error processing QR scan result:', err);
                    setError('Failed to process QR code data');
                    onScanError && onScanError(err);
                }
            }
        }
    };

    const handleError = (error) => {
        console.error('QR Scanner Error:', error);
        
        if (error?.name === 'NotAllowedError' || error?.message?.includes('permission')) {
            setError('Camera permission denied. Please allow camera access and try again.');
            setHasPermission(false);
        } else if (error?.name === 'NotFoundError') {
            setError('No camera found. Please check your camera connection.');
        } else if (error?.name === 'NotSupportedError') {
            setError('Camera not supported in this browser. Please use a modern browser.');
        } else {
            setError(`Camera error: ${error?.message || 'Unknown error'}`);
        }
        
        onScanError && onScanError(error);
    };

    const handleRetry = () => {
        setError(null);
        setHasPermission(null);
        setCameraReady(false);
    };

    const modalFooter = [
        <Button key="cancel" onClick={onCancel}>
            Cancel
        </Button>
    ];

    if (error && (error.includes('permission') || error.includes('Camera'))) {
        modalFooter.push(
            <Button 
                key="retry" 
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={handleRetry}
            >
                Retry
            </Button>
        );
    }

    return (
        <Modal
            title={
                <span>
                    <ScanOutlined style={{ marginRight: '8px' }} />
                    {title}
                </span>
            }
            open={visible}
            onCancel={onCancel}
            footer={modalFooter}
            centered
            width={500}
            maskClosable={false}
        >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                {error ? (
                    <div style={{ marginBottom: '20px' }}>
                        <Alert
                            message="Scanner Error"
                            description={error}
                            type="error"
                            showIcon
                            style={{ marginBottom: '16px', textAlign: 'left' }}
                        />
                        
                        {error.includes('permission') && (
                            <div style={{ marginTop: '16px', textAlign: 'left' }}>
                                <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                                    To enable camera access:
                                </Text>
                                <Text style={{ fontSize: '12px', color: '#666' }}>
                                    1. Click the camera icon in your browser's address bar
                                    <br />
                                    2. Select "Allow" for camera permission
                                    <br />
                                    3. Refresh the page if needed
                                </Text>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {!cameraReady && (
                            <div style={{ marginBottom: '20px' }}>
                                <Spin size="large" />
                                <Text style={{ display: 'block', marginTop: '16px', color: '#666' }}>
                                    Initializing camera...
                                </Text>
                            </div>
                        )}
                        
                        <div style={{ 
                            width: '100%', 
                            maxWidth: '400px', 
                            margin: '0 auto',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: cameraReady ? '2px solid #52c41a' : '2px solid #d9d9d9'
                        }}>
                            <Scanner
                                onScan={handleScan}
                                onError={handleError}
                                constraints={{
                                    facingMode: 'environment' // Prefer back camera on mobile
                                }}
                                formats={['qr_code']}
                                scanDelay={500}
                                styles={{
                                    container: {
                                        width: '100%',
                                        height: '300px'
                                    },
                                    video: {
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }
                                }}
                                components={{
                                    finder: true,
                                    torch: true,
                                    onOff: false
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    width: '200px',
                                    height: '200px',
                                    marginTop: '-100px',
                                    marginLeft: '-100px',
                                    border: '3px solid #52c41a',
                                    borderRadius: '12px',
                                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
                                    pointerEvents: 'none'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '-1px',
                                        left: '-1px',
                                        width: '30px',
                                        height: '30px',
                                        borderTop: '4px solid #52c41a',
                                        borderLeft: '4px solid #52c41a',
                                        borderRadius: '12px 0 0 0'
                                    }} />
                                    <div style={{
                                        position: 'absolute',
                                        top: '-1px',
                                        right: '-1px',
                                        width: '30px',
                                        height: '30px',
                                        borderTop: '4px solid #52c41a',
                                        borderRight: '4px solid #52c41a',
                                        borderRadius: '0 12px 0 0'
                                    }} />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-1px',
                                        left: '-1px',
                                        width: '30px',
                                        height: '30px',
                                        borderBottom: '4px solid #52c41a',
                                        borderLeft: '4px solid #52c41a',
                                        borderRadius: '0 0 0 12px'
                                    }} />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-1px',
                                        right: '-1px',
                                        width: '30px',
                                        height: '30px',
                                        borderBottom: '4px solid #52c41a',
                                        borderRight: '4px solid #52c41a',
                                        borderRadius: '0 0 12px 0'
                                    }} />
                                </div>
                            </Scanner>
                        </div>
                        
                        {cameraReady && (
                            <div style={{ marginTop: '16px' }}>
                                <Text style={{ fontSize: '14px', color: '#52c41a', fontWeight: 'bold' }}>
                                    <CameraOutlined style={{ marginRight: '8px' }} />
                                    Camera Ready
                                </Text>
                                <br />
                                <Text style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    Position the QR code within the green frame
                                </Text>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};

export default QRCameraScanner;