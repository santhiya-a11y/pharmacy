import { Plus, ShoppingCart, Pill, PackagePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  { label: "New Bill", icon: ShoppingCart, href: "/pos", accent: true },
  { label: "Add Stock", icon: PackagePlus, href: "/inventory" },
  { label: "Add Medicine", icon: Pill, href: "/medicines" },
  { label: "Purchase Order", icon: Plus, href: "/purchases" },
];

export const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => navigate(action.href)}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
            action.accent
              ? "bg-primary text-primary-foreground shadow-md hover:opacity-90"
              : "border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <action.icon className="h-4 w-4" />
          {action.label}
        </button>
      ))}
    </div>
  );
};
