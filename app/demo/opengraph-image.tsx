import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const KPI_CARDS = [
  { label: "Active Leads",    value: "47"       },
  { label: "Open Deals",      value: "8"        },
  { label: "Pipeline",        value: "£127,500" },
  { label: "Monthly Revenue", value: "£38,400"  },
];

const NAV = ["Dashboard", "Deals", "Finance", "Inbox", "CRM", "Outreach", "Tasks", "Reports"];

const DEALS = [
  { name: "Sarah Thompson — HMO Management",     stage: "Negotiation", value: "£18,000", color: "#10b981" },
  { name: "Marcus Webb — Portfolio Acquisition", stage: "Proposal",    value: "£45,000", color: "#6366f1" },
  { name: "James Hartley — Refurbishment",       stage: "In Progress", value: "£22,500", color: "#f59e0b" },
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.05) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* LEFT — branding and copy */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px 48px 64px 64px",
            width: "500px",
            flexShrink: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "36px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#6366f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 900,
                color: "white",
              }}
            >
              B
            </div>
            <span style={{ fontSize: "22px", fontWeight: 900, color: "white", letterSpacing: "-0.5px" }}>
              Braxton OS
            </span>
          </div>

          {/* Headline line 1 */}
          <div style={{ display: "flex", fontSize: "50px", fontWeight: 900, color: "white", lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: "2px" }}>
            Run Your Entire
          </div>
          {/* Headline line 2 */}
          <div style={{ display: "flex", fontSize: "50px", fontWeight: 900, color: "white", lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: "2px" }}>
            Business From
          </div>
          {/* Headline line 3 — accented */}
          <div style={{ display: "flex", fontSize: "50px", fontWeight: 900, color: "#818cf8", lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: "24px" }}>
            One Dashboard
          </div>

          {/* Sub-headline */}
          <div style={{ display: "flex", fontSize: "17px", color: "#94a3b8", marginBottom: "32px" }}>
            CRM • Inbox • Projects • Finance • AI Automation
          </div>

          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(99,102,241,0.2)",
              border: "1px solid rgba(99,102,241,0.4)",
              borderRadius: "100px",
              padding: "9px 20px",
              width: "fit-content",
            }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#818cf8", display: "flex" }} />
            <span style={{ color: "#a5b4fc", fontSize: "14px", fontWeight: 600 }}>
              72-hour live demo — no credit card
            </span>
          </div>
        </div>

        {/* RIGHT — dashboard mockup */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "40px 48px 40px 16px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Workspace window */}
          <div
            style={{
              display: "flex",
              flex: 1,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            {/* Sidebar */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "120px",
                background: "rgba(15,23,42,0.85)",
                borderRight: "1px solid rgba(255,255,255,0.07)",
                padding: "16px 8px",
                gap: "2px",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", color: "#e2e8f0", fontSize: "11px", fontWeight: 900, marginBottom: "12px", paddingLeft: "8px" }}>
                Braxton OS
              </div>
              {NAV.map((item, i) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    padding: "5px 8px",
                    borderRadius: "6px",
                    fontSize: "10px",
                    fontWeight: i === 0 ? 700 : 400,
                    color: i === 0 ? "#a5b4fc" : "#475569",
                    background: i === 0 ? "rgba(99,102,241,0.2)" : "transparent",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Content area */}
            <div
              style={{
                display: "flex",
                flex: 1,
                flexDirection: "column",
                padding: "16px",
                background: "#f8fafc",
                gap: "10px",
              }}
            >
              {/* Topbar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Dashboard</div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "10px",
                    background: "#eef2ff",
                    color: "#4f46e5",
                    border: "1px solid #c7d2fe",
                    borderRadius: "100px",
                    padding: "3px 10px",
                    fontWeight: 600,
                  }}
                >
                  Demo mode
                </div>
              </div>

              {/* KPI cards */}
              <div style={{ display: "flex", gap: "8px" }}>
                {KPI_CARDS.map(card => (
                  <div
                    key={card.label}
                    style={{
                      display: "flex",
                      flex: 1,
                      flexDirection: "column",
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "10px",
                    }}
                  >
                    <div style={{ display: "flex", fontSize: "16px", fontWeight: 900, color: "#0f172a" }}>{card.value}</div>
                    <div style={{ display: "flex", fontSize: "9px", color: "#94a3b8", marginTop: "3px" }}>{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Deals table */}
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  flexDirection: "column",
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                {/* Table header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #f1f5f9",
                    padding: "8px 12px",
                  }}
                >
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#0f172a" }}>Recent Deals</span>
                  <span style={{ fontSize: "9px", color: "#6366f1", fontWeight: 600 }}>View all →</span>
                </div>

                {/* Deal rows */}
                {DEALS.map((deal, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "7px 12px",
                      borderBottom: i < DEALS.length - 1 ? "1px solid #f8fafc" : "none",
                    }}
                  >
                    <div style={{ display: "flex", fontSize: "10px", color: "#334155", fontWeight: 500 }}>{deal.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          display: "flex",
                          fontSize: "9px",
                          color: deal.color,
                          background: `${deal.color}22`,
                          padding: "2px 8px",
                          borderRadius: "100px",
                          fontWeight: 600,
                        }}
                      >
                        {deal.stage}
                      </div>
                      <div style={{ display: "flex", fontSize: "10px", fontWeight: 700, color: "#0f172a" }}>{deal.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
