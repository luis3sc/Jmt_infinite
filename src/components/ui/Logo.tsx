import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  objectPosition?: string;
  isPrint?: boolean;
}

export function Logo({
  className,
  width,
  height,
  fill = false,
  priority = true,
  objectPosition = "object-contain",
  isPrint = false,
}: LogoProps) {
  const src = "/assets/images/jmtinfinite_logo.svg";
  const alt = "JMT Infinite Logo";

  if (isPrint) {
    // Standard img tag for absolute safety in print layouts
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ 
          width: width ? `${width}px` : undefined, 
          height: height ? `${height}px` : undefined 
        }}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={cn("object-contain", objectPosition, className)}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 144}
      height={height || 48}
      className={cn("object-contain", className)}
      priority={priority}
    />
  );
}
