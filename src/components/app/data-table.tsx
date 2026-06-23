import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function DataTable({
  headers,
  rows,
  empty = "No records found."
}: {
  headers: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-500">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-5 py-3">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-center text-slate-500" colSpan={headers.length}>
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="bg-white">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-5 py-4 text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export function DetailList({
  items
}: {
  items: Array<{
    label: string;
    value: ReactNode;
  }>;
}) {
  return (
    <Card>
      <CardContent className="divide-y p-0">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="text-sm text-slate-500">{item.label}</span>
            <span className="text-right text-sm font-semibold text-slate-900">{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
