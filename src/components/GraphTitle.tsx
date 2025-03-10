import { LinkIcon } from "lucide-react";
import { MobileFriendlyTooltip } from "./MobileFriendlyTooltip";
import { cn } from "@/lib/utils";

export function GraphTitle({
  title,
  sourceUrl,
  tooltipContent,
  children,
}: {
  title: string;
  sourceUrl?: string;
  tooltipContent?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const sharedClasses =
    "text-pretty text-xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-100";
  const TitleComponent = sourceUrl ? (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <h2
        className={cn(
          sharedClasses,
          "group-hover:text-blue-600 dark:group-hover:text-blue-400",
        )}
      >
        {title}
        <LinkIcon className="ml-1 inline-block h-3 w-3 opacity-50 group-hover:opacity-60" />
      </h2>
    </a>
  ) : (
    <h2 className={sharedClasses}>{title}</h2>
  );

  return (
    <div className="mb-4 grid gap-1">
      <div className="inline-flex items-center justify-between gap-1">
        <div className="flex w-full items-center justify-start gap-2">
          {TitleComponent}
        </div>
        {tooltipContent && (
          <MobileFriendlyTooltip>{tooltipContent}</MobileFriendlyTooltip>
        )}
      </div>
      {children}
    </div>
  );
}
