"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChatDetail,
  ChatSummary,
  JobInsights,
  ResumeFeedback,
  User,
  createChat,
  getChatById,
  getJobInsights,
  getResumeFeedback,
  listChats,
  logout,
  me,
  sendMessage,
} from "@/lib/api";
import { clearToken } from "@/lib/auth";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const extractTextFromPdf = async (file: File) => {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

  const bytes = new Uint8Array(await file.arrayBuffer());
  const document = await pdfjs.getDocument({ data: bytes }).promise;

  const chunks: string[] = [];
  for (let pageIndex = 1; pageIndex <= document.numPages; pageIndex += 1) {
    const page = await document.getPage(pageIndex);
    const textContent = await page.getTextContent();
    const textItems = textContent.items as Array<{ str?: string }>;
    chunks.push(textItems.map((item) => item.str ?? "").join(" "));
  }

  return chunks.join("\n").trim();
};

export default function DashboardPage() {
  const router = useRouter();

  const [booting, setBooting] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingResumeFeedback, setLoadingResumeFeedback] = useState(false);

  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChat, setActiveChat] = useState<ChatDetail | null>(null);

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [insights, setInsights] = useState<JobInsights | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [resumeFeedback, setResumeFeedback] = useState<ResumeFeedback | null>(
    null,
  );

  const sortedChats = useMemo(
    () =>
      [...chats].sort(
        (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
      ),
    [chats],
  );

  const refreshChats = async (targetChatId?: string) => {
    const chatList = await listChats();
    setChats(chatList);

    const pickedChatId = targetChatId || chatList[0]?.id;
    if (!pickedChatId) {
      setActiveChat(null);
      return;
    }

    setLoadingChat(true);
    try {
      const detail = await getChatById(pickedChatId);
      setActiveChat(detail);
      setInsights(null);
      setResumeFeedback(null);
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const currentUser = await me();
        setUser(currentUser);
        await refreshChats();
      } catch {
        router.replace("/auth/login");
      } finally {
        setBooting(false);
      }
    };

    void bootstrap();
  }, [router]);

  const handleLogout = async () => {
    clearToken();
    try {
      await logout();
    } catch {
      // best effort logout; user is redirected either way
    }
    router.push("/auth/login");
  };

  const handleCreateChat = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      const created = await createChat({ jobTitle, jobDescription });
      setJobTitle("");
      setJobDescription("");
      await refreshChats(created.id);
    } catch {
      setError("Could not create chat. Check title and description length.");
    }
  };

  const handleSelectChat = async (chatId: string) => {
    setLoadingChat(true);
    setError("");
    try {
      const detail = await getChatById(chatId);
      setActiveChat(detail);
      setInsights(null);
      setResumeFeedback(null);
    } catch {
      setError("Could not load the selected chat.");
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeChat || !messageInput.trim()) {
      return;
    }

    setSendingMessage(true);
    setError("");

    try {
      const updated = await sendMessage(activeChat.id, messageInput.trim());
      setActiveChat(updated);
      setMessageInput("");
      await refreshChats(updated.id);
    } catch {
      setError("Message failed. Please retry.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!activeChat) {
      setError("Create or select a chat first.");
      return;
    }

    setLoadingInsights(true);
    setError("");
    try {
      const data = await getJobInsights({
        jobTitle: activeChat.jobTitle,
        jobDescription: activeChat.jobDescription,
      });
      setInsights(data);
    } catch {
      setError("Could not generate interview insights.");
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleResumeUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      const text = isPdf ? await extractTextFromPdf(file) : await file.text();

      if (text.replace(/\s+/g, " ").trim().length < 100) {
        setError(
          "Could not extract readable text from this file. If this is a scanned PDF, paste resume text manually.",
        );
        return;
      }

      setResumeText(text.slice(0, 30000));
      setError("");
    } catch {
      setError(
        "Could not parse this file. Upload a text-based PDF or paste resume text manually.",
      );
    }
  };

  const handleGenerateResumeFeedback = async () => {
    if (!activeChat) {
      setError("Create or select a chat first.");
      return;
    }
    if (!resumeText.trim()) {
      setError("Upload or paste resume text first.");
      return;
    }

    setLoadingResumeFeedback(true);
    setError("");
    try {
      const data = await getResumeFeedback({
        jobTitle: activeChat.jobTitle,
        jobDescription: activeChat.jobDescription,
        resumeText: resumeText.trim(),
      });
      setResumeFeedback(data);
    } catch {
      setError("Could not generate resume feedback.");
    } finally {
      setLoadingResumeFeedback(false);
    }
  };

  if (booting) {
    return <main className="p-8 text-sm">Loading workspace...</main>;
  }

  return (
    <main className="flex min-h-screen gap-4 p-3 md:p-5">
      <aside className="panel w-full max-w-[360px] p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">InterviewCraft</h1>
            <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
          </div>
          <button
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
        </div>

        <form className="space-y-2" onSubmit={handleCreateChat}>
          <input
            required
            minLength={2}
            maxLength={150}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm"
            placeholder="Job title (e.g. Backend Engineer)"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
          />
          <textarea
            required
            minLength={20}
            maxLength={12000}
            className="h-28 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm"
            placeholder="Paste full job description to start a prep chat"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
          />
          <button
            className="btn-primary w-full rounded-lg px-3 py-2 text-sm"
            type="submit"
          >
            New Chat
          </button>
        </form>

        <div className="mt-5">
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-[var(--text-muted)]">
            Previous Chats
          </h2>
          <div className="space-y-2">
            {sortedChats.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No chats yet.</p>
            ) : (
              sortedChats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => void handleSelectChat(chat.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    activeChat?.id === chat.id
                      ? "border-[var(--brand)] bg-[var(--accent-soft)]"
                      : "border-[var(--line)] bg-[var(--surface)]"
                  }`}
                >
                  <div className="font-medium">{chat.jobTitle}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {formatDate(chat.updatedAt)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      <section className="panel flex-1 p-4 md:p-5">
        {!activeChat ? (
          <p className="text-sm text-[var(--text-muted)]">
            Create a chat using a job description to start.
          </p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            <article className="xl:col-span-2">
              <header className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {activeChat.jobTitle}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Live prep chat for this role
                  </p>
                </div>
              </header>

              <div className="h-[48vh] space-y-3 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                {loadingChat ? (
                  <p className="text-sm">Loading chat...</p>
                ) : null}
                {activeChat.messages.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">
                    Ask for interview questions, mock answers, or practice
                    drills.
                  </p>
                ) : (
                  activeChat.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-xl p-3 text-sm ${
                        message.role === "assistant"
                          ? "bg-[var(--bubble-assistant)] border border-[var(--line)]"
                          : "bg-[var(--bubble-user)]"
                      }`}
                    >
                      <p className="mb-1 text-xs uppercase tracking-wide text-[var(--text-muted)]">
                        {message.role}
                      </p>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form className="mt-3 flex gap-2" onSubmit={handleSendMessage}>
                <input
                  className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm"
                  placeholder="Ask the LLM about this role..."
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                />
                <button
                  disabled={sendingMessage}
                  className="btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-60"
                  type="submit"
                >
                  {sendingMessage ? "Sending..." : "Send"}
                </button>
              </form>
            </article>

            <aside className="space-y-4">
              <section className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Job Insights</h3>
                  <button
                    disabled={loadingInsights}
                    className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-xs"
                    type="button"
                    onClick={handleGenerateInsights}
                  >
                    {loadingInsights ? "Generating..." : "Generate"}
                  </button>
                </div>
                {insights ? (
                  <div className="space-y-2 text-sm">
                    <p>{insights.roleSummary}</p>
                    <p className="text-xs font-semibold">Practice Questions</p>
                    <ul className="list-disc pl-5 text-xs">
                      {insights.suggestedPracticeQuestions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <p className="text-xs font-semibold">
                      Guideline (30/60/90)
                    </p>
                    <ul className="list-disc pl-5 text-xs">
                      {insights.days30_60_90.first30Days.map((item) => (
                        <li key={`30-${item}`}>0-30: {item}</li>
                      ))}
                      {insights.days30_60_90.days31To60.map((item) => (
                        <li key={`60-${item}`}>31-60: {item}</li>
                      ))}
                      {insights.days30_60_90.days61To90.map((item) => (
                        <li key={`90-${item}`}>61-90: {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">
                    Generate interview questions and a practical prep guideline
                    from this job description.
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                <h3 className="mb-2 text-sm font-semibold">Resume Feedback</h3>
                <label className="mb-2 block text-xs text-[var(--text-muted)]">
                  Upload resume (PDF/TXT) or paste text:
                </label>
                <input
                  className="mb-2 block w-full text-xs"
                  onChange={handleResumeUpload}
                  type="file"
                />
                <textarea
                  className="h-28 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-2 text-xs"
                  placeholder="Paste resume text"
                  value={resumeText}
                  onChange={(event) => setResumeText(event.target.value)}
                />
                <button
                  disabled={loadingResumeFeedback}
                  className="btn-primary mt-2 w-full rounded-lg px-3 py-2 text-sm disabled:opacity-60"
                  type="button"
                  onClick={handleGenerateResumeFeedback}
                >
                  {loadingResumeFeedback ? "Analyzing..." : "Get Feedback"}
                </button>

                {resumeFeedback ? (
                  <div className="mt-3 space-y-2 text-xs">
                    <p>{resumeFeedback.overallAssessment}</p>
                    <p className="font-semibold text-[var(--ok)]">Strengths</p>
                    <ul className="list-disc pl-5">
                      {resumeFeedback.strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <p className="font-semibold text-[var(--warn)]">Gaps</p>
                    <ul className="list-disc pl-5">
                      {resumeFeedback.gaps.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            </aside>
          </div>
        )}

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>
    </main>
  );
}
