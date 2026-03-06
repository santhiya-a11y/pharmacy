import { useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Check, Upload, X, Image } from "lucide-react";

export interface BagItem {
  id: string;
  name: string;
  size: string;
  price: number;
  color: string;
  icon: string;
  imageUrl?: string;
}

const DEFAULT_BAGS: BagItem[] = [
  { id: "bag-sm-white", name: "Small White Bag", size: "Small", price: 2, color: "bg-secondary/60 border-border", icon: "🛍️" },
  { id: "bag-md-white", name: "Medium White Bag", size: "Medium", price: 3, color: "bg-secondary/60 border-border", icon: "🛍️" },
  { id: "bag-lg-white", name: "Large White Bag", size: "Large", price: 5, color: "bg-secondary/60 border-border", icon: "🛍️" },
  { id: "bag-sm-brown", name: "Small Paper Bag", size: "Small", price: 3, color: "bg-secondary/60 border-border", icon: "📦" },
  { id: "bag-md-brown", name: "Medium Paper Bag", size: "Medium", price: 5, color: "bg-secondary/60 border-border", icon: "📦" },
  { id: "bag-lg-brown", name: "Large Paper Bag", size: "Large", price: 7, color: "bg-secondary/60 border-border", icon: "📦" },
  { id: "bag-branded", name: "Branded Bag", size: "Standard", price: 10, color: "bg-primary/5 border-primary/20", icon: "🏷️" },
  { id: "bag-eco", name: "Eco Cloth Bag", size: "Standard", price: 15, color: "bg-primary/5 border-primary/20", icon: "♻️" },
];

interface BagSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (bag: BagItem) => void;
}

const BagSelector = ({ open, onOpenChange, onSelect }: BagSelectorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bags, setBags] = useState<BagItem[]>(DEFAULT_BAGS);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (bag: BagItem) => {
    setSelectedId(bag.id);
    setTimeout(() => {
      onSelect(bag);
      onOpenChange(false);
      setSelectedId(null);
    }, 200);
  };

  const triggerUpload = (bagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadingId(bagId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingId) return;
    const url = URL.createObjectURL(file);
    setBags(prev => prev.map(b => b.id === uploadingId ? { ...b, imageUrl: url } : b));
    setUploadingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (bagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBags(prev => prev.map(b => b.id === bagId ? { ...b, imageUrl: undefined } : b));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Select Bag
          </DialogTitle>
          <DialogDescription>Choose a bag type to add to the bill. You can upload real product photos.</DialogDescription>
        </DialogHeader>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          {bags.map(bag => (
            <button
              key={bag.id}
              onClick={() => handleSelect(bag)}
              className={`group relative flex flex-col items-center rounded-xl border-2 p-3 text-center transition-all hover:shadow-md
                ${selectedId === bag.id ? "border-primary bg-primary/5 shadow-md scale-[1.02]" : `${bag.color} hover:border-primary/40`}`}
            >
              {selectedId === bag.id && (
                <div className="absolute top-1.5 right-1.5 bg-primary rounded-full p-0.5">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              {/* Image or emoji */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2 bg-muted/50 flex items-center justify-center">
                {bag.imageUrl ? (
                  <>
                    <img src={bag.imageUrl} alt={bag.name} className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => removeImage(bag.id, e)}
                      className="absolute top-1 right-1 bg-destructive/90 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-destructive-foreground" />
                    </button>
                  </>
                ) : (
                  <span className="text-3xl">{bag.icon}</span>
                )}
                {/* Upload overlay */}
                {!bag.imageUrl && (
                  <button
                    onClick={(e) => triggerUpload(bag.id, e)}
                    className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <Upload className="h-4 w-4 text-foreground/60" />
                      <span className="text-[9px] text-foreground/60 font-medium">Upload</span>
                    </div>
                  </button>
                )}
              </div>
              <p className="text-xs font-semibold text-foreground leading-tight">{bag.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="outline" className="text-[9px] h-4 px-1">{bag.size}</Badge>
                <span className="text-xs font-bold text-primary">₹{bag.price}</span>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BagSelector;
