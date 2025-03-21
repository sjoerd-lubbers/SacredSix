// Helper functions for working with structured reflections

// Helper function to extract the answer for a specific question from the structured content
export const extractQuestionAnswer = (content: string, question: string): string => {
  if (!content.includes(`### ${question}`)) return "";
  
  const questionRegex = new RegExp(`### ${question}\\n([\\s\\S]*?)(?=\\n###|$)`, "m");
  const match = content.match(questionRegex);
  return match ? match[1].trim() : "";
};

// Helper function to update a specific question's answer in the structured content
export const updateQuestionAnswer = (content: string, question: string, answer: string): string => {
  if (!content.includes(`### ${question}`)) return content;
  
  const questionRegex = new RegExp(`(### ${question}\\n)[\\s\\S]*?(?=\\n###|$)`, "m");
  return content.replace(questionRegex, `$1${answer}`);
};

// Helper function to create structured content from individual answers
export const createStructuredContent = (type: string, answers: Record<string, string>): string => {
  if (type === "daily") {
    return `### Wat ging vandaag goed?\n${answers.q1 || ""}\n\n### Wat had ik beter kunnen doen?\n${answers.q2 || ""}\n\n### Welke taak gaf me de meeste energie?\n${answers.q3 || ""}`;
  } else {
    return `### Welke successen heb ik deze week geboekt?\n${answers.q1 || ""}\n\n### Wat heb ik geleerd?\n${answers.q2 || ""}\n\n### Welke drie prioriteiten stel ik voor de volgende week?\n${answers.q3 || ""}`;
  }
};

// Define question interface with optional hint
export interface ReflectionQuestion {
  question: string;
  hint?: string;
}

// Daily reflection questions
export const DAILY_QUESTIONS: ReflectionQuestion[] = [
  {
    question: "Wat ging vandaag goed?",
    hint: "Denk aan taken die je hebt afgerond, gesprekken die goed verliepen, of momenten waarop je productief was."
  },
  {
    question: "Wat had ik beter kunnen doen?",
    hint: "Reflecteer op momenten waarop je vastliep of beslissingen die je anders had kunnen nemen."
  },
  {
    question: "Welke taak gaf me de meeste energie?",
    hint: "Welke activiteit voelde niet als werk en zou je graag vaker willen doen?"
  }
];

// Weekly reflection questions
export const WEEKLY_QUESTIONS: ReflectionQuestion[] = [
  {
    question: "Welke successen heb ik deze week geboekt?",
    hint: "Denk aan afgeronde taken, bereikte mijlpalen of persoonlijke overwinningen."
  },
  {
    question: "Wat heb ik geleerd?",
    hint: "Nieuwe inzichten, vaardigheden of lessen die je hebt opgedaan."
  },
  {
    question: "Welke drie prioriteiten stel ik voor de volgende week?",
    hint: "Moeten er nog projecten Sacred gemaakt worden? Welke projecten verdienen extra aandacht?"
  }
];
