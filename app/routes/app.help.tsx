import { useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

const FAQS = [
  {
    q: "How do I add a section to my theme?",
    a: "Click “Add to theme” on any unlocked section. Your Shopify Theme Editor opens with the block ready to place and customize.",
  },
  {
    q: "Does this edit or slow down my theme files?",
    a: "No. Section App uses official Shopify Theme App Extension blocks—no theme code edits are made and nothing is left behind if you uninstall.",
  },
  {
    q: "What happens if I switch themes?",
    a: "Your unlocked sections and Pro subscription stay tied to your store, so you can add them to your new theme anytime.",
  },
  {
    q: "Can I buy a single section instead of subscribing?",
    a: "Yes. Every Pro section can be unlocked individually for a one-time Shopify charge, or you can unlock everything with Pro at $9.99/month.",
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { shopDomain: session.shop };
};

export default function HelpSupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitted(true);
    setSubject("");
    setMessage("");
  };

  return (
    <s-page heading="Help & Support">
      <s-section heading="Frequently asked questions">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.q}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  background: "#ffffff",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: 0,
                    padding: "14px 16px",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: "14px",
                    display: "flex",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <span>{faq.q}</span>
                  <span>{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: "0 16px 14px",
                      fontSize: "13px",
                      color: "#4b5563",
                      lineHeight: 1.5,
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </s-section>

      <s-section heading="Contact support">
        {submitted && (
          <div
            style={{
              padding: "12px 14px",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: "8px",
              color: "#065f46",
              fontSize: "13px",
              marginBottom: "12px",
            }}
          >
            Thanks! Your support request has been received and we&apos;ll reply
            within 1 business day.
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxWidth: "560px",
          }}
        >
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (e.g., Help placing Hero Split on Dawn theme)"
            required
            style={{
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
            }}
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what you need help with..."
            rows={4}
            required
            style={{
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              resize: "vertical",
            }}
          />
          <div>
            <s-button type="submit" variant="primary">
              Send message
            </s-button>
          </div>
        </form>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
