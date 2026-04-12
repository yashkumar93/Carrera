"use client";

import { AIInputWithFile } from "@/components/ui/ai-input-with-file";

export function AIInputWithFileDemo() {
    const handleSubmit = (message, file) => {
        console.log("Message:", message);
        console.log("File:", file);
    };

    return (
        <div className="space-y-8 min-w-[400px]">
            <AIInputWithFile onSubmit={handleSubmit} />
        </div>
    );
}
