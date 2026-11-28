import { useState } from "react";
import "katex/dist/katex.min.css";
import Latex from "./Latex";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { QBankQuestion } from "@/types/qbank.types";

export default function ExamQuestion({ question, index }: { question: QBankQuestion; index: number }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const isWrong = (opt: string) => selectedOption === opt && opt !== question.correct_answer;

  const handleReset = () => setSelectedOption(null);

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border-ink p-5 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-secondary text-secondary-foreground border-2 border-border-ink text-xs font-bold px-2.5 py-1 rounded-md">
            Q{index + 1}
          </span>
          {question.question_type && (
            <span className="bg-surface-secondary text-text-primary border-2 border-border-ink text-xs px-2 py-1 rounded-md font-medium">
              {question.question_type}
            </span>
          )}
          {question.topic_name && (
            <span className="bg-surface-secondary text-text-muted text-xs px-2 py-1 rounded-md">
              {question.topic_name}
            </span>
          )}
          {question.source_type && (
            <span className="bg-success-surface text-success-foreground dark:text-success-foreground text-xs px-2 py-1 rounded-md font-medium border border-border-ink">
              {question.source_type} • {question.exam_semester} {question.exam_year}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedOption && (
            <button
              onClick={handleReset}
              className="p-1 text-text-muted hover:text-text-muted transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <div className="text-sm font-semibold text-text-muted">[{question.marks || "?"} Marks]</div>
        </div>
      </div>

      {/* Question Text */}
      <div className="text-text-primary text-base leading-relaxed mb-6 overflow-x-auto">
        <Latex>{question.question_text || ""}</Latex>
      </div>

      {/* Fallback Image */}
      {question.image_url && (
        <div className="mb-6 rounded-lg overflow-hidden border border-border-ink bg-surface-secondary">
          <img
            loading="lazy"
            decoding="async"
            src={question.image_url}
            alt={`Question ${index + 1}`}
            className="max-w-full h-auto object-contain"
          />
        </div>
      )}

      {/* Options (MCQ) */}
      {question.question_type === "MCQ" && question.options && Object.keys(question.options).length > 0 && (
        <div className="space-y-2.5">
          {Object.entries(question.options).map(([key, value]) => {
            const wrong = isWrong(key);

            let btnClass = "border-border-ink hover:bg-surface-hover";
            if (selectedOption) {
              if (key === question.correct_answer) btnClass = "border-border-ink bg-success-surface";
              else if (wrong) btnClass = "border-border-ink bg-danger-surface";
              else btnClass = "border-border-ink opacity-40";
            }

            return (
              <button
                key={key}
                disabled={!!selectedOption}
                onClick={() => setSelectedOption(key)}
                className={`w-full flex items-center p-3 rounded-lg border text-left transition-all ${btnClass}`}
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-surface-secondary text-sm font-semibold text-text-primary mr-3">
                  {key}
                </div>
                <div className="flex-grow text-sm text-text-primary overflow-x-auto">
                  <Latex>{(value as string) || ""}</Latex>
                </div>
                {selectedOption && key === question.correct_answer && (
                  <CheckCircle2 className="w-5 h-5 text-success-foreground ml-2 shrink-0" />
                )}
                {selectedOption && wrong && <XCircle className="w-5 h-5 text-danger-foreground ml-2 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Show Answer for Non-MCQ */}
      {question.question_type !== "MCQ" && question.correct_answer && (
        <div className="mt-4">
          {!selectedOption ? (
            <button
              onClick={() => setSelectedOption("SHOW_ANSWER")}
              className="text-sm px-4 py-2 bg-surface-secondary text-text-primary border border-border-ink rounded-lg hover:bg-surface-hover transition-colors font-medium"
            >
              Show Answer / Hints
            </button>
          ) : (
            <div className="p-4 bg-success-surface border border-border-ink rounded-lg">
              <h4 className="font-label text-xs font-bold text-success-foreground mb-2">Answer:</h4>
              <div className="text-sm text-text-primary font-medium">
                <Latex>{question.correct_answer}</Latex>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
