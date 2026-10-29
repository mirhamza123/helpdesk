"use client";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Data = {
  statusData: { name: string; value: number }[];
  categoryData: { name: string; count: number }[];
  workloadData: { name: string; active: number; done: number }[];
  avgFirstResponseHours: number | null;
  slaBreaches: number; totalTickets: number; openTickets: number;
};
const COLORS = ["#0284c7", "#4f46e5", "#d97706", "#059669", "#94a3b8"];

const fmtHours = (h: number | null) => (h === null ? "—" : h < 1 ? `${Math.round(h * 60)} min` : `${h.toFixed(1)} h`);

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="panel p-4"><h2 className="mb-3 text-sm font-semibold">{title}</h2>{children}</section>;
}
const Empty = () => <p className="py-16 text-center text-sm text-ink-500">No data yet.</p>;

export function AnalyticsCharts({ data }: { data: Data }) {
  const stats = [
    { label: "Open tickets", value: data.openTickets },
    { label: "Avg. first response", value: fmtHours(data.avgFirstResponseHours) },
    { label: "SLA breaches", value: data.slaBreaches, warn: data.slaBreaches > 0 },
    { label: "All tickets", value: data.totalTickets },
  ];
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="panel p-4">
            <dt className="text-sm text-ink-500">{s.label}</dt>
            <dd className={`mt-1 text-2xl font-semibold tabular-nums ${s.warn ? "text-red-600" : ""}`}>{s.value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Tickets by status">
          {data.totalTickets === 0 ? <Empty /> : (
            <div className="h-72"><ResponsiveContainer><PieChart>
              <Pie data={data.statusData.filter((s) => s.value > 0)} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                {data.statusData.filter((s) => s.value > 0).map((s) => <Cell key={s.name} fill={COLORS[data.statusData.findIndex((x) => x.name === s.name)]} />)}
              </Pie><Tooltip /><Legend />
            </PieChart></ResponsiveContainer></div>
          )}
        </Card>
        <Card title="Tickets by category">
          {data.categoryData.length === 0 ? <Empty /> : (
            <div className="h-72"><ResponsiveContainer><BarChart data={data.categoryData} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} /><Tooltip />
              <Bar dataKey="count" name="Tickets" fill="#0f766e" radius={[0, 4, 4, 0]} />
            </BarChart></ResponsiveContainer></div>
          )}
        </Card>
      </div>
      <Card title="Workload per agent">
        {data.workloadData.length === 0 ? <Empty /> : (
          <div className="h-72"><ResponsiveContainer><BarChart data={data.workloadData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
            <Bar dataKey="active" name="Active" stackId="a" fill="#4f46e5" /><Bar dataKey="done" name="Resolved/Closed" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          </BarChart></ResponsiveContainer></div>
        )}
      </Card>
    </div>
  );
}
