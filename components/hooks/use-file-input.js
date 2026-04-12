import { useState, useRef } from "react";

export function useFileInput({ accept, maxSize }) {
    const [fileName, setFileName] = useState("");
    const [error, setError] = useState("");
    const [fileSize, setFileSize] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const isAcceptedFile = (file) => {
        if (!accept || accept === "*/*") return true;

        const rules = accept.split(",").map((rule) => rule.trim()).filter(Boolean);

        if (rules.length === 0) return true;

        return rules.some((rule) => {
            if (rule.endsWith("/*")) {
                const mimePrefix = rule.replace("/*", "/");
                return file.type.startsWith(mimePrefix);
            }

            if (rule.startsWith(".")) {
                return file.name.toLowerCase().endsWith(rule.toLowerCase());
            }

            return file.type === rule;
        });
    };

    const validateAndSetFile = (file) => {
        setError("");

        if (!file) {
            setSelectedFile(null);
            setFileName("");
            setFileSize(0);
            return;
        }

        if (maxSize && file.size > maxSize * 1024 * 1024) {
            setError(`File size must be less than ${maxSize}MB`);
            setSelectedFile(null);
            setFileName("");
            setFileSize(0);
            return;
        }

        if (!isAcceptedFile(file)) {
            setError(`File type must be ${accept}`);
            setSelectedFile(null);
            setFileName("");
            setFileSize(0);
            return;
        }

        setSelectedFile(file);
        setFileSize(file.size);
        setFileName(file.name);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        validateAndSetFile(file);
    };

    const clearFile = () => {
        setSelectedFile(null);
        setFileName("");
        setError("");
        setFileSize(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return {
        fileName,
        error,
        fileInputRef,
        handleFileSelect,
        validateAndSetFile,
        clearFile,
        fileSize,
        selectedFile,
    };
}
