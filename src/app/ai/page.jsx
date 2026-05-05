"use client";

import AIChat from "@/components/AIChat";

export default function AIPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ask questions about low stock and expiring items.
        </p>
      </div>

      <AIChat />
    </div>
  );
}

