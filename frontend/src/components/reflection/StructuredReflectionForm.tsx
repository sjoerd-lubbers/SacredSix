"use client"

import React from "react"
import { Textarea } from "@/components/ui/textarea"
import { createStructuredContent, DAILY_QUESTIONS, WEEKLY_QUESTIONS } from "./ReflectionHelpers"

interface StructuredReflectionFormProps {
  type: "daily" | "weekly"
  answers: { q1: string; q2: string; q3: string }
  setAnswers: React.Dispatch<React.SetStateAction<{ q1: string; q2: string; q3: string }>>
  onContentChange: (content: string) => void
}

export const StructuredReflectionForm: React.FC<StructuredReflectionFormProps> = ({
  type,
  answers,
  setAnswers,
  onContentChange
}) => {
  const questions = type === "daily" ? DAILY_QUESTIONS : WEEKLY_QUESTIONS;

  const handleAnswerChange = (questionIndex: number, value: string) => {
    const newAnswers = { ...answers };
    
    // Update the specific question's answer
    if (questionIndex === 0) newAnswers.q1 = value;
    else if (questionIndex === 1) newAnswers.q2 = value;
    else if (questionIndex === 2) newAnswers.q3 = value;
    
    // Update the state
    setAnswers(newAnswers);
    
    // Generate the structured content and call the callback
    onContentChange(createStructuredContent(type, newAnswers));
  };

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <div key={index}>
          <h4 className="text-sm font-medium mb-2">{question}</h4>
          <Textarea 
            className="min-h-[80px]"
            value={index === 0 ? answers.q1 : index === 1 ? answers.q2 : answers.q3}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
};
