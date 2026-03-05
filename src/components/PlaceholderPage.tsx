import { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

const PlaceholderPage = ({ title, description, icon: Icon }: PlaceholderPageProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in">
      <div className="rounded-2xl bg-accent p-6 mb-6">
        <Icon className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground max-w-md">{description}</p>
    </div>
  );
};

export default PlaceholderPage;
