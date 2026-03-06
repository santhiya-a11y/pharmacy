import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Check } from "lucide-react";

export interface BagItem {
  id: string;
  name: string;
  size: string;
  price: number;
  color: string;
  icon: string;
}

const BAG_OPTIONS: BagItem[] = [
  { id: "bag-sm-white", name: "Small White Bag", size: "Small", price: 2, color: "bg-gray-100 border-gray-300", icon: "🛍️" },
  { id: "bag-md-white", name: "Medium White Bag", size: "Medium", price: 3, color: "bg-gray-100 border-gray-300", icon: "🛍️" },
  { id: "bag-lg-white", name: "Large White Bag", size: "Large", price: 5, color: "bg-gray-100 border-gray-300", icon: "🛍️" },
  { id: "bag-sm-brown", name: "Small Paper Bag", size: "Small", price: 3, color: "bg-amber-50 border-amber-300", icon: "📦" },
  { id: "bag-md-brown", name: "Medium Paper Bag", size: "Medium", price: 5, color: "bg-amber-50 border-amber-300", icon: "📦" },
  { id: "bag-lg-brown", name: "Large Paper Bag", size: "Large", price: 7, color: "bg-amber-50 border-amber-300", icon: "📦" },
  { id: "bag-branded", name: "Branded Bag", size: "Standard", price: 10, color: "bg-primary/10 border-primary/30", icon: "🏷️" },
  { id: "bag-eco", name: "Eco Cloth Bag", size: "Standard", price: 15, color: "bg-emerald-50 border-emerald-300", icon: "♻️" },
];

interface BagSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (bag: BagItem) => void;
}

const BagSelector = ({ open, onOpenChange, onSelect }: BagSelectorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (bag: BagItem) => {
    setSelectedId(bag.id);
    setTimeout(() => {
      onSelect(bag);
      onOpenChange(false);
      setSelectedId(null);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Select Bag
          </DialogTitle>
          <DialogDescription>Choose a bag type to add to the bill</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {BAG_OPTIONS.map(bag => (
            <button
              key={bag.id}
              onClick={() => handleSelect(bag)}
              className={`relative flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all hover:shadow-md
                ${selectedId === bag.id ? "border-primary bg-primary/5 shadow-md scale-[1.02]" : `${bag.color} hover:border-primary/40`}`}
            >
              {selectedId === bag.id && (
                <div className="absolute top-2 right-2 bg-primary rounded-full p-0.5">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <span className="text-3xl">{bag.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{bag.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">{bag.size}</Badge>
                  <span className="text-xs font-bold text-primary">₹{bag.price}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BagSelector;
