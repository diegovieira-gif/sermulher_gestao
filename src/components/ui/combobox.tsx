import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  allowCreate?: boolean;
  onCreateOption?: (newOption: string) => void;
  disabled?: boolean;
  clearable?: boolean;
}

const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = "Selecione uma opção...",
      searchPlaceholder = "Buscar...",
      emptyMessage = "Nenhuma opção encontrada.",
      allowCreate = false,
      onCreateOption,
      disabled = false,
      clearable = true,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => containerRef.current!);

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (currentValue: string) => {
      onValueChange?.(currentValue === value ? "" : currentValue);
      setOpen(false);
      setSearch("");
    };

    const handleCreateOption = () => {
      if (search.trim() && allowCreate) {
        onCreateOption?.(search.trim());
        setSearch("");
        setOpen(false);
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onValueChange?.("");
      setSearch("");
      setOpen(false);
    };

    // Close on outside click
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setOpen(false);
        }
      };

      if (open) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [open]);

    // Focus search input when opened
    React.useEffect(() => {
      if (open && inputRef.current) {
        inputRef.current.focus();
      }
    }, [open]);

    return (
      <div ref={containerRef} className="relative w-full">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "justify-between items-center"
          )}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {selectedOption?.label || placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {clearable && value && !disabled && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-input rounded-md shadow-md z-50">
            <div className="p-2">
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && allowCreate && search.trim()) {
                    e.preventDefault();
                    handleCreateOption();
                  } else if (e.key === "Escape") {
                    setOpen(false);
                  }
                }}
                className={cn(
                  "flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                )}
              />
            </div>

            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                <div className="space-y-1 p-1">
                  {filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        value === option.value && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : allowCreate && search.trim() ? (
                <div className="p-2">
                  <button
                    type="button"
                    onClick={handleCreateOption}
                    className="flex w-full items-center rounded-sm bg-accent px-2 py-1.5 text-sm text-accent-foreground outline-none hover:bg-accent/80"
                  >
                    Criar "{search}"
                  </button>
                </div>
              ) : (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);
Combobox.displayName = "Combobox";

export { Combobox };
