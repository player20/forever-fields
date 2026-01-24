"use client";

import { useState } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Textarea } from "@/components/ui";

interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  prompt: string;
  example?: string;
}

const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // Personality & Character
  {
    id: "personality",
    category: "Who They Were",
    question: "How would you describe their personality?",
    prompt: "Think about their temperament, humor, quirks, and what made them unique.",
    example: "She was fiercely independent but had the warmest heart. She'd pretend to be grumpy but you'd catch her smiling when she thought no one was looking.",
  },
  {
    id: "values",
    category: "Who They Were",
    question: "What values did they live by?",
    prompt: "What principles guided their decisions? What did they believe in strongly?",
    example: "Family always came first. He believed in hard work, keeping your word, and helping neighbors.",
  },
  {
    id: "phrases",
    category: "Who They Were",
    question: "What phrases or sayings did they often use?",
    prompt: "Favorite expressions, advice they repeated, or unique ways they said things.",
    example: '"Don\'t count your chickens before they hatch." "Life\'s too short for bad coffee." She always said "I love you to the moon and back."',
  },

  // Life Stories
  {
    id: "childhood",
    category: "Their Story",
    question: "What do you know about their childhood?",
    prompt: "Where they grew up, siblings, parents, memorable stories from youth.",
    example: "She grew up on a farm in Iowa during the Depression. She used to tell stories about walking miles to school and how they made do with so little.",
  },
  {
    id: "love_story",
    category: "Their Story",
    question: "What was their love story?",
    prompt: "How did they meet their partner? What was their relationship like?",
    example: "They met at a church dance in 1952. He was too shy to ask her to dance, so she asked him. They were married for 58 years.",
  },
  {
    id: "career",
    category: "Their Story",
    question: "What was their life's work?",
    prompt: "Career, passions, what they dedicated their time to.",
    example: "He worked at the steel mill for 40 years, but his real passion was woodworking. He made furniture for everyone in the family.",
  },
  {
    id: "challenges",
    category: "Their Story",
    question: "What challenges did they overcome?",
    prompt: "Difficult times they faced and how they got through them.",
    example: "She battled cancer twice and beat it both times. She never complained, just said 'we deal with what we're dealt.'",
  },

  // Relationships & Memories
  {
    id: "best_memory",
    category: "Cherished Memories",
    question: "What's your favorite memory with them?",
    prompt: "A specific moment that you treasure.",
    example: "Every Sunday morning, Grandpa would make pancakes shaped like animals. The kitchen would be a mess but we didn't care.",
  },
  {
    id: "taught",
    category: "Cherished Memories",
    question: "What did they teach you?",
    prompt: "Skills, lessons, or wisdom they passed down.",
    example: "She taught me how to garden, how to can vegetables, and that patience is a virtue. She also taught me that it's okay to cry.",
  },
  {
    id: "traditions",
    category: "Cherished Memories",
    question: "What family traditions did they create or keep?",
    prompt: "Holiday traditions, rituals, things they always did.",
    example: "Every Christmas Eve, he'd read 'Twas the Night Before Christmas. Even when we were adults, we'd all gather around for it.",
  },

  // Legacy
  {
    id: "impact",
    category: "Their Legacy",
    question: "How did they impact your life?",
    prompt: "Ways they shaped who you are today.",
    example: "Her strength showed me that women can do anything. I became a doctor because she always told me I was smart enough.",
  },
  {
    id: "want_remembered",
    category: "Their Legacy",
    question: "How would they want to be remembered?",
    prompt: "What would they say was most important about their life?",
    example: "He'd want to be remembered as a good father and grandfather. Family was everything to him.",
  },
  {
    id: "message",
    category: "Their Legacy",
    question: "What would they say to future generations?",
    prompt: "Advice or message for great-grandchildren they may never meet.",
    example: "She always said 'Love fiercely, forgive quickly, and never go to bed angry.' She'd want them to know they come from strong people.",
  },

  // Interests & Passions
  {
    id: "hobbies",
    category: "What They Loved",
    question: "What were their hobbies and interests?",
    prompt: "How did they spend their free time?",
    example: "He loved fishing, watching baseball, and tending his rose garden. Saturday mornings were for the farmer's market.",
  },
  {
    id: "music",
    category: "What They Loved",
    question: "What music did they love?",
    prompt: "Favorite songs, artists, or types of music.",
    example: "She loved Frank Sinatra and big band music. Every anniversary they'd dance to 'The Way You Look Tonight.'",
  },
  {
    id: "food",
    category: "What They Loved",
    question: "What foods remind you of them?",
    prompt: "Favorite dishes, recipes they made, food memories.",
    example: "Her apple pie was legendary. She'd never share the recipe, said 'the secret ingredient is love.' We still haven't figured it out.",
  },
];

