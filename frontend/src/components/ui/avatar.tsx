"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Function to generate a consistent color from a string
function stringToColor(string: string): string {
  // Default colors if string is empty
  if (!string || string.trim() === '') {
    return '#6366F1'; // Indigo color
  }

  // Generate a hash from the string
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Define a set of pleasant, accessible colors
  const colors = [
    '#F87171', // Red
    '#FB923C', // Orange
    '#FBBF24', // Amber
    '#A3E635', // Lime
    '#34D399', // Emerald
    '#22D3EE', // Cyan
    '#60A5FA', // Blue
    '#818CF8', // Indigo
    '#A78BFA', // Violet
    '#E879F9', // Fuchsia
    '#FB7185', // Rose
  ];

  // Use the hash to pick a color
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Function to get initials from a name
function getInitials(name: string): string {
  if (!name || name.trim() === '') {
    return '?';
  }

  // Split the name by spaces and get the first letter of each part
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    // If only one part, return the first two letters or just the first if it's a single letter
    return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  } else {
    // Return the first letter of the first part and the first letter of the last part
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  imageUrl?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, size = 'md', imageUrl, className, ...props }, ref) => {
    const initials = getInitials(name);
    const backgroundColor = stringToColor(name);
    
    // Size classes - ensure perfect squares with aspect-ratio
    const sizeClasses = {
      sm: 'h-8 w-8 text-xs aspect-square',
      md: 'h-10 w-10 text-sm aspect-square',
      lg: 'h-12 w-12 text-base aspect-square',
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full font-medium text-white",
          sizeClasses[size],
          className
        )}
        style={{ backgroundColor }}
        {...props}
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center leading-none">{initials}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
