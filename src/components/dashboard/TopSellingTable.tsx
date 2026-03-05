const topMedicines = [
  { name: "Dolo 650mg", sold: 245, revenue: "₹7,350" },
  { name: "Azithromycin 500mg", sold: 180, revenue: "₹18,000" },
  { name: "Cetirizine 10mg", sold: 156, revenue: "₹4,680" },
  { name: "Pantoprazole 40mg", sold: 134, revenue: "₹8,040" },
  { name: "Amoxicillin 250mg", sold: 120, revenue: "₹6,000" },
];

export const TopSellingTable = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">Top Selling Medicines</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-left font-medium text-muted-foreground">Medicine</th>
              <th className="pb-3 text-right font-medium text-muted-foreground">Sold</th>
              <th className="pb-3 text-right font-medium text-muted-foreground">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topMedicines.map((med, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="py-3 font-medium text-card-foreground">{med.name}</td>
                <td className="py-3 text-right text-muted-foreground">{med.sold}</td>
                <td className="py-3 text-right font-semibold text-card-foreground">{med.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