interface LegacyInterviewProps {
  deceasedName: string;
  onComplete: (responses: Record<string, string>) => void;
  initialResponses?: Record<string, string>;
}

export function LegacyInterview({
  deceasedName,
  onComplete,
  initialResponses = {},
}: LegacyInterviewProps) {
  const [responses, setResponses] = useState<Record<string, string>>(initialResponses);
  const [currentCategory, setCurrentCategory] = useState<string>("Who They Were");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const categories = Array.from(new Set(INTERVIEW_QUESTIONS.map((q) => q.category)));
  const categoryQuestions = INTERVIEW_QUESTIONS.filter(
    (q) => q.category === currentCategory
  );

  const answeredCount = Object.values(responses).filter((r) => r.trim()).length;
  const totalQuestions = INTERVIEW_QUESTIONS.length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  const handleSave = () => {
    onComplete(responses);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">
            Preserving {deceasedName}'s Legacy
          </CardTitle>
          <CardDescription>
            Share stories, memories, and wisdom to help future generations know and remember{" "}
            {deceasedName}. The more you share, the richer their legacy becomes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{answeredCount} of {totalQuestions} questions answered</span>
              <span>{progress}% complete</span>
            </div>
            <div className="w-full h-2 bg-sage-pale rounded-full overflow-hidden">
              <div
                className="h-full bg-sage transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const categoryAnswered = INTERVIEW_QUESTIONS.filter(
            (q) => q.category === category && responses[q.id]?.trim()
          ).length;
          const categoryTotal = INTERVIEW_QUESTIONS.filter(
            (q) => q.category === category
          ).length;

          return (
            <button
              key={category}
              onClick={() => setCurrentCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                currentCategory === category
                  ? "bg-sage text-white"
                  : "bg-sage-pale text-sage-dark hover:bg-sage-light"
              }`}
            >
              {category}
              {categoryAnswered > 0 && (
                <span className="ml-2 text-xs opacity-75">
                  {categoryAnswered}/{categoryTotal}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Questions for current category */}
      <div className="space-y-4">
        {categoryQuestions.map((question) => (
          <Card
            key={question.id}
            className={`transition-all ${
              responses[question.id]?.trim() ? "border-sage" : ""
            }`}
          >
            <CardHeader
              className="cursor-pointer"
              onClick={() =>
                setExpandedQuestion(
                  expandedQuestion === question.id ? null : question.id
                )
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {responses[question.id]?.trim() && (
                      <span className="text-sage">✓</span>
                    )}
                    {question.question}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {question.prompt}
                  </CardDescription>
                </div>
                <span className="text-gray-400 text-xl">
                  {expandedQuestion === question.id ? "−" : "+"}
                </span>
              </div>
            </CardHeader>

            {expandedQuestion === question.id && (
              <CardContent className="pt-0 space-y-4">
                {question.example && (
                  <div className="bg-sage-pale/50 rounded-lg p-3 text-sm">
                    <span className="font-medium text-sage-dark">Example: </span>
                    <span className="text-gray-600 italic">"{question.example}"</span>
                  </div>
                )}

                <Textarea
                  value={responses[question.id] || ""}
                  onChange={(e) =>
                    setResponses((prev) => ({
                      ...prev,
                      [question.id]: e.target.value,
                    }))
                  }
                  placeholder={`Share your memories about ${deceasedName}...`}
                  className="min-h-[150px]"
                />

                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setExpandedQuestion(null)}
                  >
                    Done with this question
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Save & Continue */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sage-dark">
                {answeredCount === 0
                  ? "Start sharing memories to build their legacy"
                  : answeredCount < 5
                  ? "Great start! Keep adding more memories"
                  : answeredCount < 10
                  ? "Wonderful progress! Each story matters"
                  : "Amazing! You're preserving a rich legacy"}
              </p>
              <p className="text-sm text-gray-500">
                You can always come back and add more later
              </p>
            </div>
            <Button onClick={handleSave} disabled={answeredCount === 0}>
              Save Legacy Interview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
