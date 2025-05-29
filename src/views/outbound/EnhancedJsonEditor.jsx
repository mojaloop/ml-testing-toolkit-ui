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
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-tomorrow_night_blue';
import { Row, Col, Typography, Tag, Tooltip, Button, Space } from 'antd';
import './EnhancedJsonEditor.css';

const { Text } = Typography;

/**
 * EnhancedJsonEditor - A replacement for jsoneditor-react with React 19 support
 * This component provides JSON editing capabilities similar to jsoneditor-react 
 * but built on top of react-ace for React 19 compatibility
 */
const EnhancedJsonEditor = ({ ref, ...props }) => {
    const {
        value = {},
        onChange = () => {},
        schema = null,
        mode = 'code',
        theme = 'ace/theme/tomorrow_night_blue',
        search = false,
        statusBar = false,
        navigationBar = false,
        ajv = null,
        ace = null,
    } = props;

    const [editorText, setEditorText] = useState('');
    const [errors, setErrors] = useState([]);
    const [editorHeight, setEditorHeight] = useState('400px');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const editorRef = useRef(null);
    const containerRef = useRef(null);

    // Convert object to string if needed
    useEffect(() => {
        try {
            const stringValue = typeof value === 'string' 
                ? value 
                : JSON.stringify(value, null, 2);
            setEditorText(stringValue);
            validateJson(stringValue);
        } catch (err) {
            setErrors([err.message]);
        }
    }, [value]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        get: () => {
            try {
                return JSON.parse(editorText);
            } catch (e) {
                return null;
            }
        },
        set: json => {
            try {
                const stringValue = typeof json === 'string' 
                    ? json 
                    : JSON.stringify(json, null, 2);
                setEditorText(stringValue);
                validateJson(stringValue);
            } catch (err) {
                setErrors([err.message]);
            }
        },
        focus: () => {
            if(editorRef.current) {
                editorRef.current.editor.focus();
            }
        },
        getEditor: () => editorRef.current?.editor,
        toggleFullscreen: () => {
            setIsFullscreen(!isFullscreen);
        },
    }));

    const validateJson = text => {
        try {
            // Parse the JSON
            const parsedJson = JSON.parse(text);
      
            // Validate against schema if provided and ajv is available
            if(schema && ajv) {
                const validate = ajv.compile(schema);
                const valid = validate(parsedJson);
                if(!valid) {
                    setErrors(validate.errors.map(error => 
                        `${error.dataPath} ${error.message}`,
                    ));
                    return false;
                }
            }
      
            // Clear errors if validation passes
            setErrors([]);
            return true;
        } catch (err) {
            setErrors([err.message]);
            return false;
        }
    };

    const handleChange = newText => {
        setEditorText(newText);
        try {
            const newJsonObject = JSON.parse(newText);
      
            // Validate against schema if provided and ajv is available
            if(schema && ajv) {
                const validate = ajv.compile(schema);
                const valid = validate(newJsonObject);
                if(!valid) {
                    setErrors(validate.errors.map(error => 
                        `${error.dataPath} ${error.message}`,
                    ));
                    return;
                }
            }
      
            setErrors([]);
            onChange(newJsonObject);
        } catch (err) {
            setErrors([err.message]);
        }
    };

    // Handle fullscreen toggle
    useEffect(() => {
        if(isFullscreen) {
            document.body.style.overflow = 'hidden';
            setEditorHeight('calc(100vh - 100px)');
        } else {
            document.body.style.overflow = '';
            setEditorHeight('400px');
        }
    
        // Ensure editor resizes correctly
        if(editorRef.current) {
            setTimeout(() => {
                editorRef.current.editor.resize();
            }, 100);
        }
    
        return () => {
            document.body.style.overflow = '';
        };
    }, [isFullscreen]);

    const renderErrorMessages = () => {
        return errors.map((error, index) => (
            <div key={index}>
                <Text mark>{error}</Text>
            </div>
        ));
    };

    // Format the JSON for readability
    const formatJson = () => {
        try {
            const formatted = JSON.stringify(JSON.parse(editorText), null, 2);
            setEditorText(formatted);
            validateJson(formatted);
        } catch (err) {
            // Do nothing, the error is already captured
        }
    };

    const effectiveTheme = theme.replace('ace/theme/', '');

    return (
        <div 
            ref={containerRef} 
            className={`enhanced-json-editor ${isFullscreen ? 'fullscreen' : ''}`}
        >
            {navigationBar && (
                <Row className="editor-navigation-bar">
                    <Col span={24}>
                        <Space>
                            <Tooltip title="Format JSON">
                                <Button 
                                    size="small" 
                                    onClick={formatJson}
                                    disabled={errors.length > 0}
                                >
                  Format
                                </Button>
                            </Tooltip>
                            <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                                <Button 
                                    size="small" 
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                >
                                    {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                                </Button>
                            </Tooltip>
                        </Space>
                    </Col>
                </Row>
            )}
      
            <Row>
                <Col span={24}>
                    <AceEditor
                        ref={editorRef}
                        mode="json"
                        theme={effectiveTheme}
                        width="100%"
                        height={editorHeight}
                        value={editorText}
                        onChange={handleChange}
                        name={`json-editor-${Math.random().toString(36).substring(7)}`}
                        wrapEnabled
                        showPrintMargin
                        showGutter
                        tabSize={2}
                        enableBasicAutocompletion
                        enableLiveAutocompletion
                        setOptions={{
                            useWorker: false, // Disable worker to avoid CORS issues
                            showLineNumbers: true,
                        }}
                    />
                </Col>
            </Row>
      
            {(statusBar || errors.length > 0) && (
                <Row className="editor-status-bar">
                    <Col span={24}>
                        {errors.length > 0 ? (
                            <>
                                <Row>
                                    <Col span={24}>
                                        <Tag color="red">Invalid JSON - Changes not saved</Tag>
                                    </Col>
                                </Row>
                                <Row className="mt-1">
                                    <Col span={24}>
                                        {renderErrorMessages()}
                                    </Col>
                                </Row>
                            </>
                        ) : statusBar && (
                            <Tag color="green">Valid JSON</Tag>
                        )}
                    </Col>
                </Row>
            )}
        </div>
    );
};

EnhancedJsonEditor.propTypes = {
    value: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.string]),
    onChange: PropTypes.func,
    schema: PropTypes.object,
    mode: PropTypes.string,
    theme: PropTypes.string,
    search: PropTypes.bool,
    statusBar: PropTypes.bool,
    navigationBar: PropTypes.bool,
    ajv: PropTypes.object,
    ace: PropTypes.object,
};

EnhancedJsonEditor.displayName = 'EnhancedJsonEditor';

export default EnhancedJsonEditor; 