"use client";

import { useMemo, useState } from "react";
import { Bot, SendHorizonal, User } from "lucide-react";
import { EXPIRY_THRESHOLDS_DAYS, getExpiryAlertLevel } from "@/utils/supplyLogic";

const INITIAL_MESSAGES = [
  {
    id: "m1",
    role: "assistant",
    text: "Hi! Ask me: 'low stock' or 'expiring' to get quick inventory insights.",
  },
];

function buildInventoryReply(input) {
  const text = input.toLowerCase();
  const inventory = JSON.parse(localStorage.getItem("inventory") ?? "[]");

  function fmt(value, fallback = "—") {
    if (value === null || value === undefined || value === "") return fallback;
    return String(value);
  }

  function normalize(s) {
    return String(s ?? "").trim().toLowerCase();
  }

  if (text.includes("low stock")) {
    const low = inventory.filter((i) => i.lowStock || Number(i.stock ?? 0) <= Number(i.rop ?? Infinity));
    if (!low.length) return "No low stock (ROP breach) items right now.";
    return `Low stock items: ${low
      .slice(0, 10)
      .map((i) => `${i.name} (${i.batchNumber}) stock=${i.stock}, ROP=${i.rop}`)
      .join(", ")}.`;
  }

  if (text.includes("expiring")) {
    const expiring = inventory.filter((i) => {
      const { level } = getExpiryAlertLevel(i.expiryDate);
      return level !== "none";
    });

    if (!expiring.length) {
      return `No items in expiry alert windows (${EXPIRY_THRESHOLDS_DAYS.critical}/${EXPIRY_THRESHOLDS_DAYS.warning}/${EXPIRY_THRESHOLDS_DAYS.advisory} days).`;
    }
    return `Expiring soon: ${expiring
      .slice(0, 10)
      .map((i) => {
        const { level, daysToExpiry } = getExpiryAlertLevel(i.expiryDate);
        return `${i.name} (${i.batchNumber}) expires ${i.expiryDate} [${level}, ${daysToExpiry} days]`;
      })
      .join(", ")}.`;
  }

  // Medicine lookup by name or batch number
  const query = input.trim();
  if (query.length >= 2) {
    const q = normalize(query);
    const matches = inventory.filter((i) => {
      const name = normalize(i.name);
      const batch = normalize(i.batchNumber);
      return name.includes(q) || batch.includes(q);
    });

    if (matches.length === 1) {
      const i = matches[0];
      return [
        `Medicine: ${fmt(i.name)}`,
        `Batch: ${fmt(i.batchNumber)}`,
        `Stock: ${fmt(i.stock)}`,
        `ROP: ${fmt(i.rop)}`,
        `Demand/day: ${fmt(i.demandPerDay)}`,
        `Lead time: ${fmt(i.leadTime)} days`,
        `Expiry: ${fmt(i.expiryDate)}`,
        `Supplier: ${fmt(i.supplier)}`,
        `Temp range: ${fmt(i.tempMin)}°C to ${fmt(i.tempMax)}°C`,
        `Flags: lowStock=${fmt(i.lowStock)}, highRisk=${fmt(i.highRisk)}, expiryAlertLevel=${fmt(i.expiryAlertLevel)}`,
      ].join("\n");
    }

    if (matches.length > 1) {
      const list = matches
        .slice(0, 8)
        .map((i) => `${fmt(i.name)} (${fmt(i.batchNumber)})`)
        .join(", ");
      return `I found multiple matches. Please be more specific:\n${list}`;
    }
  }

  return "Try: 'low stock', 'expiring', or type a medicine name / batch number (e.g. 'Vitamin D' or 'B3157').";
}

export default function AIChat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  function handleSend(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage = { id: `u-${Date.now()}`, role: "user", text: trimmed };
    const assistantMessage = {
      id: `a-${Date.now() + 1}`,
      role: "assistant",
      text: buildInventoryReply(trimmed),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 sm:px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">AI Assistant</h2>
        <p className="mt-1 text-xs text-gray-500">Inventory Q&A powered by local data.</p>
      </div>

      <div className="h-[420px] overflow-y-auto px-4 sm:px-5 py-4 space-y-3 bg-gray-50/60">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
              {!isUser && (
                <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700">
                  <Bot size={14} />
                </span>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
                }`}
              >
                {m.text}
              </div>
              {isUser && (
                <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white">
                  <User size={14} />
                </span>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="border-t border-gray-100 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type: low stock / expiring (30-90-180 days)"
            className="w-full border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <SendHorizonal size={14} />
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

