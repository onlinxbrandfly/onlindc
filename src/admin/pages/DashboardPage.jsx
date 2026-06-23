import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function scoreOf(submission){
  return Number(submission.score_percentage || 0);
}

function opportunityLabel(score){
  if(score < 42) return "High Need";
  if(score < 62) return "Strong Onlin Fit";
  if(score < 80) return "Growth Opportunity";
  return "Advanced Opportunity";
}

function phoneAvailable(submission){
  return String(submission.phone || "").replace(/\D/g, "").length >= 8;
}

function reportUrl(submission){
  if(submission.report_url) return submission.report_url;
  if(submission.report_slug) return `${window.location.origin}/report/${submission.report_slug}`;
  return `${window.location.origin}/report/${submission.id}`;
}

function whatsappLink(submission){
  const phone = String(submission.phone || "").replace(/\D/g, "").slice(-10);
  if(!phone) return "#";
  const message = `Hello ${submission.owner_name || ""}, your Onlin Business Diagnostic Report is ready. You can view it here: ${reportUrl(submission)}`;
  return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
}

export default function DashboardPage({ data }){
  const submissions = data.submissions || [];
  const avgScore = submissions.length ? Math.round(submissions.reduce((sum, s) => sum + Number(s.score_percentage || 0), 0) / submissions.length) : 0;

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const leadsThisWeek = submissions.filter(s => new Date(s.created_at).getTime() >= weekAgo).length;
  const highNeed = submissions.filter(s => scoreOf(s) < 42).length;
  const strongFit = submissions.filter(s => scoreOf(s) >= 42 && scoreOf(s) < 62).length;
  const growthOpportunity = submissions.filter(s => scoreOf(s) >= 62 && scoreOf(s) < 80).length;
  const advancedOpportunity = submissions.filter(s => scoreOf(s) >= 80).length;

  const industryData = Object.values(submissions.reduce((acc, s) => {
    const name = s.industries?.name || "Unknown";
    if(!acc[name]) acc[name] = { name, count: 0, scoreTotal: 0, highNeed: 0 };
    acc[name].count += 1;
    acc[name].scoreTotal += scoreOf(s);
    if(scoreOf(s) < 42) acc[name].highNeed += 1;
    return acc;
  }, {})).map(item => ({
    ...item,
    avgScore: item.count ? Math.round(item.scoreTotal / item.count) : 0
  })).sort((a,b) => b.highNeed - a.highNeed || b.count - a.count);

  const priorityQueue = [...submissions]
    .sort((a,b) => {
      const scoreDiff = scoreOf(a) - scoreOf(b);
      if(scoreDiff !== 0) return scoreDiff;
      const phoneDiff = Number(phoneAvailable(b)) - Number(phoneAvailable(a));
      if(phoneDiff !== 0) return phoneDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 10);

  const segmentData = [
    { name: "High Need", count: highNeed },
    { name: "Strong Fit", count: strongFit },
    { name: "Growth", count: growthOpportunity },
    { name: "Advanced", count: advancedOpportunity }
  ];

  return (
    <>
      <div className="pageHead">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Opportunity-first view: low readiness score means stronger need for Onlin.in.</p>
        </div>
      </div>

      <div className="kpiGrid">
        <div className="kpi"><b>{submissions.length}</b><span>Total Leads</span></div>
        <div className="kpi"><b>{highNeed}</b><span>High Need Leads</span></div>
        <div className="kpi"><b>{strongFit}</b><span>Strong Onlin Fit</span></div>
        <div className="kpi"><b>{avgScore}%</b><span>Average Score</span></div>
        <div className="kpi"><b>{leadsThisWeek}</b><span>Leads This Week</span></div>
        <div className="kpi"><b>{growthOpportunity + advancedOpportunity}</b><span>Growth / Advanced</span></div>
      </div>

      <div className="adminCard">
        <h3>Sales Priority Queue</h3>
        <p className="muted">Sorted by lowest score first, then phone availability and recency.</p>
        <div className="tableWrap">
          <table>
            <thead><tr><th>Business</th><th>Industry</th><th>Score</th><th>Opportunity</th><th>Phone</th><th>Actions</th></tr></thead>
            <tbody>
              {priorityQueue.map(s => {
                const score = scoreOf(s);
                return (
                  <tr key={s.id}>
                    <td><b>{s.business_name}</b><br/><small>{s.owner_name || "Business Owner"} · {new Date(s.created_at).toLocaleString()}</small></td>
                    <td>{s.industries?.name || "Unknown"}</td>
                    <td><b>{score}%</b></td>
                    <td>{opportunityLabel(score)}</td>
                    <td>{s.phone || "-"}</td>
                    <td>
                      <div className="rowActions">
                        <a href={reportUrl(s)} target="_blank">Report</a>
                        {phoneAvailable(s) && <a href={whatsappLink(s)} target="_blank">WhatsApp</a>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="reportGrid">
        <div className="adminCard">
          <h3>Readiness Segments</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="adminCard">
          <h3>Industry Opportunity</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={industryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="highNeed" name="High Need" />
                <Bar dataKey="count" name="Total Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="adminCard">
        <h3>Industry Breakdown</h3>
        <div className="tableWrap">
          <table>
            <thead><tr><th>Industry</th><th>Total Leads</th><th>High Need</th><th>Average Score</th></tr></thead>
            <tbody>
              {industryData.map(item => (
                <tr key={item.name}>
                  <td><b>{item.name}</b></td>
                  <td>{item.count}</td>
                  <td>{item.highNeed}</td>
                  <td>{item.avgScore}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
