import React, { useState, useEffect } from "react";
import { FileText, BookOpen, UploadCloud, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "../shared";
import EmptyState from "../shared/EmptyState";
import { getQBankPapers, getQBankQuestions, uploadQBankPaper } from "@/lib/qbankApi";
import ExamQuestion from "../qbank/ExamQuestion";
import FetchButton from "../shared/FetchButton";
import SelectField from "../shared/primitives/SelectField";

export default function CourseQBankTab({ courseCode, username }: { courseCode: string; username: string }) {
  const [detailTab, setDetailTab] = useState<"papers" | "questions">("papers");
  const [papers, setPapers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Upload Form State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState("");
  const [paperType, setPaperType] = useState("CAT 1");
  const [fileUrl, setFileUrl] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        setError(null);
        const papersJson = await getQBankPapers(courseCode);
        if (!papersJson.success) throw new Error("Failed to fetch papers");
        const papersData = papersJson.success ? papersJson.data : [];
        if (!isMounted) return;
        setPapers(papersData);

        const questionsJson = await getQBankQuestions(courseCode);
        if (!questionsJson.success) throw new Error("Failed to fetch questions");
        if (isMounted) setQuestions(questionsJson.success ? questionsJson.data : []);
      } catch (err: any) {
        console.error("Failed to fetch QBank data:", err);
        if (isMounted) {
          setError(err.message || "Failed to load QBank data");
          setPapers([]);
          setQuestions([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [courseCode]);

  const [uploadError, setUploadError] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl || !title || !courseCode) return;

    setIsUploading(true);
    setUploadError("");
    try {
      const payload = {
        courseCode: courseCode.toUpperCase(),
        title,
        paperType,
        examSemester: "Current",
        examYear: new Date().getFullYear().toString(),
        uploaderRegNo: username,
        fileUrl,
      };

      const json = await uploadQBankPaper(payload);
      if (!json.success) {
        throw new Error(json.error || "Upload failed");
      }

      setUploadSuccess(true);
      setTitle("");
      setFileUrl("");
      setTimeout(() => {
        setUploadSuccess(false);
        setShowUploadForm(false);
      }, 3000);
    } catch (err: any) {
      setUploadError("Failed to upload paper. " + (err.message || ""));
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 mt-6">
      {/* Tab Navigation & Upload Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex bg-surface-secondary rounded-lg p-1 w-full sm:w-max">
          <button
            onClick={() => setDetailTab("papers")}
            className={`flex-1 sm:flex-none px-5 py-2 text-sm font-semibold rounded-md transition-all ${
              detailTab === "papers"
                ? "bg-surface text-primary text-primary shadow-sm"
                : "text-text-muted hover:text-text-heading "
            }`}
          >
            Papers ({papers.length})
          </button>
          <button
            onClick={() => setDetailTab("questions")}
            className={`flex-1 sm:flex-none px-5 py-2 text-sm font-semibold rounded-md transition-all ${
              detailTab === "questions"
                ? "bg-surface text-primary text-primary shadow-sm"
                : "text-text-muted hover:text-text-heading "
            }`}
          >
            Questions ({questions.length})
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-border-ink bg-danger-surface text-danger-foreground flex items-start gap-3 w-full">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Failed to load QBank data</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {!showUploadForm && detailTab === "papers" && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:brightness-110 text-primary-foreground text-sm font-semibold rounded-lg transition-colors shadow-sm w-full sm:w-auto"
          >
            <UploadCloud className="w-4 h-4" /> Share a Paper
          </button>
        )}
      </div>

      {/* Inline Upload Form (Frictionless) */}
      {showUploadForm && (
        <div className="mb-8 p-5 bg-surface border-2 border-border-ink rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>

          {uploadSuccess ? (
            <div className="py-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-12 h-12 bg-green-100 text-success-foreground rounded-full flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-text-heading mb-1">Thanks for contributing!</h3>
              <p className="text-text-muted text-sm">Your paper has been queued for admin review.</p>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-text-heading flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-primary" /> Share a Past Paper
                </h3>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="text-xs text-text-muted hover:text-text-muted font-semibold"
                >
                  Cancel
                </button>
              </div>

              {uploadError && (
                <div className="mb-4 p-3 rounded-lg bg-danger-surface text-danger-foreground text-sm border border-border-ink flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-3">
                  <input
                    type="url"
                    required
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="Link to PDF (GDrive, Dropbox, etc)"
                    className="w-full px-3 py-2 text-sm border-2 border-border-ink rounded-lg bg-surface text-text-heading focus:outline-none focus:ring-2 focus:ring-border-ink"
                  />
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Winter Semester 2023 Paper"
                    className="w-full px-3 py-2 text-sm border-2 border-border-ink rounded-lg bg-surface text-text-heading focus:outline-none focus:ring-2 focus:ring-border-ink"
                  />
                </div>
                <div>
                  <SelectField
                    value={paperType}
                    onChange={(val) => setPaperType(val)}
                    options={[
                      { value: "CAT 1", label: "CAT 1" },
                      { value: "CAT 2", label: "CAT 2" },
                      { value: "FAT", label: "FAT" },
                      { value: "Quiz", label: "Quiz" },
                      { value: "Assignment", label: "Assignment" },
                    ]}
                    searchable={false}
                    stacked
                    role="group"
                    aria-label="Paper type"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Document Title (e.g. Winter 2024 CAT 1)"
                    className="w-full px-3 py-2 text-sm border-2 border-border-ink rounded-lg bg-surface text-text-heading focus:outline-none focus:ring-2 focus:ring-border-ink"
                  />
                </div>
                <FetchButton
                  type="submit"
                  loading={isUploading}
                  className="w-full md:w-auto shrink-0 justify-center px-6"
                >
                  Upload
                </FetchButton>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Content Area */}
      {detailTab === "papers" ? (
        papers.length === 0 && !showUploadForm ? (
          <EmptyState
            icon={<FileText className="w-12 h-12" />}
            title="No papers yet"
            action={
              <button
                onClick={() => setShowUploadForm(true)}
                className="text-primary hover:underline text-sm font-semibold"
              >
                Be the first to share one!
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.map((p) => (
              <a
                key={p.source_id}
                href={p.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col p-5 card-surface border border-border-strong dark:border-border rounded-[14px] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary blur-2xl rounded-full -mr-16 -mt-16 pointer-events-none group-hover:bg-secondary transition-colors" />
                <div className="flex items-start gap-4 mb-4 relative z-10">
                  <div className="p-3 bg-secondary text-secondary-foreground rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <h4 className="font-bold text-sm text-text-heading truncate group-hover:text-primary transition-colors">
                      {p.title}
                    </h4>
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted mt-1">{p.source_type}</p>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-border-ink pt-4 relative z-10">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    {p.exam_semester} {p.exam_year}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary group-hover:translate-x-1 transition-transform">
                    View PDF →
                  </span>
                </div>
              </a>
            ))}
          </div>
        )
      ) : questions.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-12 h-12" />}
          title="No extracted questions"
          description="Questions will appear here once an admin approves uploaded papers."
        />
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <ExamQuestion key={q.question_id || idx} question={q} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
