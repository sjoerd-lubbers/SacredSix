"use client"

import React from "react"

interface QuestionAnswer {
  question: string;
  answer: string;
}

// Helper to format structured content for display
export const FormattedReflection: React.FC<{ 
  content?: string;
  questionAnswers?: QuestionAnswer[];
}> = ({ content, questionAnswers }) => {
  // If we have questionAnswers but no content, generate content
  if (!content && questionAnswers && questionAnswers.length > 0) {
    content = questionAnswers.map(qa => `### ${qa.question}\n${qa.answer || ""}`).join('\n\n');
  }
  
  // If we still don't have content, return empty
  if (!content) {
    return <p className="text-muted-foreground italic">No content available</p>;
  }
  
  if (!content.startsWith("### ")) {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }
  
  // Split by headers
  const sections = content.split(/(?=### )/);
  
  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        if (!section.trim()) return null;
        
        const [header, ...contentLines] = section.split("\n");
        const sectionContent = contentLines.join("\n").trim();
        
        return (
          <div key={index} className="space-y-1">
            <h5 className="font-medium text-sm">{header.replace("### ", "")}</h5>
            <p className="whitespace-pre-wrap text-sm">{sectionContent}</p>
          </div>
        );
      })}
    </div>
  );
};
