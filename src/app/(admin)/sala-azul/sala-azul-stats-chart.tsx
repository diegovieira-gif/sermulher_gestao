"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DistribuicaoPericulosidade {
  nivel: string;
  quantidade: number;
}

interface SalaAzulStatsChartProps {
  data: DistribuicaoPericulosidade[];
}

export function SalaAzulStatsChart({ data }: SalaAzulStatsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="nivel"
          className="text-muted-foreground"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <YAxis
          className="text-muted-foreground"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            color: "hsl(var(--foreground))",
          }}
          formatter={(value: any) => [value, "Quantidade"]}
          labelFormatter={(label) => `Nível: ${label}`}
        />
        <Legend
          formatter={(value) => (
            <span className="text-sm text-muted-foreground">{value}</span>
          )}
        />
        <Bar
          dataKey="quantidade"
          fill="#3b82f6"
          radius={[8, 8, 0, 0]}
          name="Participantes"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
